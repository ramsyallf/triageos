import { useConvex, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function usePatientSearch(search: string) {
  return useQuery(
    api.patients.searchPatientsByBpjsIdOrName,
    search.trim() ? { search: search.trim() } : 'skip'
  )
}

export function usePatientById(patientId: Id<'patients'> | null) {
  return useQuery(api.patients.getPatientById, patientId ? { patientId } : 'skip')
}

export function usePatientActions() {
  const convex = useConvex()
  return {
    getPatientByBpjsId: (bpjsId: string) =>
      convex.query(api.patients.getPatientByBpjsId, { bpjsId }),
    searchPatientsByBpjsIdOrName: (search: string) =>
      convex.query(api.patients.searchPatientsByBpjsIdOrName, { search }),
  }
}
