export interface StreamRfpResponseOptions {
    file: File | null
    clientName?: string
    industry?: string
    signal?: AbortSignal

    onStart?: () => void
    onChunk: (chunk: string) => void
    onComplete?: () => void
}


// =============================================================
// SSE RESPONSE TYPES
// =============================================================

export interface StreamRfpResponse {
    type?: string
    content?: string
    heading?: string
    markdown?: string
    message?: string
    sections_count?: number
    stopped_reason?: string
    attempt?: number
}


// =============================================================
// BACKEND URL
// =============================================================

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000"


const URL =
    `${BACKEND_URL}/requirements/generate_rfp_response`


// =============================================================
// MAIN STREAM FUNCTION
// =============================================================

export async function streamRfpResponse({
    file,
    clientName,
    industry,
    signal,
    onStart,
    onChunk,
    onComplete,
}: StreamRfpResponseOptions): Promise<void> {

    // =========================================================
    // 1. Validate file
    // =========================================================

    if (!file) {
        throw new Error("No PDF file selected.")
    }


    if (
        !file.name
            .toLowerCase()
            .endsWith(".pdf")
    ) {
        throw new Error("Only PDF files are supported.")
    }


    // =========================================================
    // 2. Create multipart/form-data
    // =========================================================

    const formData = new FormData()


    formData.append(
        "file",
        file
    )


    formData.append(
        "client_name",
        clientName ?? "TPS"
    )


    formData.append(
        "industry",
        industry ?? "Banking"
    )


    console.log(
        "[RFP] Sending file:",
        file.name
    )


    console.log(
        "[RFP] File size:",
        file.size
    )


    console.log(
        "[RFP] File type:",
        file.type
    )


    // =========================================================
    // 3. Send request
    // =========================================================

    const response = await fetch(
        URL,
        {
            method: "POST",

            headers: {
                Accept: "text/event-stream",
            },

            body: formData,

            signal,
        }
    )


    console.log(
        "[RFP] Response:",
        response.status,
        response.statusText
    )


    // =========================================================
    // 4. Handle HTTP errors
    // =========================================================

    if (!response.ok) {

        const errorText =
            await response.text()


        console.error(
            "[RFP] Backend error:",
            errorText
        )


        throw new Error(
            errorText ||
            `Generation failed: ${response.status}`
        )
    }


    // =========================================================
    // 5. Make sure response is streaming
    // =========================================================

    if (!response.body) {

        throw new Error(
            "Backend did not return a streaming response."
        )
    }


    // =========================================================
    // 6. Create stream reader
    // =========================================================

    const reader =
        response.body.getReader()


    const decoder =
        new TextDecoder()


    /*
     * SSE data can arrive split across network chunks.
     *
     * Example:
     *
     * data: {"type":"section_
     *
     * added","heading":"Introduction"}
     *
     * Therefore incomplete data is kept in buffer.
     */

    let buffer = ""


    // =========================================================
    // 7. Tell page generation started
    // =========================================================

    onStart?.()


    try {

        // =====================================================
        // 8. Read stream
        // =====================================================

        while (true) {

            const {
                done,
                value,
            } = await reader.read()


            if (done) {
                break
            }


            buffer += decoder.decode(
                value,
                {
                    stream: true,
                }
            )


            /*
             * SSE events are separated by:
             *
             * \n\n
             */

            const events =
                buffer.split(/\r?\n\r?\n/)


            /*
             * Last event may be incomplete.
             */

            buffer =
                events.pop() || ""


            // =================================================
            // Process complete events
            // =================================================

            for (
                const event of events
            ) {

                processSseEvent(
                    event,
                    onChunk
                )
            }
        }


        // =====================================================
        // 9. Flush decoder
        // =====================================================

        buffer += decoder.decode()


        if (
            buffer.trim()
        ) {

            processSseEvent(
                buffer,
                onChunk
            )
        }


        // =====================================================
        // 10. Stream completed
        // =====================================================

        onComplete?.()


    } finally {

        reader.releaseLock()
    }
}


// =============================================================
// SSE EVENT PROCESSOR
// =============================================================

function processSseEvent(
    event: string,
    onChunk: (chunk: string) => void,
): void {

    if (!event.trim()) {
        return
    }


    console.log(
        "[RFP SSE RAW]",
        event
    )


    // =========================================================
    // Extract event type
    // =========================================================

    let eventType =
        "message"


    const lines =
        event.split(/\r?\n/)


    const dataLines: string[] = []


    for (
        const line of lines
    ) {

        // -----------------------------------------------------
        // SSE event:
        // -----------------------------------------------------

        if (
            line.startsWith("event:")
        ) {

            eventType =
                line
                    .slice(6)
                    .trim()

            continue
        }


        // -----------------------------------------------------
        // SSE data:
        // -----------------------------------------------------

        if (
            line.startsWith("data:")
        ) {

            dataLines.push(
                line
                    .slice(5)
                    .trimStart()
            )

            continue
        }
    }


    // =========================================================
    // No data
    // =========================================================

    if (
        dataLines.length === 0
    ) {

        return
    }


    // =========================================================
    // Combine data lines
    // =========================================================

    const dataString =
        dataLines.join("\n")


    let data: StreamRfpResponse


    // =========================================================
    // Parse JSON
    // =========================================================

    try {

        data =
            JSON.parse(
                dataString
            )

    } catch (error) {

        console.error(
            "[RFP SSE] Invalid JSON:",
            dataString
        )

        return
    }


    console.log(
        "[RFP SSE]",
        {
            eventType,
            data,
        }
    )


    // =========================================================
    // 1. Standard SSE "start"
    // =========================================================

    if (
        eventType === "start"
    ) {

        console.log(
            "[RFP] Generation started"
        )

        return
    }


    // =========================================================
    // 2. Standard SSE "chunk"
    // =========================================================

    if (
        eventType === "chunk"
    ) {

        if (
            typeof data.content ===
            "string"
        ) {

            console.log(
                "[RFP] Chunk:",
                data.content
            )


            onChunk(
                data.content
            )
        }

        return
    }


    // =========================================================
    // 3. Standard SSE "complete"
    // =========================================================

    if (
        eventType === "complete"
    ) {

        console.log(
            "[RFP] Generation complete"
        )

        return
    }


    // =========================================================
    // 4. SSE error event
    // =========================================================

    if (
        eventType === "error"
    ) {

        throw new Error(
            data.message ||
            "RFP generation failed."
        )
    }


    // =========================================================
    // 5. BACKEND: section_added
    //
    // Example:
    //
    // data:
    // {
    //     "type": "section_added",
    //     "heading": "Executive Summary",
    //     "content": "This RFP describes..."
    // }
    //
    // =========================================================

    if (
        data.type === "section_added"
    ) {

        console.log(
            "[RFP] Section added:",
            data.heading
        )


        // -----------------------------------------------------
        // Validate heading
        // -----------------------------------------------------

        const heading =
            typeof data.heading === "string"
                ? data.heading.trim()
                : ""


        // -----------------------------------------------------
        // Validate content
        // -----------------------------------------------------

        const content =
            typeof data.content === "string"
                ? data.content
                : ""


        if (!heading && !content) {

            console.warn(
                "[RFP] section_added contains no heading/content:",
                data
            )

            return
        }


        // -----------------------------------------------------
        // Convert section into markdown
        //
        // Example:
        //
        // heading = "Executive Summary"
        //
        // content = "This RFP..."
        //
        // Result:
        //
        // # Executive Summary
        //
        // This RFP...
        //
        // -----------------------------------------------------

        let chunk = ""


        if (heading) {

            chunk +=
                `# ${heading}\n\n`
        }


        chunk +=
            `${content}\n\n`


        console.log(
            "[RFP] Sending section to editor:",
            chunk
        )


        // -----------------------------------------------------
        // IMPORTANT:
        //
        // This calls your existing page.tsx:
        //
        // onChunk: (chunk) => {
        //     setContent(
        //         previous =>
        //             previous + chunk
        //     )
        // }
        // -----------------------------------------------------

        onChunk(
            chunk
        )


        return
    }


    // =========================================================
    // 6. Backend malformed response
    //
    // {
    //     "type": "malformed",
    //     "attempt": 1
    // }
    // =========================================================

    if (
        data.type === "malformed"
    ) {

        console.warn(
            "[RFP] Backend reported malformed response:",
            data
        )

        return
    }


    // =========================================================
    // 7. Backend done response
    //
    // {
    //     "type": "done",
    //     "markdown": "...",
    //     "sections_count": 5,
    //     "stopped_reason": "completed"
    // }
    // =========================================================

    if (
        data.type === "done"
    ) {

        console.log(
            "[RFP] Generation complete"
        )


        console.log(
            "[RFP] Sections generated:",
            data.sections_count
        )


        console.log(
            "[RFP] Stopped reason:",
            data.stopped_reason
        )


        if (
            typeof data.markdown ===
            "string"
        ) {

            console.log(
                "[RFP] Final markdown:",
                data.markdown
            )

            /*
             * DO NOT call onChunk(data.markdown)
             * here because section_added events have
             * already streamed the content into the editor.
             */
        }


        return
    }


    // =========================================================
    // 8. Backend JSON error
    //
    // {
    //     "type": "error",
    //     "message": "..."
    // }
    // =========================================================

    if (
        data.type === "error"
    ) {

        throw new Error(
            data.message ||
            "RFP generation failed."
        )
    }


    // =========================================================
    // 9. Generic content fallback
    // =========================================================

    if (
        typeof data.content ===
        "string"
    ) {

        onChunk(
            data.content
        )

        return
    }


    // =========================================================
    // 10. Unknown event
    // =========================================================

    console.warn(
        "[RFP] Unknown SSE event:",
        data
    )
}