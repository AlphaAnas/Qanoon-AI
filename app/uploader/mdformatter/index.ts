/**
 * This file will handle all the error handling and will take markdown content and return 
 * proper formatted string to display on UI editor 
 */
"use client"

import {cleanFile} from "@/lib/markdown-cleaner";

const headingStyle = 'text-align: center; font-size: 14px';
const paragraphStyle = 'text-align: justify; font-size: 12px';

function formatBoldText(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function formatHeading(line: string): string | null {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);

    if (!heading) {
        return null;
    }

    const level = heading[1].length;
    const text = formatBoldText(heading[2]);
    return `<h${level} style="${headingStyle}"><strong>${text}</strong></h${level}>`;
}

function isParagraph(line: string): boolean {
    const text = line.trimStart();

    return Boolean(text)
        && !text.startsWith("<")
        && !/^(?:[-*+] |\d+\. |> |```|---)/.test(text);
}

function formatLine(line: string): string {
    const heading = formatHeading(line);

    if (heading) {
        return heading;
    }

    if (isParagraph(line)) {
        return `<p style="${paragraphStyle}">${formatBoldText(line)}</p>`;
    }

    return line;
}

export async function handleMarkdownFormatting(content: string): Promise<string> {
    try{
        const cleanedContent = cleanFile(content);
        const formattedContent = cleanedContent.split("\n").map(formatLine).join("\n");

        return formattedContent;
    }
    catch(err){
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Error formatting markdown content: ${message}`);
    }
}
