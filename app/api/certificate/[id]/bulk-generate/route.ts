import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { launchPuppeteer } from "@/lib/server/puppeteer";
import {
  getCertificateDownloadFileName,
  normalizeCertificateStudentRows,
  renderCertificateHtmlForStudent,
} from "@/lib/domains/certificate";
import { readSessionFromRequest } from "@/lib/server/auth";
import { getCertificateByIdForUser } from "@/lib/server/data";

export const runtime = "nodejs";

type OutputFormat = "pdf" | "png" | "jpg";

const VALID_FORMATS = new Set<OutputFormat>(["pdf", "png", "jpg"]);

function parseCertificateId(rawId: string): number | null {
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

function toBuffer(input: Uint8Array | string): Buffer {
  if (typeof input === "string") {
    return Buffer.from(input);
  }
  return Buffer.from(input);
}

function buildStudentDocument(pageHtml: string, watermarkText: string | null): string {
  const watermarkMarkup = watermarkText
    ? `<div class="certificate-watermark">${watermarkText}</div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page {
            size: 260mm 180mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 983px;
            height: 680px;
            overflow: hidden;
            background: #ffffff;
            font-family: "Times New Roman", Times, serif;
          }

          .certificate-watermark {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            transform: rotate(-30deg);
            color: rgba(185, 28, 28, 0.26);
            font-size: 42px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            z-index: 9999;
            white-space: pre;
          }
        </style>
      </head>
      <body>
        ${watermarkMarkup}
        ${pageHtml}
      </body>
    </html>
  `;
}

function withAbsoluteImageUrls<T extends { overlayItems?: Array<Record<string, unknown>> }>(
  state: T,
  origin: string,
): T {
  if (!Array.isArray(state.overlayItems)) {
    return state;
  }

  const overlayItems = state.overlayItems.map((item) => {
    if (item.type !== "image") {
      return item;
    }

    const rawSrc = typeof item.src === "string" ? item.src.trim() : "";
    if (!rawSrc || rawSrc.startsWith("data:") || rawSrc.startsWith("http://") || rawSrc.startsWith("https://")) {
      return item;
    }

    if (rawSrc.startsWith("/")) {
      return {
        ...item,
        src: `${origin}${rawSrc}`,
      };
    }

    return item;
  });

  return {
    ...state,
    overlayItems,
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const certificateId = parseCertificateId(params.id);
  if (!certificateId) {
    return NextResponse.json({ error: "Invalid certificate id." }, { status: 400 });
  }

  const certificate = await getCertificateByIdForUser(certificateId, session);
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      format?: OutputFormat;
      rows?: Array<Record<string, unknown>>;
    };

    const format = VALID_FORMATS.has(body.format as OutputFormat)
      ? (body.format as OutputFormat)
      : "pdf";

    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) {
      return NextResponse.json({ error: "No student records uploaded." }, { status: 400 });
    }

    const students = normalizeCertificateStudentRows(rows, {
      eventName: certificate.content.templateInput.eventName,
      issueDate: certificate.content.templateInput.issueDate,
    });

    if (students.length === 0) {
      return NextResponse.json({ error: "Uploaded file has no valid student rows." }, { status: 400 });
    }

    const watermarkText =
      certificate.status === "approved"
        ? null
        : "Brochify generated     NOT Approved";

    const zip = new JSZip();

    const browser = await launchPuppeteer({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
      timeout: 60000,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 983, height: 680 });

      const batchSize = 20;
      for (let startIndex = 0; startIndex < students.length; startIndex += batchSize) {
        const batch = students.slice(startIndex, startIndex + batchSize);

        for (let localIndex = 0; localIndex < batch.length; localIndex += 1) {
          const globalIndex = startIndex + localIndex;
          const student = batch[localIndex];
          const contentWithAbsoluteUrls = withAbsoluteImageUrls(certificate.content, request.nextUrl.origin);
          const pageHtml = renderCertificateHtmlForStudent(contentWithAbsoluteUrls, student);
          const documentHtml = buildStudentDocument(pageHtml, watermarkText);

          await page.setContent(documentHtml, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
          });

          await page.waitForSelector("img", { timeout: 60000 }).catch(() => undefined);
          await page.waitForNetworkIdle({ idleTime: 350, timeout: 60000 }).catch(() => undefined);
          await page.evaluate(async () => {
            const pending = Array.from(document.images)
              .filter((img) => !img.complete)
              .map(
                (img) =>
                  new Promise<void>((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                  }),
              );

            await Promise.all(pending);
          });

          const fileName = getCertificateDownloadFileName(student.serialNo, globalIndex, format);

          if (format === "pdf") {
            const pdfBytes = await page.pdf({
              width: "260mm",
              height: "180mm",
              printBackground: true,
              preferCSSPageSize: true,
            });
            zip.file(fileName, toBuffer(pdfBytes));
            continue;
          }

          const pageElement = await page.$(".certificate-page");
          if (!pageElement) {
            throw new Error("Failed to render certificate page for export.");
          }

          const imageBytes = await pageElement.screenshot({
            type: format === "jpg" ? "jpeg" : "png",
            quality: format === "jpg" ? 92 : undefined,
          });

          zip.file(fileName, toBuffer(imageBytes));
        }
      }
    } finally {
      await browser.close();
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="certificates-${Date.now()}.zip"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bulk generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
