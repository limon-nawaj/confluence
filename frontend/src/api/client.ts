import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const client = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

// On 401, attempt token refresh once then retry the original request.
// IMPORTANT: skip the interceptor for the /auth/refresh endpoint itself
// to prevent an infinite retry loop.
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Do NOT retry if:
    // 1. Not a 401 error
    // 2. Already retried (_retry flag)
    // 3. The failing request IS the refresh endpoint (avoid infinite loop)
    // 4. The failing request IS the logout endpoint
    const url: string = original?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/logout')

    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return client(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      // Refresh token is in httpOnly cookie — no body needed
      const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
      const newToken = data.access_token
      useAuthStore.getState().setAccessToken(newToken)
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return client(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      // Use the store's logout without triggering a page reload
      // — the ProtectedRoute component will redirect to /login automatically
      useAuthStore.getState().logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default client
