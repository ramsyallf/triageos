import { useConvex, useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function useRecentTriageSessions(staffUserId: Id<'users'> | null, limit = 25) {
  return useQuery(
    api.triageSessions.listRecentTriageSessionsForCurrentDoctor,
    staffUserId ? { staffUserId, limit } : 'skip'
  )
}

export function useTriageSessionMutations(staffUserId: Id<'users'>) {
  const convex = useConvex()
  return {
    createTriageSession: useMutation(api.triageSessions.createTriageSessionForPatient),
    updateTriageSession: useMutation(api.triageSessions.updateTriageSession),
    getTriageSessionById: (triageSessionId: Id<'triageSessions'>) =>
      convex.query(api.triageSessions.getTriageSessionById, { staffUserId, triageSessionId }),
  }
}
