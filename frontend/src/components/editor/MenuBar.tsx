import { useEffect, useRef, useState } from 'react'
import { type Editor } from '@tiptap/react'
import {
  Bold, Italic, Strikethrough, Underline, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, Minus, Undo, Redo,
  Table, Link as LinkIcon, Image as ImageIcon, X,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Subscript, Superscript,
} from 'lucide-react'

interface Props {
  editor: Editor
}

const Btn = ({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode
}) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick() }}
    title={title}
    className={`p-1.5 rounded hover:bg-gray-100 ${active ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
  >
    {children}
  </button>
)

const Sep = () => <div className="w-px bg-gray-200 mx-1 self-stretch" />

function InlinePopover({
  open,
  onClose,
  placeholder,
  onSubmit,
  submitLabel,
  defaultValue = '',
}: {
  open: boolean
  onClose: () => void
  placeholder: string
  onSubmit: (value: string) => void
  submitLabel: string
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSubmit(value.trim())
      setValue('')
      onClose()
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    setValue('')
    onClose()
  }

  return (
    <form
      onSubmit={handleSubmit}
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-1 ml-1 bg-white border border-gray-300 rounded-lg px-2 py-1 shadow-sm"
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="text-xs w-56 outline-none text-gray-800 placeholder-gray-400"
      />
      <button type="submit" className="text-xs text-blue-600 font-medium hover:text-blue-700 px-1">
        {submitLabel}
      </button>
      <button type="button" onMouseDown={handleClose} className="text-gray-400 hover:text-gray-600">
        <X size={12} />
      </button>
    </form>
  )
}

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green',  value: '#bbf7d0' },
  { label: 'Blue',   value: '#bfdbfe' },
  { label: 'Pink',   value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
]

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Red',     value: '#ef4444' },
  { label: 'Orange',  value: '#f97316' },
  { label: 'Blue',    value: '#3b82f6' },
  { label: 'Green',   value: '#22c55e' },
  { label: 'Purple',  value: '#a855f7' },
  { label: 'Gray',    value: '#6b7280' },
]

const TABLE_MAX = 8

function TablePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (rows: number, cols: number) => void
}) {
  const [hovered, setHovered] = useState<{ rows: number; cols: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  if (!open) return null

  const rows = hovered?.rows ?? 0
  const cols = hovered?.cols ?? 0

  return (
    <div
      ref={ref}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2"
    >
      <div className="text-xs text-gray-500 mb-1.5 text-center">
        {rows > 0 && cols > 0 ? `${rows} × ${cols}` : 'Select table size'}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${TABLE_MAX}, 1.25rem)` }}>
        {Array.from({ length: TABLE_MAX * TABLE_MAX }, (_, i) => {
          const r = Math.floor(i / TABLE_MAX) + 1
          const c = (i % TABLE_MAX) + 1
          const active = r <= rows && c <= cols
          return (
            <div
              key={i}
              onMouseEnter={() => setHovered({ rows: r, cols: c })}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={(e) => { e.preventDefault(); onSelect(r, c); onClose() }}
              className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${
                active ? 'bg-blue-200 border-blue-400' : 'bg-gray-50 border-gray-200 hover:border-gray-400'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}

function ColorPicker({
  open,
  onClose,
  colors,
  onSelect,
  label,
}: {
  open: boolean
  onClose: () => void
  colors: { label: string; value: string }[]
  onSelect: (value: string) => void
  label: string
}) {
  if (!open) return null
  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-1 ml-1 bg-white border border-gray-300 rounded-lg px-2 py-1.5 shadow-sm"
    >
      <span className="text-xs text-gray-500 mr-1">{label}:</span>
      {colors.map((c) => (
        <button
          key={c.value || 'default'}
          type="button"
          title={c.label}
          onMouseDown={(e) => { e.preventDefault(); onSelect(c.value); onClose() }}
          className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform"
          style={{ background: c.value || '#374151' }}
        />
      ))}
      <button type="button" onMouseDown={(e) => { e.preventDefault(); onClose() }} className="ml-1 text-gray-400 hover:text-gray-600">
        <X size={12} />
      </button>
    </div>
  )
}

export function MenuBar({ editor }: Props) {
  const [showLinkInput, setShowLinkInput]     = useState(false)
  const [showImageInput, setShowImageInput]   = useState(false)
  const [showHighlight, setShowHighlight]     = useState(false)
  const [showTextColor, setShowTextColor]     = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const tableBtnRef = useRef<HTMLDivElement>(null)

  const closeAll = () => {
    setShowLinkInput(false)
    setShowImageInput(false)
    setShowHighlight(false)
    setShowTextColor(false)
    setShowTablePicker(false)
  }

  const toggleLink = () => {
    if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return }
    closeAll(); setShowLinkInput((v) => !v)
  }
  const toggleImage    = () => { closeAll(); setShowImageInput((v) => !v) }
  const toggleHighlight = () => { closeAll(); setShowHighlight((v) => !v) }
  const toggleTextColor = () => { closeAll(); setShowTextColor((v) => !v) }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-white p-2">

      {/* Text style */}
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <Underline size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        <Code size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
        <Subscript size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
        <Superscript size={16} />
      </Btn>

      <Sep />

      {/* Text color & highlight */}
      <Btn onClick={toggleTextColor} active={showTextColor} title="Text color">
        {/* A colored "A" icon */}
        <span className="text-sm font-bold leading-none" style={{ color: editor.getAttributes('textStyle').color || '#374151' }}>A</span>
      </Btn>
      <Btn onClick={toggleHighlight} active={editor.isActive('highlight') || showHighlight} title="Highlight">
        <Highlighter size={16} />
      </Btn>

      <Sep />

      {/* Headings */}
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        <Heading1 size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <Heading2 size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <Heading3 size={16} />
      </Btn>

      <Sep />

      {/* Alignment */}
      <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
        <AlignLeft size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
        <AlignCenter size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
        <AlignRight size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify size={16} />
      </Btn>

      <Sep />

      {/* Lists */}
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <List size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <ListOrdered size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task list">
        <CheckSquare size={16} />
      </Btn>

      <Sep />

      {/* Blocks */}
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <Quote size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus size={16} />
      </Btn>
      <div ref={tableBtnRef} className="relative">
        <Btn
          onClick={() => { closeAll(); setShowTablePicker((v) => !v) }}
          active={showTablePicker}
          title="Insert table"
        >
          <Table size={16} />
        </Btn>
        <TablePicker
          open={showTablePicker}
          onClose={() => setShowTablePicker(false)}
          onSelect={(rows, cols) =>
            editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
          }
        />
      </div>

      <Sep />

      {/* Link & Image */}
      <Btn onClick={toggleLink} active={editor.isActive('link')} title="Add link">
        <LinkIcon size={16} />
      </Btn>
      <Btn onClick={toggleImage} title="Add image">
        <ImageIcon size={16} />
      </Btn>

      <Sep />

      {/* History */}
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo size={16} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo size={16} />
      </Btn>

      {/* Inline popovers */}
      <InlinePopover
        open={showLinkInput}
        onClose={() => setShowLinkInput(false)}
        placeholder="https://example.com"
        onSubmit={(url) => editor.chain().focus().setLink({ href: url }).run()}
        submitLabel="Insert"
        defaultValue={editor.getAttributes('link').href ?? ''}
      />
      <InlinePopover
        open={showImageInput}
        onClose={() => setShowImageInput(false)}
        placeholder="Image URL https://..."
        onSubmit={(url) => editor.chain().focus().setImage({ src: url }).run()}
        submitLabel="Insert"
      />
      <ColorPicker
        open={showHighlight}
        onClose={() => setShowHighlight(false)}
        colors={HIGHLIGHT_COLORS}
        onSelect={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
        label="Highlight"
      />
      <ColorPicker
        open={showTextColor}
        onClose={() => setShowTextColor(false)}
        colors={TEXT_COLORS}
        onSelect={(color) => color
          ? editor.chain().focus().setColor(color).run()
          : editor.chain().focus().unsetColor().run()
        }
        label="Color"
      />
    </div>
  )
}
