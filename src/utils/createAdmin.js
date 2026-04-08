import { supabase } from '../lib/customSupabaseClient';

// This utility function invokes the edge function to create the admin user
export async function createAdminUser() {
  try {
    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      body: {}
    });

    if (error) {
      console.error('Error invoking create-admin-user function:', error);
      return { success: false, error };
    }

    console.log('Admin user creation response:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error creating admin user:', err);
    return { success: false, error: err };
  }
}

// Auto-execute if imported (optional, but good for initialization scripts)
// For this environment, we'll rely on manual invocation or integration into a component if needed.