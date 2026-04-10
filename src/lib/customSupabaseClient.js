import api from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Supabase-compatible Query Builder ───
// Drop-in replacement that routes queries through our Express API

class QueryBuilder {
  constructor(table) {
    this._table = table;
    this._select = '*';
    this._filters = [];
    this._order = [];
    this._limit = null;
    this._offset = null;
    this._single = false;
    this._maybeSingle = false;
    this._operation = 'query'; // query | insert | update | delete | upsert
    this._data = null;
    this._returnData = true;
    this._onConflict = 'id';
    this._isPublic = false;
  }

  select(columns = '*') {
    this._select = columns;
    this._operation = 'query';
    return this;
  }

  insert(data) {
    this._data = data;
    this._operation = 'insert';
    return this;
  }

  update(data) {
    this._data = data;
    this._operation = 'update';
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
  }

  upsert(data, options = {}) {
    this._data = data;
    this._operation = 'upsert';
    if (options.onConflict) this._onConflict = options.onConflict;
    return this;
  }

  // Filters
  eq(column, value) { this._filters.push({ column, op: 'eq', value }); return this; }
  neq(column, value) { this._filters.push({ column, op: 'neq', value }); return this; }
  gt(column, value) { this._filters.push({ column, op: 'gt', value }); return this; }
  gte(column, value) { this._filters.push({ column, op: 'gte', value }); return this; }
  lt(column, value) { this._filters.push({ column, op: 'lt', value }); return this; }
  lte(column, value) { this._filters.push({ column, op: 'lte', value }); return this; }
  like(column, value) { this._filters.push({ column, op: 'like', value }); return this; }
  ilike(column, value) { this._filters.push({ column, op: 'ilike', value }); return this; }
  in(column, values) { this._filters.push({ column, op: 'in', value: values }); return this; }
  is(column, value) { this._filters.push({ column, op: 'is', value }); return this; }
  not(column, op, value) { this._filters.push({ column, op: 'not', modifier: op, value }); return this; }
  or(expr) { this._filters.push({ column: null, op: 'or', value: expr }); return this; }

  order(column, options = {}) {
    this._order.push({ column, ascending: options.ascending !== false });
    return this;
  }

  limit(count) { this._limit = count; return this; }

  range(from, to) {
    this._offset = from;
    this._limit = to - from + 1;
    return this;
  }

  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }

  // Execute the query (called automatically by await/then)
  async then(resolve, reject) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err.message || err });
    }
  }

  async _execute() {
    const token = localStorage.getItem('invoiso_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let endpoint;
    let body;

    switch (this._operation) {
      case 'query':
        endpoint = '/api/data/query';
        body = {
          table: this._table,
          select: this._select,
          filters: this._filters,
          order: this._order,
          limit: this._limit,
          offset: this._offset,
          single: this._single,
          maybeSingle: this._maybeSingle,
        };
        break;

      case 'insert':
        // Use public endpoint if no auth token available
        const hasToken = !!localStorage.getItem('invoiso_token');
        endpoint = (!hasToken) ? '/api/data/public/insert' : '/api/data/insert';
        body = { table: this._table, data: this._data, returnData: true };
        break;

      case 'update':
        endpoint = '/api/data/update';
        body = { table: this._table, data: this._data, filters: this._filters };
        break;

      case 'delete':
        endpoint = '/api/data/delete';
        body = { table: this._table, filters: this._filters };
        break;

      case 'upsert':
        endpoint = '/api/data/upsert';
        body = { table: this._table, data: this._data, onConflict: this._onConflict };
        break;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (!res.ok) {
      return { data: null, error: { message: result.error || 'Request failed' } };
    }

    // For insert operations that chain .select().single(), return the first row
    if (this._operation === 'insert' && this._single && result.data) {
      return { data: result.data[0] || null, error: null };
    }

    return result;
  }
}

// ─── Storage Client ───
class StorageBucket {
  constructor(bucket) {
    this._bucket = bucket;
  }

  async upload(filePath, file) {
    const token = localStorage.getItem('invoiso_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', filePath);

    const res = await fetch(`${API_URL}/api/data/upload/${this._bucket}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) return { data: null, error: { message: result.error } };
    return { data: result.data, error: null };
  }

  getPublicUrl(filePath) {
    // If the path already contains the bucket name, just use /uploads/path
    const url = filePath.startsWith(this._bucket)
      ? `${API_URL}/uploads/${filePath}`
      : `${API_URL}/uploads/${this._bucket}/${filePath}`;
    return { data: { publicUrl: url } };
  }
}

class StorageClient {
  from(bucket) {
    return new StorageBucket(bucket);
  }
}

// ─── Auth Client ───
class AuthClient {
  async getUser() {
    const token = localStorage.getItem('invoiso_token');
    if (!token) return { data: { user: null }, error: { message: 'Not authenticated' } };

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) return { data: { user: null }, error: { message: result.error } };
      return { data: { user: result.user }, error: null };
    } catch (err) {
      return { data: { user: null }, error: { message: err.message } };
    }
  }

  async getSession() {
    const token = localStorage.getItem('invoiso_token');
    if (!token) return { data: { session: null } };
    return { data: { session: { access_token: token } } };
  }

  async signOut() {
    localStorage.removeItem('invoiso_token');
    return { error: null };
  }

  onAuthStateChange() {
    // No-op — our JWT system doesn't have real-time auth events
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  async setSession() {
    // No-op — sessions managed via JWT in localStorage
    return { data: { session: null }, error: null };
  }
}

// ─── Main Client ───
const customSupabaseClient = {
  from(table) {
    return new QueryBuilder(table);
  },
  auth: new AuthClient(),
  storage: new StorageClient(),
};

export default customSupabaseClient;

export {
  customSupabaseClient,
  customSupabaseClient as supabase,
};
