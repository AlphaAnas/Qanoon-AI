"use client"

import { Button } from '@/components/tiptap-ui-primitive/button'
import { Spacer } from '@/components/tiptap-ui-primitive/spacer'
import {
  ToolbarGroup,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar'
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu'
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu'
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'
import { ThemeToggle } from '@/app/editor/theme-toggle'
import { ZoomIn, ZoomOut } from 'lucide-react'

// Constants
export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
export const PAGE_SIZES = {
  A4: { width: "210mm", height: "297mm" },
  Letter: { width: "8.5in", height: "11in" },
  Legal: { width: "8.5in", height: "14in" },
} as const
export const FONT_SIZES = [10, 11, 12, 14, 16] as const

export interface MainToolbarContentProps {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  zoom: number
  onZoomChange: (zoom: number) => void
  pageSize: keyof typeof PAGE_SIZES
  onPageSizeChange: (pageSize: keyof typeof PAGE_SIZES) => void
  fontSize: number
  onFontSizeChange: (fontSize: number) => void
}

export const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  zoom,
  onZoomChange,
  pageSize,
  onPageSizeChange,
  fontSize,
  onFontSizeChange,
}: MainToolbarContentProps) => {
  const currentZoomIndex = ZOOM_LEVELS.findIndex(level => level === zoom)
  
  const handleZoomIn = () => {
    const nextIndex = Math.min(currentZoomIndex + 1, ZOOM_LEVELS.length - 1)
    onZoomChange(ZOOM_LEVELS[nextIndex])
  }
  
  const handleZoomOut = () => {
    const nextIndex = Math.max(currentZoomIndex - 1, 0)
    onZoomChange(ZOOM_LEVELS[nextIndex])
  }

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
        
        <Button variant="ghost" onClick={handleZoomOut} aria-label="Zoom out">
          <ZoomOut className="tiptap-button-icon" />
        </Button>
        
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
        
        <Button variant="ghost" onClick={handleZoomIn} aria-label="Zoom in">
          <ZoomIn className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>
    </>
  )
}
