const API_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  getToken() {
    return localStorage.getItem('invoiso_token');
  }

  setToken(token) {
    if (token) localStorage.setItem('invoiso_token', token);
    else localStorage.removeItem('invoiso_token');
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${path}`, options);
    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.error || `API Error ${res.status}`);
      err.status = res.status;
      throw err;
    }

    return data;
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  delete(path) { return this.request('DELETE', path); }
}

export const api = new ApiClient();
export default api;
