import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '../lib/supabaseClient'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false);
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, incomingSession) => {
      setSession(incomingSession)
    })

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, loading }

}
