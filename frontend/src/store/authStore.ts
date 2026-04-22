import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/models'
import { authApi } from '@/api/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrating: boolean
  _hydrateAttempted: boolean  // Guard to prevent duplicate hydration calls
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: true,
      _hydrateAttempted: false,

      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        const token = await authApi.login(email, password)
        set({ accessToken: token.access_token, isAuthenticated: true })
        const user = await authApi.me()
        set({ user })
      },

      logout: () => {
        authApi.logout().catch(() => {})
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isHydrating: false,
          _hydrateAttempted: false,
        })
      },

      hydrate: async () => {
        // Prevent running more than once per session
        if (get()._hydrateAttempted) return
        set({ _hydrateAttempted: true, isHydrating: true })

        try {
          const token = await authApi.refresh()
          set({ accessToken: token.access_token, isAuthenticated: true })
          const user = await authApi.me()
          set({ user, isHydrating: false })
        } catch {
          // No valid refresh token — just transition to unauthenticated state quietly
          set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false })
        }
      },
    }),
    {
      name: 'unidocs-auth',
      // Only persist user info — access token stays in memory to prevent XSS
      partialize: (state) => ({ user: state.user }),
    }
  )
)
