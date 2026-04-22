import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useComments, useCreateComment } from '@/hooks/useComments'
import { CommentItem } from './CommentItem'

interface Props { pageId: number }

export function CommentThread({ pageId }: Props) {
  const { data: comments = [], isLoading } = useComments(pageId)
  const createComment = useCreateComment(pageId)
  const [text, setText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await createComment.mutateAsync({ content: text })
    setText('')
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />
        <button
          type="submit" disabled={!text.trim() || createComment.isPending}
          className="self-end px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50"
        >
          Post
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => <CommentItem key={c.id} comment={c} pageId={pageId} />)}
        </div>
      )}
    </div>
  )
}
