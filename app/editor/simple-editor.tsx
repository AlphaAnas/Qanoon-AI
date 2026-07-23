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

// --- Lib ---

// --- Styles ---
import "@/app/editor/simple-editor.scss"


const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const PAGE_SIZES = {
  A4: { width: "210mm", height: "297mm" },
  Letter: { width: "8.5in", height: "11in" },
  Legal: { width: "8.5in", height: "14in" },
} as const
const FONT_SIZES = [10, 11, 12, 14, 16]

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  zoom,
  onZoomChange,
  pageSize,
  onPageSizeChange,
  fontSize,
  onFontSizeChange,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  zoom: number
  onZoomChange: (zoom: number) => void
  pageSize: keyof typeof PAGE_SIZES
  onPageSizeChange: (pageSize: keyof typeof PAGE_SIZES) => void
  fontSize: number
  onFontSizeChange: (fontSize: number) => void
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="underline" />

      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(e.target.value as keyof typeof PAGE_SIZES)}
          className="zoom-select"
          aria-label="Page size"
        >
          {Object.keys(PAGE_SIZES).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <select
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="zoom-select"
          aria-label="Document font size"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>

        <select
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="zoom-select"
          aria-label="Zoom level"
        >
          {ZOOM_LEVELS.map((level) => (
            <option key={level} value={level}>
              {Math.round(level * 100)}%
            </option>
          ))}
        </select>
      </ToolbarGroup>
    </>
  )
}

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
            "--page-width": PAGE_SIZES[pageSize].width,
            "--page-height": PAGE_SIZES[pageSize].height,
            "--editor-font-size": `${fontSize}px`,
            "--editor-heading-size": `${fontSize + 2}px`,
          } as React.CSSProperties}
        >
          <EditorContent
            editor={editor}
            role="presentation"
            className="simple-editor-content"
          />
        </div>
      </EditorContext.Provider>
    </div>
  )
}
