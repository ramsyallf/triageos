import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function useCurrentUser(staffUserId: Id<'users'> | null) {
  return useQuery(api.users.getCurrentUser, staffUserId ? { staffUserId } : 'skip')
}
