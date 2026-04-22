import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pagesApi } from '@/api/pages'

export function usePage(id: number) {
  return useQuery({ queryKey: ['pages', id], queryFn: () => pagesApi.get(id), enabled: id > 0 })
}

export function useUpdatePage(spaceKey?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof pagesApi.update>[1] }) =>
      pagesApi.update(id, data),
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ['pages', page.id] })
      qc.invalidateQueries({ queryKey: ['versions', page.id] })
      if (spaceKey) qc.invalidateQueries({ queryKey: ['spaces', spaceKey, 'pages'] })
    },
  })
}

export function useDeletePage(spaceKey?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: pagesApi.delete,
    onSuccess: () => {
      if (spaceKey) qc.invalidateQueries({ queryKey: ['spaces', spaceKey, 'pages'] })
    },
  })
}

export function useTogglePublish(spaceKey?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => pagesApi.togglePublish(id),
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ['pages', page.id] })
      if (spaceKey) qc.invalidateQueries({ queryKey: ['spaces', spaceKey, 'pages'] })
    },
  })
}

export function usePublishTree(spaceKey?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => pagesApi.publishTree(id),
    onSuccess: () => {
      if (spaceKey) qc.invalidateQueries({ queryKey: ['spaces', spaceKey, 'pages'] })
    },
  })
}
