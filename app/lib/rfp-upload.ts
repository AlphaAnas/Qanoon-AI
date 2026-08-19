// Simulates PDF/DOCX -> markdown conversion. This is NOT a backend call —
// there is only one backend API (generate_rfp_response). Once you have a
// real conversion step (backend or client library), swap the body of this
// function — the call site in page.tsx doesn't need to change.

interface ConvertRfpResult {
    content: string
}

export async function convertRfpToMarkdown(file: File): Promise<ConvertRfpResult> {
    // simulate parse/convert latency
    await new Promise((r) => setTimeout(r, 900))

    return {
        content:
            `# ${file.name.replace(/\.[^/.]+$/, "")}\n\n` +
            `*Converted from ${file.name} (client-side mock — no conversion backend yet)*\n\n` +
            `## Section 1: Scope of Work\n\nThe vendor shall provide banking software services including...\n\n` +
            `## Section 2: Requirements\n\n- Compliance with regulatory standards\n- 24/7 uptime SLA\n- Data encryption at rest and in transit\n\n` +
            `## Section 3: Submission Guidelines\n\nProposals must be submitted by the deadline stated in Section 5...\n\n`,
    }
}