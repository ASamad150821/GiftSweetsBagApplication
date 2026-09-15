import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiRequest } from '../lib/api'

export interface AuthUser {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  register: (input: { name: string; email: string; password: string }) => Promise<void>
  login: (input: { email: string; password: string }) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      register: async (input) => {
        const result = await apiRequest<{ user: AuthUser; token: string }>('/auth/register', {
          method: 'POST',
          body: input,
        })
        set({ user: result.user, token: result.token })
      },
      login: async (input) => {
        const result = await apiRequest<{ user: AuthUser; token: string }>('/auth/login', {
          method: 'POST',
          body: input,
        })
        set({ user: result.user, token: result.token })
      },
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'giftbags-auth' },
  ),
)
