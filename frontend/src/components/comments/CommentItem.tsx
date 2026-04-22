import { useState } from 'react'
import { MessageSquare, CheckCircle, Trash2, CornerDownRight } from 'lucide-react'
import type { Comment } from '@/types/models'
import { useAuthStore } from '@/store/authStore'
import { useCreateComment, useDeleteComment, useResolveComment } from '@/hooks/useComments'
import { commentsApi } from '@/api/comments'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

interface Props { comment: Comment; pageId: number; depth?: number }

export function CommentItem({ comment, pageId, depth = 0 }: Props) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const deleteComment = useDeleteComment(pageId)
  const resolveComment = useResolveComment(pageId)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    await commentsApi.reply(comment.id, replyText)
    qc.invalidateQueries({ queryKey: ['comments', pageId] })
    setReplyText('')
    setShowReply(false)
  }

  const canDelete = user?.id === comment.author_id || user?.role === 'admin'

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-3' : ''}`}>
      <div className={`p-3 rounded-lg ${comment.is_resolved ? 'bg-gray-50 opacity-60' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center uppercase">
              {comment.author.username[0]}
            </div>
            <span className="text-xs font-medium text-gray-700">{comment.author.full_name || comment.author.username}</span>
            <span className="text-xs text-gray-400">{format(new Date(comment.created_at), 'MMM d, HH:mm')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {comment.is_resolved && <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Resolved</span>}
            <button onClick={() => resolveComment.mutate(comment.id)} title="Toggle resolved" className="text-gray-400 hover:text-green-600">
              <CheckCircle size={14} />
            </button>
            {canDelete && (
              <button onClick={() => deleteComment.mutate(comment.id)} title="Delete" className="text-gray-400 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-800">{comment.content}</p>
        {depth === 0 && (
          <button onClick={() => setShowReply(!showReply)} className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600">
            <CornerDownRight size={12} /> Reply
          </button>
        )}
      </div>

      {showReply && (
        <form onSubmit={submitReply} className="flex gap-2 mt-2 ml-6">
          <input
            value={replyText} onChange={(e) => setReplyText(e.target.value)} autoFocus
            placeholder="Write a reply..."
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <button type="submit" disabled={!replyText.trim()} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg disabled:opacity-50">
            Reply
          </button>
        </form>
      )}

      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} pageId={pageId} depth={depth + 1} />
      ))}
    </div>
  )
}
