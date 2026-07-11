/**
 * 
 * This file will contain the code to handle the file upload functionality for the application. It will include functions to upload files to the server, handle file validation, and manage the state of uploaded files.
 * 
 */
"use client"

import { handleMarkdownFormatting } from "@/app/uploader/mdformatter";


async function handleFileRead(file?: File) {
  if (!file) {
    return Promise.reject(new Error('No file provided'));
  }
  
  try {
    let contents = await file.text();
    const formattedContents = await handleMarkdownFormatting(contents);
    if (formattedContents) {
      return Promise.resolve(formattedContents);
    } else {
      console.error('No formatted contents returned.');
      return Promise.reject(new Error('Failed to format markdown content.'));
    }
  } catch (err) {
    console.error(err.message);
    return Promise.reject(new Error('Failed to read or format the markdown text.'));
  }
}
export { handleFileRead };