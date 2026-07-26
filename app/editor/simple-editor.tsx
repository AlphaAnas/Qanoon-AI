"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Markdown } from '@tiptap/markdown'
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"


import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/app/editor/theme-toggle"
import { MainToolbarContent, ZOOM_LEVELS, PAGE_SIZES, FONT_SIZES } from "@/components/toolbar"

// --- Lib ---
import { detectMarkdown } from "@/lib/markdown-cleaner"
// --- Styles ---
import "@/app/editor/simple-editor.scss"
import { handleMarkdownFormatting } from "../uploader/mdformatter"



const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)


// 1. Properly destructure the props object
export function SimpleEditor({ content = "# Enter text to continue" }: { content?: string }) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mdInput, setmdInput] = useState(content)
  const [error, setError] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main")
  const [zoom, setZoom] = useState(1)
  const [pageSize, setPageSize] = useState<keyof typeof PAGE_SIZES>("A4")
  const [fontSize, setFontSize] = useState(12)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const handleZoomChange = useCallback((value: number) => {
    setZoom(value)
  }, [])

  const editor = useEditor({
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        // codeBlock: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      Markdown.configure({
        indentation: {
          style: 'space',
          size: 2,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
    ],
    // 2. Set the initial content here
    content: content,
    contentType: 'markdown',

    onUpdate: ({ editor }) => {
      console.log("Editor content updated!!")
    },

    onFocus: ({ editor, event }) => {
      console.log("Editor is focused now!!")
    },

    onBlur: ({ editor, event }) => {
      console.log("Editor is no longer focused!!")
    },

    onPaste: async (event, slice) => {
      const pastedText = event.clipboardData?.getData('text/plain') ?? ''

      const isMarkdown = detectMarkdown(pastedText)

      if (isMarkdown) {
        console.log('Detected markdown paste')
        // let default markdown parsing handle it, or run your MD pipeline
        const formattedText = await handleMarkdownFormatting(pastedText);
        if (editor && formattedText) {
          setmdInput(formattedText);

          try {
            setError(null)
            // Pass the prop directly instead of relying on the async state of mdInput
            editor.commands.setContent(formattedText, { contentType: 'markdown' })
          } catch (err) {
            console.error(err)
            setError(`Error parsing markdown: ${err instanceof Error ? err.message : String(err)}`)
          }

        }



      } else {
        console.log('Detected plain text paste')
        // I am thinking of passing it through markdown parser to remove --- dashes and em dashes and to format the content correctly
        // run your heuristic plain-text segmenter here
        // event.preventDefault() if you want to fully intercept and insert custom content instead
      }
    },
  })

  useEffect(() => {
    if (editor && content) {
      setmdInput(content);

      try {
        setError(null)
        // Pass the prop directly instead of relying on the async state of mdInput
        editor.commands.setContent(content, { contentType: 'markdown' })
      } catch (err) {
        console.error(err)
        setError(`Error parsing markdown: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }, [content, editor])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          variant="fixed"
          className="simple-editor-toolbar"
          style={{
            ...(isMobile
              ? {
                position: 'absolute',
                bottom: `calc(100% - ${height - rect.y}px)`,
                width: '100%',
              }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
              zoom={zoom}
              onZoomChange={handleZoomChange}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <div
          className="simple-editor-zoom-container"
          style={{
            "--editor-zoom": zoom,
            "--editor-font-size": `${fontSize}px`,
            "--editor-heading-size": `${fontSize + 2}px`,
          } as React.CSSProperties}
        >
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
            data-page-size={pageSize.toLowerCase()} /* E.g., "a4", "letter", or "legal" */
          />
        </div>
      </EditorContext.Provider>
    </div>
  )
}
