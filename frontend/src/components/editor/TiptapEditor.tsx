import { useCallback, useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { editorExtensions } from './extensions'
import { MenuBar } from './MenuBar'
import { useEditorStore } from '@/store/editorStore'

interface Props {
  content: string
  onChange: (json: string) => void
  editable?: boolean
}

export function TiptapEditor({ content, onChange, editable = true }: Props) {
  const setUnsaved = useEditorStore((s) => s.setUnsaved)

  const editor = useEditor({
    extensions: editorExtensions,
    content: content ? JSON.parse(content) : '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
      setUnsaved(true)
    },
  })

  // Sync content from parent when page changes
  useEffect(() => {
    if (editor && content) {
      const parsed = JSON.parse(content)
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(parsed)) {
        editor.commands.setContent(parsed, false)
      }
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {editable && <MenuBar editor={editor} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none [&_.ProseMirror]:outline-none"
      />
      {editable && (
        <div className="border-t border-gray-100 px-4 py-1 text-xs text-gray-400 text-right">
          {editor.storage.characterCount?.characters()} characters
        </div>
      )}
    </div>
  )
}
