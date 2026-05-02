import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { FONT_PDF_STYLESHEET_HREF } from "@/lib/domains/brochure";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function handleGeneratePdf(req: NextRequest) {
  try {
    const body = await req.json();
    const html = typeof body?.html === "string" ? body.html : "";
    const css = typeof body?.css === "string" ? body.css : "";
    const watermarkText = typeof body?.watermarkText === "string" ? body.watermarkText.trim() : "";
    const template = typeof body?.template === "string" ? body.template : "";

    const spreadPagesRaw = body?.spreadPages;
    const spreadPages =
      typeof spreadPagesRaw === "number"
      && Number.isFinite(spreadPagesRaw)
      && spreadPagesRaw >= 1
        ? Math.min(24, Math.floor(spreadPagesRaw))
        : 1;

    const isPoster = template === "posterFlyer";
    const pageWidth = isPoster ? "210mm" : "260mm";
    const pageHeight = isPoster ? "297mm" : "180mm";

    if (!html.trim()) {
      return NextResponse.json({ error: "html is required." }, { status: 400 });
    }

    const multiSpreadCss =
      !isPoster && spreadPages > 1
        ? `
                    .pdf-export-sheet {
                        width: ${pageWidth};
                        height: ${pageHeight};
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #ffffff;
                        page-break-after: always;
                        break-after: page;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .pdf-export-sheet:last-of-type {
                        page-break-after: auto;
                        break-after: auto;
                    }
                    .pdf-export-sheet img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        display: block;
                    }
                `
        : "";

    const safeWatermark = watermarkText ? escapeHtml(watermarkText.slice(0, 160)) : "";
    const watermarkMarkup = safeWatermark
      ? `
          <div class="pdf-watermark-layer">
            <div class="pdf-watermark-stack">
              <p class="pdf-watermark-text">${safeWatermark}</p>
              <p class="pdf-watermark-text">${safeWatermark}</p>
              <p class="pdf-watermark-text">${safeWatermark}</p>
            </div>
          </div>
        `
      : "";

    console.log("Launching browser...");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
      timeout: 60000,
    });

    console.log("Creating page...");
    const page = await browser.newPage();

    const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
              <link rel="stylesheet" href="${FONT_PDF_STYLESHEET_HREF}" />
                <style>
                    ${css}
                    ${multiSpreadCss}
                    @page {
                        size: ${pageWidth} ${pageHeight};
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                      position: relative;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .pdf-watermark-layer {
                      position: fixed;
                      inset: 0;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      pointer-events: none;
                      z-index: 99999;
                    }
                    .pdf-watermark-stack {
                      transform: rotate(-30deg);
                      display: flex;
                      flex-direction: column;
                      gap: 78px;
                      align-items: center;
                    }
                    .pdf-watermark-text {
                      font-family: Arial, sans-serif;
                      font-size: 34px;
                      letter-spacing: 0.12em;
                      font-weight: 800;
                      color: rgba(220, 38, 38, 0.28);
                      text-transform: uppercase;
                      white-space: nowrap;
                    }
                </style>
            </head>
            <body>
                  ${watermarkMarkup}
                ${html}
            </body>
            </html>
        `;

    console.log("Setting content...");
    await page.setContent(fullHtml, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log("Generating PDF...");
    await page.setViewport({ width: 1200, height: 800 });

    const singleSizedPdf = isPoster || spreadPages <= 1;

    const pdfBuffer = await page.pdf({
      ...(singleSizedPdf ? { width: pageWidth, height: pageHeight } : {}),
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${isPoster ? "poster" : "brochure"}-${Date.now()}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "PDF generation failed.";
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
