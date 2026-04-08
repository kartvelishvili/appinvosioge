import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useDots = () => {
  const { user, loading: authLoading } = useAuth();
  const [dotsData, setDotsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserDots = useCallback(async () => {
    if (authLoading) return; // Wait for auth to initialize
    
    if (!user) {
      setDotsData(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      let { data, error } = await supabase
        .from('user_dots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no data exists, create default entry (fallback if trigger missed)
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

  const subscribeToDotsUpdates = useCallback(() => {
    if (!user) return;

    const subscription = supabase
      .channel('user_dots_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_dots',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setDotsData(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const calculateNextDotDate = useCallback(() => {
    if (!dotsData?.last_dot_added) return null;
    const lastDate = new Date(dotsData.last_dot_added);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 5);
    return nextDate;
  }, [dotsData]);

  const formatDotsDisplay = useCallback((count) => {
    // Limit visual dots to prevent UI breaking, e.g., max 20 dots visually
    const displayCount = Math.min(count || 0, 20);
    return '•'.repeat(displayCount);
  }, []);

  useEffect(() => {
    fetchUserDots();
    const unsubscribe = subscribeToDotsUpdates();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchUserDots, subscribeToDotsUpdates]);

  return {
    dotsData,
    loading: loading || authLoading,
    error,
    fetchUserDots,
    calculateNextDotDate,
    formatDotsDisplay
  };
};