import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, Download, Trash2, Upload } from 'lucide-react'
import { attachmentsApi } from '@/api/attachments'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

interface Props { pageId: number }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export function AttachmentList({ pageId }: Props) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', pageId],
    queryFn: () => attachmentsApi.list(pageId),
  })

  const upload = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(pageId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', pageId] }),
  })

  const remove = useMutation({
    mutationFn: attachmentsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', pageId] }),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload.mutate(file)
    e.target.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Upload size={13} /> {upload.isPending ? 'Uploading...' : 'Upload file'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : attachments.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <Paperclip size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No attachments yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip size={14} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.original_filename}</p>
                  <p className="text-xs text-gray-400">
                    {formatBytes(a.file_size)} · {format(new Date(a.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={attachmentsApi.downloadUrl(a.id)}
                  download={a.original_filename}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                  title="Download"
                >
                  <Download size={14} />
                </a>
                {(user?.id === a.uploader_id || user?.role === 'admin') && (
                  <button
                    onClick={() => remove.mutate(a.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
