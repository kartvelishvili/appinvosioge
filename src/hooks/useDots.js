import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const POLL_INTERVAL = 30000; // 30 seconds

export const useDots = () => {
  const { user, loading: authLoading } = useAuth();
  const [dotsData, setDotsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserDots = useCallback(async () => {
    if (authLoading) return;
    
    if (!user) {
      setDotsData(null);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      
      let { data, error } = await supabase
        .from('user_dots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_dots')
          .insert([{ 
            user_id: user.id, 
            dots_count: 4,
            last_dot_added: new Date().toISOString()
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      }

      setDotsData(data);
    } catch (err) {
      console.error('Error fetching dots:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  const calculateNextDotDate = useCallback(() => {
    if (!dotsData?.last_dot_added) return null;
    const lastDate = new Date(dotsData.last_dot_added);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 5);
    return nextDate;
  }, [dotsData]);

  const formatDotsDisplay = useCallback((count) => {
    const displayCount = Math.min(count || 0, 20);
    return '•'.repeat(displayCount);
  }, []);

  useEffect(() => {
    fetchUserDots();

    // Polling instead of Supabase Realtime
    const interval = setInterval(fetchUserDots, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUserDots]);

  return {
    dotsData,
    loading: loading || authLoading,
    error,
    fetchUserDots,
    calculateNextDotDate,
    formatDotsDisplay
  };
};