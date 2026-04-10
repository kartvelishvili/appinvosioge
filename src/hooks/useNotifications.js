import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseQuery } from './useSupabaseQuery';

export const useNotifications = () => {
  const { user, loading: authLoading } = useAuth();
  
  const fetchNotificationsFn = useCallback(async () => {
    if (authLoading || !user) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }, [user, authLoading]);

  const { data: notifications, loading, error, retry } = useSupabaseQuery(
    fetchNotificationsFn,
    [user, authLoading],
    { fallbackData: [], immediate: true }
  );

  const [localNotifications, setLocalNotifications] = useState([]);
  
  useEffect(() => {
    if (notifications) setLocalNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!user) return;
    // Polling instead of Supabase Realtime (every 15 seconds)
    const interval = setInterval(retry, 15000);
    return () => clearInterval(interval);
  }, [user, retry]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').update({ read: true, updated_at: new Date().toISOString() }).eq('id', notificationId);
      if (error) throw error;
      setLocalNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Error marking read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').update({ read: true, updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('read', false);
      if (error) throw error;
      setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  }, [user]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (error) throw error;
      setLocalNotifications([]);
    } catch (error) {
      console.error('Error clearing:', error);
    }
  }, [user]);

  const unreadCount = localNotifications.filter(n => !n.read).length;

  return {
    notifications: localNotifications,
    unreadCount,
    loading: loading || authLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: retry,
  };
};