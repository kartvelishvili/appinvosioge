import api from '@/lib/api';

// This utility function calls the backend to create the admin user
export async function createAdminUser() {
  try {
    const data = await api.post('/api/create-admin-user', {});
    console.log('Admin user creation response:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Error creating admin user:', err);
    return { success: false, error: err };
  }
}

// Auto-execute if imported (optional, but good for initialization scripts)
// For this environment, we'll rely on manual invocation or integration into a component if needed.