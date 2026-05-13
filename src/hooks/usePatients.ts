import { useConvex, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function usePatientSearchForStaff(staffUserId: Id<'users'> | null, search: string) {
  return useQuery(
    api.patients.searchPatientsByBpjsIdOrName,
    staffUserId && search.trim() ? { staffUserId, search: search.trim() } : 'skip'
  )
}

export function usePatientById(staffUserId: Id<'users'> | null, patientId: Id<'patients'> | null) {
  return useQuery(api.patients.getPatientById, staffUserId && patientId ? { staffUserId, patientId } : 'skip')
}

export function usePatientActions(staffUserId: Id<'users'>) {
  const convex = useConvex()
  return {
    getPatientByBpjsId: (bpjsId: string) =>
      convex.query(api.patients.getPatientByBpjsId, { staffUserId, bpjsId }),
    searchPatientsByBpjsIdOrName: (search: string) =>
      convex.query(api.patients.searchPatientsByBpjsIdOrName, { staffUserId, search }),
  }
}
