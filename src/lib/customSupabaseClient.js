import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqcamflbvibipgsxuxxl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxY2FtZmxidmliaXBnc3h1eHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjA5MTMsImV4cCI6MjA4ODU5NjkxM30.sxdvzewpZuCfEyLI02RrS0NE45h5gnHiUV_FlHmwDsA';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
