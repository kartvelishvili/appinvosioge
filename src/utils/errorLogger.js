export const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    message: error?.message || 'Unknown error',
    name: error?.name,
    stack: error?.stack,
    context
  };
  
  console.error('[Supabase Error Logger]', errorLog);
  // In a real production app, you might send this to Sentry or another logging service.
};