import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentsApi } from '@/api/comments'

export function useComments(pageId: number) {
  return useQuery({
    queryKey: ['comments', pageId],
    queryFn: () => commentsApi.list(pageId),
    enabled: pageId > 0,
  })
}

export function useCreateComment(pageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { content: string; parent_id?: number }) => commentsApi.create(pageId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', pageId] }),
  })
}

export function useDeleteComment(pageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: commentsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', pageId] }),
  })
}

export function useResolveComment(pageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: commentsApi.resolve,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', pageId] }),
  })
}
