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

    // receive a raw pdf / .docs file and send it to backend directly and get markdown text and convert it to properly
    try{
      setError(null)
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch(`${process.env.BACKEND_URL}/api/upload_rfp`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }
      const data = await response.json()
      setContent(data.content)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    
    try {
      setError(null)
      const formattedContent = await handleFileRead(file)
      setContent(formattedContent as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
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
          Upload Your RFP Here
        </label>
        {error && <div style={{ color: "red", marginTop: '8px' }}>{error}</div>}
      </div>
      <SimpleEditor content={content} />
    </div>
  )
}
