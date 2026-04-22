import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Lock } from 'lucide-react'
import { useCreateSpace } from '@/hooks/useSpaces'

export default function NewSpacePage() {
  const navigate = useNavigate()
  const createSpace = useCreateSpace()

  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [keyTouched, setKeyTouched] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!keyTouched) {
      setKey(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
    }
  }

  const handleCreate = async () => {
    if (!name.trim() || !key.trim()) return
    const space = await createSpace.mutateAsync({ name, key, description: description || undefined, is_public: isPublic })
    navigate(`/spaces/${space.key}`)
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Create New Space</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Space name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="e.g. HR Policies"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Space key <span className="text-gray-400 font-normal">(used in URLs, letters and numbers only)</span>
          </label>
          <input
            value={key}
            onChange={(e) => { setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setKeyTouched(true) }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="e.g. HRPOL"
            maxLength={20}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            placeholder="What is this space for?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                isPublic
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-500 hover:border-indigo-300'
              }`}
            >
              <Globe size={18} className={isPublic ? 'text-indigo-600' : 'text-gray-400'} />
              <div>
                <p className="font-semibold text-sm">Public</p>
                <p className="text-xs opacity-70">Anyone can read</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                !isPublic
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-500 hover:border-amber-300'
              }`}
            >
              <Lock size={18} className={!isPublic ? 'text-amber-600' : 'text-gray-400'} />
              <div>
                <p className="font-semibold text-sm">Private</p>
                <p className="text-xs opacity-70">Only members</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !key.trim() || createSpace.isPending}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
        >
          {createSpace.isPending ? 'Creating...' : 'Create space'}
        </button>
      </div>
    </div>
  )
}
