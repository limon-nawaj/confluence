import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { versionsApi } from '@/api/versions'

export function useVersions(pageId: number) {
  return useQuery({
    queryKey: ['versions', pageId],
    queryFn: () => versionsApi.list(pageId),
    enabled: pageId > 0,
  })
}

export function useRestoreVersion(pageId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: versionsApi.restore,
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ['pages', pageId] })
      qc.invalidateQueries({ queryKey: ['versions', pageId] })
      return page
    },
  })
}
