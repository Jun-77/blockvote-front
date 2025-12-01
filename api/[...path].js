export default async function handler(req, res) {
  try {
    const base = process.env.BACKEND_URL;
    if (!base) {
      res.status(500).json({ success: false, message: 'BACKEND_URL is not set' });
      return;
    }

    // Correct catch-all usage: Vercel stores segments in req.query.path
    const segments = Array.isArray(req.query.path)
      ? req.query.path
      : [req.query.path].filter(Boolean);

    const subPath = segments.join('/');

    // Extract user-defined query params (but remove Vercel internals)
    const params = new URLSearchParams(req.query);
    params.delete('path'); // remove Vercel catch-all param

    const qs = params.toString() ? `?${params.toString()}` : '';

    const target = `${base.replace(/\/+$/, '')}/api/${subPath}${qs}`;
    console.log('[proxy] incoming', { method: req.method, raw: req.url, subPath, target });

    const fwdHeaders = { ...req.headers };
    delete fwdHeaders.host;
    delete fwdHeaders.connection;
    delete fwdHeaders['content-length'];
    delete fwdHeaders['accept-encoding'];

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    const resp = await fetch(target, {
      method: req.method,
      headers: fwdHeaders,
      body,
    });

    resp.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (['content-length', 'transfer-encoding', 'connection', 'content-encoding'].includes(k)) return;
      if (k === 'set-cookie') return;
      res.setHeader(key, value);
    });

    const buf = Buffer.from(await resp.arrayBuffer());
    res.status(resp.status).end(buf);
  } catch (err) {
    console.error('[proxy] error', err);
    res.status(502).json({ success: false, message: 'Upstream proxy error', error: String(err && err.message || err) });
  }
}
