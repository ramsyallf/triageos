import { useConvex, useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function useRecentTriageSessions(limit = 25) {
  return useQuery(api.triageSessions.listRecentTriageSessionsForCurrentDoctor, { limit })
}

export function useTriageSessionMutations() {
  const convex = useConvex()
  return {
    createTriageSession: useMutation(api.triageSessions.createTriageSessionForPatient),
    updateTriageSession: useMutation(api.triageSessions.updateTriageSession),
    getTriageSessionById: (triageSessionId: Id<'triageSessions'>) =>
      convex.query(api.triageSessions.getTriageSessionById, { triageSessionId }),
  }
}
