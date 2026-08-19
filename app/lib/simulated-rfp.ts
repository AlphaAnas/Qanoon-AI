export interface SimulatedRfpOptions {
    file: File
    signal: AbortSignal
    onChunk: (
        chunk: string
    ) => void
}

/*
 * This simulates an SSE backend.
 *
 * IMPORTANT:
 *
 * The PDF itself is passed into this function.
 *
 * We are NOT converting the PDF to Markdown.
 *
 * In your real implementation this would be:
 *
 * POST /api/generate_rfp_response
 *
 * FormData:
 *
 * file=<original PDF>
 *
 * The backend would:
 *
 * PDF
 *   ↓
 * extraction
 *   ↓
 * RAG
 *   ↓
 * LLM
 *   ↓
 * SSE Markdown
 */
export async function simulateRfpSSE({
    file,
    signal,
    onChunk,
}: SimulatedRfpOptions): Promise<void> {
    /*
     * Simulate sending the complete PDF
     * to the backend.
     */
    console.log(
        "Simulated backend received PDF:",
        {
            name: file.name,
            size: file.size,
            type: file.type,
        }
    )

    /*
     * Simulated generated response.
     *
     * In the real application this will come
     * from your RAG + LLM backend.
     */
    const response = `
# Proposal Response

## 1. Executive Summary

We are pleased to submit this proposal in response to the Request for Proposal provided by the bank.

Our proposed solution is designed to provide a secure, scalable, reliable, and highly configurable banking technology platform.

The solution is designed to satisfy the functional, technical, security, operational, and compliance requirements specified in the RFP.

## 2. Understanding of Requirements

We understand that the bank requires a robust technology platform capable of supporting its business operations while maintaining high levels of availability, security, scalability, and performance.

Our proposed solution addresses these requirements through a modular architecture and configurable services.

## 3. Proposed Solution

### 3.1 Architecture

The proposed platform follows a modular service-oriented architecture.

The architecture provides:

- High availability
- Horizontal scalability
- Fault tolerance
- Secure communication
- Centralized monitoring
- Comprehensive audit logging

### 3.2 Security

Security is incorporated throughout the proposed solution.

The solution supports:

- Encryption in transit
- Encryption at rest
- Role-based access control
- Multi-factor authentication
- Audit logging
- Secure API communication
- Security monitoring

### 3.3 Performance

The platform is designed to support high transaction volumes while maintaining predictable response times.

Performance monitoring and capacity management mechanisms are included to ensure that the system can scale with the bank's requirements.

## 4. Compliance

The proposed solution can be configured to comply with applicable regulatory, security, and operational requirements.

A detailed compliance matrix can be provided against each requirement specified in the RFP.

## 5. Implementation Approach

The implementation will be performed in controlled phases.

### Phase 1 — Discovery

Requirements will be reviewed and validated with the bank's stakeholders.

### Phase 2 — Design

The technical architecture and detailed implementation design will be finalized.

### Phase 3 — Development and Configuration

The required services and integrations will be implemented and configured.

### Phase 4 — Testing

Functional, integration, security, performance, and user acceptance testing will be performed.

### Phase 5 — Deployment

The solution will be deployed using a controlled production rollout process.

## 6. Support and Maintenance

The proposed solution includes operational monitoring, incident management, maintenance, and technical support.

Support procedures will be aligned with the service levels agreed with the bank.

## 7. Conclusion

We believe that the proposed solution provides a comprehensive approach for satisfying the bank's requirements.

We look forward to working with the bank to deliver a secure, scalable, and reliable solution.
`

    /*
     * Simulate SSE streaming.
     *
     * Split the response into chunks.
     */
    const chunks =
        createChunks(response)

    for (const chunk of chunks) {
        /*
         * Allow cancellation.
         */
        if (signal.aborted) {
            throw new DOMException(
                "Generation aborted",
                "AbortError"
            )
        }

        /*
         * Simulate network/LLM delay.
         */
        await delay(
            randomDelay(
                30,
                100
            ),
            signal
        )

        onChunk(chunk)
    }
}

/*
 * Break Markdown into chunks.
 *
 * This makes the UI behave similarly
 * to an actual SSE/LLM response.
 */
function createChunks(
    text: string
): string[] {
    const chunks: string[] = []

    const chunkSize = 35

    for (
        let i = 0;
        i < text.length;
        i += chunkSize
    ) {
        chunks.push(
            text.slice(
                i,
                i + chunkSize
            )
        )
    }

    return chunks
}

function randomDelay(
    min: number,
    max: number
): number {
    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min
}

function delay(
    ms: number,
    signal: AbortSignal
): Promise<void> {
    return new Promise(
        (resolve, reject) => {
            if (signal.aborted) {
                reject(
                    new DOMException(
                        "Generation aborted",
                        "AbortError"
                    )
                )

                return
            }

            const timeout =
                setTimeout(
                    resolve,
                    ms
                )

            const handleAbort =
                () => {
                    clearTimeout(
                        timeout
                    )

                    reject(
                        new DOMException(
                            "Generation aborted",
                            "AbortError"
                        )
                    )
                }

            signal.addEventListener(
                "abort",
                handleAbort,
                {
                    once: true,
                }
            )
        }
    )
}