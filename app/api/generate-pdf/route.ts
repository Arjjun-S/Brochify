import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest) {
  try {
    const { html, css } = await req.json();

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

    // Combine HTML and CSS
    const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    ${css}
                    @page {
                        size: 260mm 180mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    /* Ensure fonts and layout are preserved */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
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

    // Set viewport for better layout if needed (e.g., matching the 260mm x 180mm of brochure)
    // 260mm is ~982px at 96dpi, 180mm is ~680px
    await page.setViewport({ width: 1200, height: 800 });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      width: "260mm",
      height: "180mm",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="brochure-${Date.now()}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "PDF generation failed.";
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
