import { create } from 'zustand'

interface EditorState {
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  setUnsaved: (v: boolean) => void
  markSaved: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  hasUnsavedChanges: false,
  lastSaved: null,
  setUnsaved: (v) => set({ hasUnsavedChanges: v }),
  markSaved: () => set({ hasUnsavedChanges: false, lastSaved: new Date() }),
}))
