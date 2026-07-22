/**
 * This file will handle all the error handling and will take markdown content and return 
 * proper formatted string to display on UI editor 
 */
"use client"

import {formatToDocxQuality} from "@/lib/markdown-formatter";
export async function handleMarkdownFormatting(content: string): Promise<string> {


    try{
        const formattedContent = formatToDocxQuality(content);
        return Promise.resolve(formattedContent);
    }
    catch(err){
        return Promise.reject(new Error(`Error formatting markdown content: ${err.message}`));
    
    }


}