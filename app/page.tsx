"use client"

import dynamic from "next/dynamic"
import { useState, useCallback } from "react"
import { handleFileRead } from "./uploader"
import { CONTENT_TEXT } from "@/data/bail_after_arrest_content"
const SimpleEditor = dynamic(
  () => import("@/app/editor/simple-editor").then((mod) => mod.SimpleEditor),
  { ssr: false }
)

export default function Page() {
  const [content, setContent] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      setError(null)
      const formattedContent = await handleFileRead(file)
      console.log("Formatted content received: ", formattedContent.slice(0, 100)); // Log the first 100 characters for debugging
      // setContent(formattedContent as string)
      setContent(CONTENT_TEXT as string) // For testing, using the constant content instead of the uploaded file content
    } catch (err) {
      setError(err.message)
    }
  }, [])

  return (
    <div>
      <div style={{ padding: '16px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <input 
          type="file" 
          id="file-upload"
          onChange={handleFileChange} 
          accept=".md,.markdown" 
          style={{ display: 'none' }}
        />
        <label 
          htmlFor="file-upload"
          style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            background: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          Upload Markdown File
        </label>
        {error && <div style={{ color: "red", marginTop: '8px' }}>{error}</div>}
      </div>
      <SimpleEditor initialContent={content} />
    </div>
  )
}
