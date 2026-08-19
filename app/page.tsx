"use client"

import dynamic from "next/dynamic"
import {
  useCallback,
  useRef,
  useState,
} from "react"

import {
  streamRfpResponse,
} from "./lib/rfp-stream"


const SimpleEditor = dynamic(
  () =>
    import(
      "@/app/editor/simple-editor"
    ).then(
      (mod) => mod.SimpleEditor
    ),
  {
    ssr: false,
  }
)


import type {
  SimpleEditorRef,
} from "@/app/editor/simple-editor"


type Status =
  | "idle"
  | "ready"
  | "generating"
  | "complete"
  | "error"


const STATUS_LABEL: Record<
  Status,
  string
> = {

  idle:
    "Upload an RFP to get started",

  ready:
    "Ready to generate response",

  generating:
    "Generating response…",

  complete:
    "Response complete",

  error:
    "Generation stopped — partial response available",
}


export default function Page() {

  // ========================================================
  // State
  // ========================================================

  const [
    status,
    setStatus,
  ] =
    useState<Status>("idle")


  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(null)


  const [
    content,
    setContent,
  ] =
    useState("")


  const [
    fileName,
    setFileName,
  ] =
    useState<string | null>(null)


  const [
    fileUrl,
    setFileUrl,
  ] =
    useState<string | null>(null)


  const [
    sourceMarkdown,
    setSourceMarkdown,
  ] =
    useState("")


  const [
    error,
    setError,
  ] =
    useState<string | null>(null)


  const abortRef =
    useRef<AbortController | null>(
      null
    )


  const editorRef =
    useRef<SimpleEditorRef>(null)


  const isGenerating =
    status === "generating"


  // ========================================================
  // Upload
  // ========================================================

  const handleFileChange =
    useCallback(
      async (
        e: React.ChangeEvent<HTMLInputElement>
      ) => {

        const file =
          e.target.files?.[0]


        if (!file) {
          return
        }


        // --------------------------------------------------
        // Reset previous generation
        // --------------------------------------------------

        setError(null)

        setContent("")

        setFileName(
          file.name
        )

        setSelectedFile(
          file
        )

        setStatus(
          "ready"
        )


        // --------------------------------------------------
        // Show original PDF
        // --------------------------------------------------

        if (
          file.type ===
          "application/pdf"
        ) {

          const url =
            URL.createObjectURL(
              file
            )

          setFileUrl(
            url
          )

        } else {

          setFileUrl(
            null
          )
        }


        // --------------------------------------------------
        // Temporary source content
        // --------------------------------------------------

        const mockSourceMarkdown = `
# RFP Document

## Document

${file.name}

## Requirements

The bank requires a secure and scalable banking platform.

The solution must provide:

- High availability
- Secure API communication
- Transaction processing
- Audit logging
- Monitoring
- Disaster recovery
- Scalability

## Submission

The vendor shall provide a complete technical and commercial response.
`


        setSourceMarkdown(
          mockSourceMarkdown
        )


        // --------------------------------------------------
        // Allow same file to be selected again
        // --------------------------------------------------

        e.target.value = ""

      },
      []
    )


  // ========================================================
  // Generate
  // ========================================================

  const handleGenerate =
    useCallback(
      async () => {

        if (
          status !== "ready"
        ) {
          return
        }


        if (
          !selectedFile
        ) {

          setError(
            "No PDF file selected."
          )

          setStatus(
            "error"
          )

          return
        }


        if (
          !sourceMarkdown.trim()
        ) {

          setError(
            "RFP content is empty."
          )

          setStatus(
            "error"
          )

          return
        }


        // --------------------------------------------------
        // Reset generation state
        // --------------------------------------------------

        setError(null)

        setContent("")

        setStatus(
          "generating"
        )


        const controller =
          new AbortController()


        abortRef.current =
          controller


        try {

          await streamRfpResponse({

            file:
              selectedFile,

            clientName:
              "TPS",

            industry:
              "Banking",

            signal:
              controller.signal,


            // ------------------------------------------------
            // START
            // ------------------------------------------------

            onStart: () => {

              console.log(
                "[PAGE] Generation started"
              )

            },


            // ------------------------------------------------
            // CHUNK
            // ------------------------------------------------

            onChunk: (
              chunk
            ) => {

              console.log(
                "[PAGE] Received chunk:",
                chunk
              )


              setContent(
                previous =>
                  previous + chunk
              )
            },


            // ------------------------------------------------
            // COMPLETE
            // ------------------------------------------------

            onComplete: () => {

              console.log(
                "[PAGE] SSE complete"
              )
            },

          })


          // --------------------------------------------------
          // Backend completed successfully
          // --------------------------------------------------

          setStatus(
            "complete"
          )


        } catch (err) {

          console.error(
            "[PAGE] Generation error:",
            err
          )


          // --------------------------------------------------
          // User cancelled
          // --------------------------------------------------

          if (
            err instanceof Error &&
            err.name ===
            "AbortError"
          ) {

            /*
             * Do NOT clear content.
             *
             * Anything already streamed remains available.
             */

            setStatus(
              content.trim()
                ? "error"
                : "ready"
            )

            return
          }


          // --------------------------------------------------
          // Backend/network error
          // --------------------------------------------------

          const message =
            err instanceof Error
              ? err.message
              : String(err)


          setError(
            message
          )


          /*
           * IMPORTANT:
           *
           * DO NOT:
           *
           * setContent("")
           *
           * Keep all section_added chunks
           * already received from the backend.
           */

          setStatus(
            "error"
          )

        } finally {

          abortRef.current =
            null
        }

      },
      [
        status,
        sourceMarkdown,
        selectedFile,
        content,
      ]
    )


  // ========================================================
  // Cancel
  // ========================================================

  const handleCancel =
    useCallback(
      () => {

        abortRef.current?.abort()

        abortRef.current =
          null


        /*
         * Do not clear editor content.
         *
         * Partial RFP remains available.
         */

        setStatus(
          content.trim()
            ? "error"
            : "ready"
        )


        if (
          content.trim()
        ) {

          setError(
            "Generation cancelled. The response generated so far is available."
          )
        }

      },
      [
        content,
      ]
    )


  // ========================================================
  // Download PDF
  // ========================================================

  const handleDownloadPdf =
    useCallback(
      async () => {

        /*
         * We can download when there is ANY content,
         * regardless of whether generation completed.
         */

        if (
          !content.trim()
        ) {

          setError(
            "There is no generated content to download."
          )

          return
        }


        setError(
          null
        )


        try {

          const backendUrl =
            process.env
              .NEXT_PUBLIC_BACKEND_URL ||
            "http://localhost:8000"


          // =================================================
          // Get latest editor markdown
          // =================================================

          let currentMarkdown =
            ""


          try {

            currentMarkdown =
              editorRef.current
                ?.getMarkdown()
                ?.trim() || ""

          } catch (
          editorError
          ) {

            console.warn(
              "[PDF] Could not read editor:",
              editorError
            )
          }


          // =================================================
          // IMPORTANT FALLBACK
          //
          // If Tiptap has not synchronized the latest
          // streamed content yet, use React state.
          // =================================================

          if (
            !currentMarkdown
          ) {

            currentMarkdown =
              content.trim()
          }


          if (
            !currentMarkdown
          ) {

            throw new Error(
              "No generated markdown is available."
            )
          }


          console.log(
            "[PDF] Markdown length:",
            currentMarkdown.length
          )


          console.log(
            "[PDF] Markdown preview:",
            currentMarkdown.slice(
              0,
              500
            )
          )


          // =================================================
          // Generate PDF
          // =================================================

          const response =
            await fetch(
              `${backendUrl}/requirements/export_pdf`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    content:
                      currentMarkdown,
                  }),
              }
            )


          // =================================================
          // Backend error
          // =================================================

          if (
            !response.ok
          ) {

            const message =
              await response.text()


            throw new Error(
              message ||
              "Failed to generate PDF."
            )
          }


          // =================================================
          // Get PDF blob
          // =================================================

          const blob =
            await response.blob()


          if (
            blob.size === 0
          ) {

            throw new Error(
              "Backend returned an empty PDF."
            )
          }


          console.log(
            "[PDF] Received PDF:",
            blob.size,
            "bytes"
          )


          // =================================================
          // Download
          // =================================================

          const url =
            URL.createObjectURL(
              blob
            )


          const link =
            document.createElement(
              "a"
            )


          link.href =
            url


          link.download =
            `${fileName?.replace(
              /\.[^/.]+$/,
              ""
            ) || "rfp-response"}-response.pdf`


          document.body.appendChild(
            link
          )


          link.click()


          link.remove()


          // Give browser time to consume blob URL
          setTimeout(
            () => {
              URL.revokeObjectURL(
                url
              )
            },
            1000
          )


        } catch (err) {

          console.error(
            "[PDF] Download failed:",
            err
          )


          setError(
            err instanceof Error
              ? err.message
              : String(err)
          )
        }

      },
      [
        content,
        fileName,
      ]
    )


  // ========================================================
  // Render
  // ========================================================

  const hasContent =
    content.trim().length > 0


  return (

    <div
      className="
        flex
        h-full
        flex-col
      "
    >

      {/* ================================================== */}
      {/* Toolbar */}
      {/* ================================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-3
          border-b
          border-gray-200
          bg-gray-50
          px-4
          py-3
        "
      >

        {/* ================================================= */}
        {/* Upload */}
        {/* ================================================= */}

        <input
          type="file"
          id="file-upload"
          onChange={
            handleFileChange
          }
          accept=".pdf"
          disabled={
            isGenerating
          }
          className="hidden"
        />


        <label
          htmlFor="file-upload"
          className={`
            inline-flex
            cursor-pointer
            items-center
            rounded-md
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition-colors

            ${isGenerating
              ? "cursor-not-allowed bg-blue-300"
              : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          Upload Your RFP
        </label>


        {/* ================================================= */}
        {/* Generate / Cancel */}
        {/* ================================================= */}

        {!isGenerating ? (

          <button
            onClick={
              handleGenerate
            }
            disabled={
              status !== "ready"
            }
            className={`
              inline-flex
              items-center
              rounded-md
              px-4
              py-2
              text-sm
              font-medium
              text-white

              ${status === "ready"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "cursor-not-allowed bg-emerald-300"
              }
            `}
          >
            Generate Response
          </button>

        ) : (

          <button
            onClick={
              handleCancel
            }
            className="
              inline-flex
              items-center
              rounded-md
              bg-red-600
              px-4
              py-2
              text-sm
              font-medium
              text-white
              hover:bg-red-700
            "
          >
            Cancel
          </button>

        )}


        {/* ================================================= */}
        {/* Download */}
        {/* ================================================= */}

        <button
          onClick={
            handleDownloadPdf
          }
          disabled={
            !hasContent ||
            isGenerating
          }
          className={`
            inline-flex
            items-center
            rounded-md
            px-4
            py-2
            text-sm
            font-medium
            text-white

            ${hasContent &&
              !isGenerating
              ? "bg-slate-700 hover:bg-slate-800"
              : "cursor-not-allowed bg-slate-300"
            }
          `}
        >
          {status === "error"
            ? "Download Current PDF"
            : "Download PDF"}
        </button>


        {/* ================================================= */}
        {/* Status */}
        {/* ================================================= */}

        <div
          className="
            ml-2
            flex
            items-center
            gap-2
            text-sm
            text-gray-600
          "
        >

          {isGenerating && (

            <span
              className="
                h-3.5
                w-3.5
                animate-spin
                rounded-full
                border-2
                border-gray-300
                border-t-blue-600
              "
            />

          )}


          <span>
            {
              STATUS_LABEL[
              status
              ]
            }
          </span>


          {fileName && (

            <span
              className="
                text-gray-400
              "
            >
              · {fileName}
            </span>

          )}

        </div>


        {/* ================================================= */}
        {/* Error */}
        {/* ================================================= */}

        {error && (

          <div
            className="
              w-full
              text-sm
              text-red-600
            "
            role="alert"
          >
            {error}

            {hasContent && (
              <span className="ml-1">
                The generated sections received so far are still available for download.
              </span>
            )}
          </div>

        )}

      </div>


      {/* ================================================== */}
      {/* Main */}
      {/* ================================================== */}

      <div
        className="
          flex
          min-h-0
          flex-1
          gap-4
          p-4
        "
      >

        {/* ================================================= */}
        {/* Original PDF */}
        {/* ================================================= */}

        <div
          className="
            flex
            min-w-0
            flex-1
            flex-col
            overflow-hidden
            rounded-lg
            border
            border-gray-200
            bg-gray-100
          "
        >

          <div
            className="
              border-b
              bg-gray-50
              px-4
              py-2
              text-sm
              font-medium
              text-gray-700
            "
          >
            Original RFP
          </div>


          {fileUrl ? (

            <iframe
              src={fileUrl}
              title="Original RFP"
              className="
                h-full
                w-full
                border-0
              "
            />

          ) : (

            <div
              className="
                flex
                h-full
                items-center
                justify-center
                text-sm
                text-gray-400
              "
            >
              Upload a PDF to preview it
            </div>

          )}

        </div>


        {/* ================================================= */}
        {/* Response Editor */}
        {/* ================================================= */}

        <div
          className="
            flex
            min-w-0
            flex-1
            flex-col
            overflow-hidden
            rounded-lg
            border
            border-gray-200
            bg-white
          "
        >

          <div
            className="
              border-b
              bg-gray-50
              px-4
              py-2
              text-sm
              font-medium
              text-gray-700
            "
          >
            Generated Response
          </div>


          <div
            className="
              min-h-0
              flex-1
              overflow-auto
            "
          >

            <SimpleEditor
              content={
                content
              }
              ref={
                editorRef
              }
            />

          </div>

        </div>

      </div>

    </div>
  )
}