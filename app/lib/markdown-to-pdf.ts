import { marked } from "marked"

export async function downloadMarkdownAsPdf(
    markdown: string,
    filename: string
): Promise<void> {
    if (!markdown || !markdown.trim()) {
        throw new Error(
            "There is no response content to export."
        )
    }

    /*
     * IMPORTANT:
     *
     * html2pdf.js accesses browser globals such as `self`.
     * Therefore DO NOT import it at the top of the file.
     *
     * Dynamic import ensures it is loaded only when the
     * user clicks Download PDF in the browser.
     */
    if (typeof window === "undefined") {
        throw new Error(
            "PDF generation is only available in the browser."
        )
    }

    const html2pdfModule =
        await import("html2pdf.js")

    /*
     * Depending on the bundler, html2pdf.js may be exposed
     * as default or directly.
     */
    const html2pdf =
        html2pdfModule.default ||
        html2pdfModule

    /*
     * Convert Markdown -> HTML.
     */
    const html = await marked.parse(
        markdown,
        {
            gfm: true,
            breaks: true,
        }
    )

    /*
     * Create a completely separate HTML document
     * for PDF generation.
     */
    const container =
        document.createElement("div")

    container.id =
        "rfp-pdf-export"

    /*
     * Put the container somewhere visible to the
     * browser rendering engine.
     *
     * DO NOT use display:none.
     *
     * html2canvas cannot reliably render display:none
     * elements.
     */
    container.style.position =
        "fixed"

    container.style.left =
        "0"

    container.style.top =
        "0"

    container.style.width =
        "794px"

    container.style.backgroundColor =
        "#ffffff"

    container.style.padding =
        "50px"

    container.style.zIndex =
        "-9999"

    container.style.opacity =
        "1"

    container.style.pointerEvents =
        "none"

    container.style.boxSizing =
        "border-box"

    /*
     * Build the actual HTML document.
     */
    container.innerHTML = `
    <div class="rfp-pdf-document">
      ${html}
    </div>
  `

    /*
     * Add PDF-specific styling.
     */
    const style =
        document.createElement("style")

    style.textContent = `
    #rfp-pdf-export {
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.6;
    }

    #rfp-pdf-export .rfp-pdf-document {
      width: 100%;
      background: #ffffff;
    }

    #rfp-pdf-export h1 {
      font-size: 28px;
      line-height: 1.25;
      margin: 0 0 24px 0;
      color: #111827;
      font-weight: 700;
    }

    #rfp-pdf-export h2 {
      font-size: 21px;
      line-height: 1.3;
      margin: 30px 0 12px 0;
      color: #111827;
      font-weight: 700;
    }

    #rfp-pdf-export h3 {
      font-size: 17px;
      line-height: 1.35;
      margin: 24px 0 10px 0;
      color: #111827;
      font-weight: 700;
    }

    #rfp-pdf-export h4 {
      font-size: 15px;
      line-height: 1.4;
      margin: 20px 0 8px 0;
      color: #111827;
      font-weight: 700;
    }

    #rfp-pdf-export p {
      margin: 0 0 12px 0;
    }

    #rfp-pdf-export ul,
    #rfp-pdf-export ol {
      margin: 8px 0 16px 0;
      padding-left: 28px;
    }

    #rfp-pdf-export li {
      margin-bottom: 5px;
    }

    #rfp-pdf-export strong {
      font-weight: 700;
    }

    #rfp-pdf-export em {
      font-style: italic;
    }

    #rfp-pdf-export blockquote {
      margin: 16px 0;
      padding: 8px 16px;
      border-left: 4px solid #9ca3af;
      color: #4b5563;
    }

    #rfp-pdf-export hr {
      margin: 24px 0;
      border: 0;
      border-top: 1px solid #d1d5db;
    }

    #rfp-pdf-export table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0 22px 0;
      font-size: 11px;
      page-break-inside: auto;
    }

    #rfp-pdf-export thead {
      display: table-header-group;
    }

    #rfp-pdf-export tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    #rfp-pdf-export th,
    #rfp-pdf-export td {
      border: 1px solid #9ca3af;
      padding: 7px;
      text-align: left;
      vertical-align: top;
    }

    #rfp-pdf-export th {
      background: #f3f4f6;
      font-weight: 700;
    }

    #rfp-pdf-export code {
      font-family:
        "Courier New",
        monospace;
      background: #f3f4f6;
      padding: 2px 4px;
      border-radius: 3px;
    }

    #rfp-pdf-export pre {
      background: #f3f4f6;
      padding: 14px;
      border-radius: 4px;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      page-break-inside: avoid;
    }

    #rfp-pdf-export a {
      color: #2563eb;
      text-decoration: underline;
    }

    #rfp-pdf-export img {
      max-width: 100%;
      height: auto;
    }
  `

    container.prepend(style)

    document.body.appendChild(
        container
    )

    /*
     * Give the browser a chance to actually render
     * the generated HTML before html2canvas captures it.
     */
    await waitForBrowserPaint()

    /*
     * Make sure there is actually something to render.
     */
    const documentElement =
        container.querySelector(
            ".rfp-pdf-document"
        )

    if (!documentElement) {
        document.body.removeChild(
            container
        )

        throw new Error(
            "Failed to create PDF content."
        )
    }

    if (
        !documentElement.textContent?.trim()
    ) {
        document.body.removeChild(
            container
        )

        throw new Error(
            "Generated PDF content is empty."
        )
    }

    try {
        await html2pdf()
            .set({
                margin: [
                    15,
                    15,
                    15,
                    15,
                ],

                filename,

                image: {
                    type: "jpeg",
                    quality: 0.98,
                },

                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                },

                jsPDF: {
                    unit: "mm",
                    format: "a4",
                    orientation: "portrait",
                },

                pagebreak: {
                    mode: [
                        "css",
                        "legacy",
                    ],
                },
            })
            .from(documentElement)
            .save()
    } finally {
        document.body.removeChild(
            container
        )
    }
}

/*
 * Wait until browser has painted the generated HTML.
 */
function waitForBrowserPaint(): Promise<void> {
    return new Promise(
        (resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve()
                })
            })
        }
    )
}