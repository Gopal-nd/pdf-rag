import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApiKeyState {
  key: string
  setKey: (apiKey: string) => void
  updateKey: (apiKey: string) => void
  clearKey: () => void
}

export const useAPIKEY = create<ApiKeyState>()(
  persist(
    (set) => ({
      key: '',
      setKey: (apiKey) => set({ key: apiKey }),
      updateKey: (apiKey) => set({ key: apiKey }),
      clearKey: () => set({ key: '' }),
    }),
    {
      name: 'api-key-storage',    // key in localStorage
    }
  )
)
