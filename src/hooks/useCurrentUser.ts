import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useCurrentUser() {
  const currentStaff = useQuery(api.users.getCurrentUser)
  const upsertCurrentUserFromGoogle = useMutation(api.users.upsertCurrentUserFromGoogle)
  const hasUpsertedRef = useRef(false)

  useEffect(() => {
    if (currentStaff === null) {
      hasUpsertedRef.current = false
      return
    }
    if (currentStaff !== undefined && currentStaff !== null && !hasUpsertedRef.current) {
      hasUpsertedRef.current = true
      void upsertCurrentUserFromGoogle({})
    }
  }, [currentStaff, upsertCurrentUserFromGoogle])

  return currentStaff
}
