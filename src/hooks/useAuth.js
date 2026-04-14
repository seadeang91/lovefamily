import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u))
    return unsubscribe
  }, [])

  return { user, loading: user === undefined }
}
