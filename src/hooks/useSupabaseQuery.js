import { useState, useCallback, useEffect } from 'react';
import { logError } from '@/utils/errorLogger';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useSupabaseQuery = (queryFn, dependencies = [], options = {}) => {
  const { 
    maxRetries = 3, 
    timeoutMs = 30000, 
    fallbackData = null,
    immediate = true 
  } = options;

  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    let attempts = 0;

    const attemptQuery = async () => {
      attempts++;
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
        );
        
        const result = await Promise.race([queryFn(...args), timeoutPromise]);
        setData(result);
        return result;
      } catch (err) {
        logError(err, { attempt: attempts, maxRetries });
        if (attempts < maxRetries) {
          const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
          await wait(delay);
          return attemptQuery();
        } else {
          setError(err.message || 'დაფიქსირდა შეცდომა მონაცემების ჩატვირთვისას');
          setData(fallbackData);
          throw err;
        }
      }
    };

    try {
      await attemptQuery();
    } catch (err) {
      // Error already handled in attemptQuery, just prevent unhandled promise rejection here
    } finally {
      setLoading(false);
    }
  }, [queryFn, maxRetries, timeoutMs, fallbackData]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [...dependencies]);

  return { data, loading, error, retry: execute };
};