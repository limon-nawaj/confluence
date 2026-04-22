export type UserRole = 'admin' | 'editor' | 'viewer'
export type PermissionLevel = 'view' | 'edit' | 'admin'

export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface SpacePermission {
  id: number
  user_id: number
  space_id: number
  level: PermissionLevel
  user: User
}

export interface Space {
  id: number
  key: string
  name: string
  description?: string
  is_public: boolean
  owner_id: number
  owner?: User
  created_at: string
  updated_at: string
  team_access?: SpaceTeamAccess[]
  user_permissions?: SpacePermission[]
}

export interface Page {
  id: number
  title: string
  content?: string
  space_id: number
  parent_id?: number
  author_id: number
  author?: User
  position: number
  is_published: boolean
  created_at: string
  updated_at: string
  children?: Page[]
}

export interface PageVersion {
  id: number
  page_id: number
  version_number: number
  title: string
  content: string
  change_summary: string
  author_id: number
  author?: User
  created_at: string
}

export interface Comment {
  id: number
  page_id: number
  author_id: number
  author: User
  parent_id?: number
  content: string
  is_resolved: boolean
  created_at: string
  updated_at: string
  replies: Comment[]
}

export interface Attachment {
  id: number
  page_id: number
  uploader_id: number
  uploader: User
  filename: string
  original_filename: string
  mime_type: string
  file_size: number
  created_at: string
}

export interface Template {
  id: number
  name: string
  description?: string
  category: string
  content: string
  is_system: boolean
  created_at: string
}

export interface SearchResult {
  page_id: number
  title: string
  space_id: number
  space_key: string
  snippet: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Notification {
  id: number
  recipient_id: number
  actor_id: number
  page_id?: number
  type: string
  message: string
  is_read: boolean
  created_at: string
  actor?: {
    id: number
    username: string
    full_name?: string
  }
  page?: {
    id: number
    title: string
    space_id: number
    space_key?: string
  }
}

export interface TeamMember {
  id: number
  team_id: number
  user_id: number
  role: string
  created_at: string
  user: User
}

export interface Team {
  id: number
  name: string
  description?: string
  owner_id: number
  created_at: string
  members: TeamMember[]
}

export interface SpaceTeamAccess {
  id: number
  space_id: number
  team_id: number
  permission: string
  created_at: string
  team: Team
}
