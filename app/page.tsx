"use client"

import dynamic from "next/dynamic"

const SimpleEditor = dynamic(
  () => import("@/app/editor/simple-editor").then((mod) => mod.SimpleEditor),
  { ssr: false }
)

export default function Page() {
  return <SimpleEditor />
}
