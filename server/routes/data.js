const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

// ─── Allowed tables (whitelist for security) ───
const ALLOWED_TABLES = new Set([
  'invoices', 'invoice_items', 'clients', 'performers', 'contracts',
  'auto_invoices', 'user_profiles', 'user_dots', 'notifications',
  'one_time_invoices', 'email_templates', 'sms_templates',
  'reminder_schedules', 'reminders_log', 'demo_requests',
  'email_settings', 'sms_settings', 'email_logs', 'sms_logs',
  'sms_history', 'sms_campaigns', 'company_profiles', 'companies',
  'transactions', 'invoice_payments', 'auth_users',
]);

// Tables accessible without auth
const PUBLIC_TABLES = new Set(['demo_requests']);

function validateTable(table) {
  if (!table || !ALLOWED_TABLES.has(table)) {
    throw new Error(`Table "${table}" is not allowed`);
  }
}

// ─── Parse relational select into JOINs ───
// Converts "*, clients(id, company)" into proper SQL with LEFT JOINs
function parseSelect(table, selectStr) {
  if (!selectStr) return { columns: '*', joins: [], relatedTables: [] };

  const relatedTables = [];
  const joins = [];
  let mainColumns = [];

  // Match relation patterns: tableName(col1, col2, ...)  or tableName(*)
  const relationRegex = /(\w+)\s*\(([^)]+)\)/g;
  let cleaned = selectStr;
  let match;

  while ((match = relationRegex.exec(selectStr)) !== null) {
    const relTable = match[1];
    const relCols = match[2].trim();
    if (!ALLOWED_TABLES.has(relTable)) continue;

    relatedTables.push(relTable);
    const relColList = relCols === '*'
      ? `row_to_json(${relTable}.*)`
      : relCols.split(',').map(c => `${relTable}.${c.trim()}`).join(', ');

    // We'll handle this via subquery in the actual query
    cleaned = cleaned.replace(match[0], '');
  }

  // Clean up leftover commas
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/^[\s,]+|[\s,]+$/g, '').trim();

  return {
    mainSelect: cleaned || '*',
    relatedTables,
  };
}

// ─── Build WHERE clause from filters ───
function buildWhere(filters, params) {
  if (!filters || filters.length === 0) return { clause: '', params };

  const conditions = [];
  for (const f of filters) {
    const idx = params.length + 1;
    switch (f.op) {
      case 'eq':
        conditions.push(`${f.column} = $${idx}`);
        params.push(f.value);
        break;
      case 'neq':
        conditions.push(`${f.column} != $${idx}`);
        params.push(f.value);
        break;
      case 'gt':
        conditions.push(`${f.column} > $${idx}`);
        params.push(f.value);
        break;
      case 'gte':
        conditions.push(`${f.column} >= $${idx}`);
        params.push(f.value);
        break;
      case 'lt':
        conditions.push(`${f.column} < $${idx}`);
        params.push(f.value);
        break;
      case 'lte':
        conditions.push(`${f.column} <= $${idx}`);
        params.push(f.value);
        break;
      case 'like':
        conditions.push(`${f.column} LIKE $${idx}`);
        params.push(f.value);
        break;
      case 'ilike':
        conditions.push(`${f.column} ILIKE $${idx}`);
        params.push(f.value);
        break;
      case 'is':
        if (f.value === null) conditions.push(`${f.column} IS NULL`);
        else if (f.value === 'null') conditions.push(`${f.column} IS NULL`);
        else conditions.push(`${f.column} IS NOT NULL`);
        break;
      case 'in':
        const placeholders = f.value.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...f.value);
        conditions.push(`${f.column} IN (${placeholders})`);
        break;
      case 'not':
        // not.is.null => IS NOT NULL; not.eq.value => != value
        if (f.modifier === 'is' && (f.value === null || f.value === 'null')) {
          conditions.push(`${f.column} IS NOT NULL`);
        } else {
          conditions.push(`${f.column} != $${idx}`);
          params.push(f.value);
        }
        break;
      case 'or':
        // Raw OR expression — passed as pre-built SQL-safe string
        conditions.push(`(${f.value})`);
        break;
      default:
        conditions.push(`${f.column} = $${idx}`);
        params.push(f.value);
    }
  }

  return { clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

// ─── POST /api/data/query ───
router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { table, select = '*', filters = [], order = [], limit, offset, single, maybeSingle } = req.body;
    validateTable(table);

    const { mainSelect, relatedTables } = parseSelect(table, select);
    const params = [];
    const { clause: whereClause } = buildWhere(filters, params);

    // Build base query
    let sql = '';

    if (relatedTables.length > 0) {
      // Use subquery approach for relations via foreign keys
      const subqueries = relatedTables.map(rt => {
        // Determine FK: convention is table_id or id matching
        // Common patterns: client_id -> clients, performer_id -> performers
        const singularRT = rt.replace(/s$/, '');
        const fkColumn = `${singularRT}_id`;

        // Get the columns for the related table from original select
        const relMatch = select.match(new RegExp(`${rt}\\s*\\(([^)]+)\\)`));
        const relCols = relMatch ? relMatch[1].trim() : '*';

        return `(SELECT row_to_json(sub) FROM (SELECT ${relCols === '*' ? '*' : relCols} FROM ${rt} WHERE ${rt}.id = ${table}.${fkColumn}) sub) AS ${rt}`;
      });

      const mainCols = mainSelect === '*' ? `${table}.*` : mainSelect.split(',').map(c => {
        c = c.trim();
        return c.includes('.') ? c : `${table}.${c}`;
      }).join(', ');

      sql = `SELECT ${mainCols}, ${subqueries.join(', ')} FROM ${table}`;
    } else {
      sql = `SELECT ${mainSelect} FROM ${table}`;
    }

    sql += ` ${whereClause}`;

    // ORDER BY
    if (order.length > 0) {
      const orderParts = order.map(o => `${o.column} ${o.ascending === false ? 'DESC' : 'ASC'}`);
      sql += ` ORDER BY ${orderParts.join(', ')}`;
    }

    // LIMIT
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }

    // OFFSET
    if (offset) {
      sql += ` OFFSET ${parseInt(offset)}`;
    }

    const result = await pool.query(sql, params);

    if (single) {
      if (result.rows.length === 0) {
        return res.status(406).json({ error: 'Row not found', data: null });
      }
      return res.json({ data: result.rows[0], error: null });
    }

    if (maybeSingle) {
      return res.json({ data: result.rows[0] || null, error: null });
    }

    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('Data query error:', err);
    res.status(400).json({ data: null, error: err.message });
  }
});

// ─── POST /api/data/insert ───
router.post('/insert', authMiddleware, async (req, res) => {
  try {
    const { table, data, returnData = true } = req.body;
    validateTable(table);

    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return res.json({ data: [], error: null });

    const columns = Object.keys(rows[0]);
    const values = [];
    const placeholders = [];

    rows.forEach((row, ri) => {
      const rowPlaceholders = columns.map((col, ci) => {
        values.push(row[col] !== undefined ? row[col] : null);
        return `$${ri * columns.length + ci + 1}`;
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    let sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;
    if (returnData) sql += ' RETURNING *';

    const result = await pool.query(sql, values);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('Data insert error:', err);
    res.status(400).json({ data: null, error: err.message });
  }
});

// ─── POST /api/data/update ───
router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { table, data, filters = [] } = req.body;
    validateTable(table);

    const columns = Object.keys(data);
    const params = [];
    const setParts = columns.map((col, i) => {
      params.push(data[col]);
      return `${col} = $${i + 1}`;
    });

    const { clause: whereClause } = buildWhere(filters, params);

    const sql = `UPDATE ${table} SET ${setParts.join(', ')} ${whereClause} RETURNING *`;
    const result = await pool.query(sql, params);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('Data update error:', err);
    res.status(400).json({ data: null, error: err.message });
  }
});

// ─── POST /api/data/delete ───
router.post('/delete', authMiddleware, async (req, res) => {
  try {
    const { table, filters = [] } = req.body;
    validateTable(table);

    const params = [];
    const { clause: whereClause } = buildWhere(filters, params);

    if (!whereClause) {
      return res.status(400).json({ error: 'DELETE without WHERE is not allowed' });
    }

    const sql = `DELETE FROM ${table} ${whereClause} RETURNING *`;
    const result = await pool.query(sql, params);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('Data delete error:', err);
    res.status(400).json({ data: null, error: err.message });
  }
});

// ─── POST /api/data/upsert ───
router.post('/upsert', authMiddleware, async (req, res) => {
  try {
    const { table, data, onConflict = 'id' } = req.body;
    validateTable(table);

    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return res.json({ data: [], error: null });

    const columns = Object.keys(rows[0]);
    const values = [];
    const placeholders = [];

    rows.forEach((row, ri) => {
      const rowPlaceholders = columns.map((col, ci) => {
        values.push(row[col] !== undefined ? row[col] : null);
        return `$${ri * columns.length + ci + 1}`;
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const updateParts = columns.filter(c => c !== onConflict).map(c => `${c} = EXCLUDED.${c}`);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}
      ON CONFLICT (${onConflict}) DO UPDATE SET ${updateParts.join(', ')}
      RETURNING *`;

    const result = await pool.query(sql, values);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('Data upsert error:', err);
    res.status(400).json({ data: null, error: err.message });
  }
});

// ─── Public query endpoint (for demo_requests etc.) ───
router.post('/public/insert', async (req, res) => {
  try {
    const { table, data } = req.body;
    if (!PUBLIC_TABLES.has(table)) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    validateTable(table);

    const rows = Array.isArray(data) ? data : [data];
    const columns = Object.keys(rows[0]);
    const values = [];
    const placeholders = [];

    rows.forEach((row, ri) => {
      const rowPlaceholders = columns.map((col, ci) => {
        values.push(row[col] !== undefined ? row[col] : null);
        return `$${ri * columns.length + ci + 1}`;
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`;
    const result = await pool.query(sql, values);
    res.json({ data: result.rows, error: null });
  } catch (err) {
    console.error('Public insert error:', err);
    res.status(400).json({ data: null, error: err.message });
  }
});

// ─── File upload endpoint ───
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure upload directories exist
['public', 'client-logos', 'avatars'].forEach(bucket => {
  const dir = path.join(UPLOAD_DIR, bucket);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const bucket = req.params.bucket || 'public';
    cb(null, path.join(UPLOAD_DIR, bucket));
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  },
});

router.post('/upload/:bucket', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const bucket = req.params.bucket;
  const filePath = `${bucket}/${req.file.filename}`;
  const publicUrl = `/uploads/${filePath}`;

  res.json({ data: { path: filePath, publicUrl }, error: null });
});

router.get('/upload/url/:bucket/:filename', (req, res) => {
  const { bucket, filename } = req.params;
  res.json({ data: { publicUrl: `/uploads/${bucket}/${filename}` } });
});

module.exports = router;
