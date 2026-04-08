import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useCallback } from 'react';

export const useCompanyBoost = () => {
  const { user, loading: authLoading } = useAuth();

  const fetchBoostStatus = useCallback(async () => {
    if (authLoading || !user) return false;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('boost_enabled')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) throw error;
    return data?.boost_enabled || false;
  }, [user, authLoading]);

  const { data: boostEnabled, loading, error, retry } = useSupabaseQuery(
    fetchBoostStatus,
    [user, authLoading],
    { fallbackData: false, immediate: true }
  );

  return { boostEnabled, loading: loading || authLoading, error, retry };
};