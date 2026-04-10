import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from stored JWT on mount
  useEffect(() => {
    const init = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const data = await api.get('/api/auth/me');
          setUser(data.user);
          setSession({ access_token: token });
        } catch {
          // Token expired or invalid
          api.setToken(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const signUp = useCallback(async (email, password, options) => {
    try {
      const result = await api.post('/api/auth/signup', {
        email,
        password,
        ...(options?.data || {}),
      });

      api.setToken(result.token);
      setUser(result.user);
      setSession({ access_token: result.token });

      return { error: null };
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: err.message || "Something went wrong",
      });
      return { error: err };
    }
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    try {
      const result = await api.post('/api/auth/login', { email, password });

      api.setToken(result.token);
      setUser(result.user);
      setSession({ access_token: result.token });

      return { error: null };
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: err.message || "Something went wrong",
      });
      return { error: err };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch { /* ignore */ }

    api.setToken(null);
    setUser(null);
    setSession(null);

    return { error: null };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};