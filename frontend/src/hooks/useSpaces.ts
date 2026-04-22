import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { spacesApi } from '@/api/spaces'

export function useSpaces() {
  return useQuery({ queryKey: ['spaces'], queryFn: spacesApi.list })
}

export function useSpace(key: string) {
  return useQuery({ queryKey: ['spaces', key], queryFn: () => spacesApi.get(key), enabled: !!key })
}

export function useSpacePages(key: string) {
  return useQuery({
    queryKey: ['spaces', key, 'pages'],
    queryFn: () => spacesApi.getPages(key),
    enabled: !!key,
  })
}

export function useCreateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: spacesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  })
}

export function useCreatePage(spaceKey: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: object) => spacesApi.createPage(spaceKey, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces', spaceKey, 'pages'] }),
  })
}
