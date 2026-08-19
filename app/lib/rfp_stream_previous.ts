// // The ONE backend API: takes markdown, returns markdown, streamed via SSE
// // as ordered chunks. If the real endpoint isn't reachable yet (dev, or
// // not integrated), this transparently falls back to a simulated stream
// // with the same shape — call sites never need to know which ran.

// export interface RfpChunk {
//     sequence_id: number
//     content: string
//     status: "in_progress" | "completed"
// }

// interface StreamRfpResponseArgs {
//     sourceMarkdown: string
//     signal: AbortSignal
//     onEvent: (chunk: RfpChunk) => void
// }

// export async function streamRfpResponse(args: StreamRfpResponseArgs): Promise<void> {
//     try {
//         await realStreamRfpResponse(args)
//     } catch (err) {
//         if ((err as Error).name === "AbortError") throw err
//         console.warn("[rfp-stream] real API unavailable, falling back to mock stream:", err)
//         await mockStreamRfpResponse(args)
//     }
// }

// // --- Real backend: POST markdown, parse text/event-stream response -----
// async function realStreamRfpResponse({
//     sourceMarkdown,
//     signal,
//     onEvent,
// }: StreamRfpResponseArgs): Promise<void> {
//     const response = await fetch(`${process.env.BACKEND_URL}/api/generate_rfp_response`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ content: sourceMarkdown }),
//         signal,
//     })

//     if (!response.ok || !response.body) {
//         throw new Error(`generate_rfp_response failed: ${response.status} ${response.statusText}`)
//     }

//     const reader = response.body.getReader()
//     const decoder = new TextDecoder()
//     let buffer = ""

//     while (true) {
//         const { value, done } = await reader.read()
//         if (done) break

//         buffer += decoder.decode(value, { stream: true })

//         const events = buffer.split("\n\n")
//         buffer = events.pop() ?? ""

//         for (const rawEvent of events) {
//             const payload = rawEvent
//                 .split("\n")
//                 .filter((line) => line.startsWith("data:"))
//                 .map((line) => line.slice(5).trimStart())
//                 .join("\n")

//             if (!payload || payload === "[DONE]") continue

//             try {
//                 // expects { "sequence_id": number, "content": "...markdown...", "status": "in_progress" | "completed" }
//                 const parsed: RfpChunk = JSON.parse(payload)
//                 onEvent(parsed)
//             } catch {
//                 console.error("[rfp-stream] malformed SSE payload, skipping:", payload)
//             }
//         }
//     }
// }

// // --- Mock fallback: same event shape, simulated locally -----------------
// const MOCK_SECTIONS = [
//     "# Response to Request for Proposal\n\n",
//     "## 1. Executive Summary\n\nWe are pleased to submit this proposal in response to your RFP...\n\n",
//     "## 2. Understanding of Requirements\n\nBased on our review, we understand the project requires a scalable, secure solution...\n\n",
//     "## 3. Proposed Approach\n\n- Discovery and requirements validation\n- Solution design\n- Iterative implementation\n- Testing and deployment\n\n",
//     "## 4. Timeline\n\nWe estimate 10-12 weeks across four phases.\n\n",
//     "## 5. Pricing\n\nDetailed pricing is provided in the attached appendix.\n\n",
//     "## 6. Why Us\n\nOur team is committed to your project's success from kickoff through go-live.\n\n",
// ]

// async function mockStreamRfpResponse({
//     signal,
//     onEvent,
// }: Pick<StreamRfpResponseArgs, "signal" | "onEvent">): Promise<void> {
//     for (let i = 0; i < MOCK_SECTIONS.length; i++) {
//         if (signal.aborted) {
//             const err = new Error("Aborted")
//             err.name = "AbortError"
//             throw err
//         }
//         await new Promise((r) => setTimeout(r, 500 + Math.random() * 400))
//         onEvent({
//             sequence_id: i,
//             content: MOCK_SECTIONS[i],
//             status: i === MOCK_SECTIONS.length - 1 ? "completed" : "in_progress",
//         })
//     }
// }



export interface StreamRfpResponseOptions {
    file: File | null,
    clientName?: string
    industry?: string
    signal?: AbortSignal
    onStart?: () => void
    onChunk: (chunk: string) => void
    onComplete?: () => void
}

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000"


const url =
    `${BACKEND_URL}/requirements/generate_rfp_response`

export async function streamRfpResponse({
    file,
    clientName,
    industry,
    signal,
    onStart,
    onChunk,
    onComplete,
}: StreamRfpResponseOptions): Promise<void> {

    if (!file) {
        throw new Error("File not FOund");
    }
    const formData = new FormData()

    formData.append("file", file)
    formData.append("client_name", clientName ?? "TPS")
    formData.append("industry", industry ?? "Banking")
    console.log("Sending file:", file.name)
    console.log("File size:", file.size)
    console.log("File type:", file.type)
    const response = await fetch(
        url,
        {
            method: "POST",

            headers: {
                Accept: "text/event-stream",
            },

            body: formData,

            signal,
        }
    )

    console.log("RFP RESPONSE:", response.status)

    if (!response.ok) {

        const errorText =
            await response.text()

        throw new Error(
            errorText ||
            `Generation failed: ${response.status}`
        )
    }

    if (!response.body) {

        throw new Error(
            "Backend did not return a streaming response."
        )
    }

    const reader =
        response.body.getReader()

    const decoder =
        new TextDecoder()

    let buffer = ""

    onStart?.()

    try {

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

            const events =
                buffer.split("\n\n")

            buffer =
                events.pop() || ""

            for (const event of events) {

                processSseEvent(
                    event,
                    onChunk
                )
            }
        }

        // Process remaining decoder data.

        buffer += decoder.decode()

        if (buffer.trim()) {

            processSseEvent(
                buffer,
                onChunk
            )
        }

        onComplete?.()

    } finally {

        reader.releaseLock()
    }
}


function processSseEvent(
    event: string,
    onChunk: (chunk: string) => void,
) {

    const lines =
        event.split("\n")

    let eventType = "message"

    const dataLines: string[] = []

    for (const line of lines) {

        if (
            line.startsWith("event:")
        ) {

            eventType =
                line
                    .slice(6)
                    .trim()

        } else if (
            line.startsWith("data:")
        ) {

            dataLines.push(
                line.slice(5).trim()
            )
        }
    }

    if (dataLines.length === 0) {
        return
    }

    const dataString =
        dataLines.join("\n")

    let data: any

    try {

        data =
            JSON.parse(dataString)

    } catch {

        console.error(
            "Invalid SSE JSON:",
            dataString
        )

        return
    }

    switch (eventType) {

        case "start":

            console.log(
                "RFP generation started"
            )

            break

        case "chunk":

            if (
                typeof data.content ===
                "string"
            ) {

                onChunk(
                    data.content
                )
            }

            break

        case "complete":

            console.log(
                "RFP generation complete"
            )

            break

        case "error":

            throw new Error(
                data.message ||
                "RFP generation failed"
            )

        default:

            if (
                typeof data.content ===
                "string"
            ) {

                onChunk(
                    data.content
                )
            }
    }
}