import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Profile = { id: string; username: string; display_name: string; status_message: string; phone_search_enabled: boolean };
type AuthState = { session: Session | null; user: User | null; profile: Profile | null; loading: boolean; refreshProfile: () => Promise<void> };
const Context = createContext<AuthState>({ session: null, user: null, profile: null, loading: true, refreshProfile: async () => {} });
export const useAuth = () => useContext(Context);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshProfile = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfile(null); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!data && user.phone_confirmed_at && user.user_metadata?.username && user.user_metadata?.display_name) {
      const { data: created } = await supabase.from('profiles').upsert({ id:user.id, username:String(user.user_metadata.username).toLowerCase(), display_name:String(user.user_metadata.display_name) }).select('*').maybeSingle();
      setProfile(created);
    } else setProfile(data);
  };
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) setTimeout(() => { void refreshProfile().finally(() => setLoading(false)); }, 0);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);
  return <Context.Provider value={{ session, user: session?.user ?? null, profile, loading, refreshProfile }}>{children}</Context.Provider>;
}
