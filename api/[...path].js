export default async function handler(req, res) {
  try {
    const base = process.env.BACKEND_URL;
    if (!base) {
      res.status(500).json({ success: false, message: 'BACKEND_URL is not set' });
      return;
    }

    const captured = req.query.path;
    const subPath = Array.isArray(captured) ? captured.join('/') : (captured || '');
    const qsIndex = req.url.indexOf('?');
    const qs = qsIndex !== -1 ? req.url.substring(qsIndex) : '';

    const target = `${base.replace(/\/+$/, '')}/api/${subPath}${qs}`;
    console.log('[proxy] incoming', { method: req.method, path: req.url, target });

    const fwdHeaders = { ...req.headers };
    delete fwdHeaders.host;
    delete fwdHeaders.connection;
    delete fwdHeaders['content-length'];
    delete fwdHeaders['accept-encoding'];

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body !== undefined && req.body !== null) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else {
        body = await new Promise((resolve, reject) => {
          const chunks = [];
          req.on('data', (c) => chunks.push(c));
          req.on('end', () => resolve(Buffer.concat(chunks)));
          req.on('error', reject);
        });
      }
    }

    const resp = await fetch(target, {
      method: req.method,
      headers: fwdHeaders,
      body,
    });

    // Forward headers except hop-by-hop
    resp.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k === 'content-length' || k === 'transfer-encoding' || k === 'connection' || k === 'content-encoding') return;
      if (k === 'set-cookie') return; // handled by platform, avoid duplication
      res.setHeader(key, value);
    });

    const buf = Buffer.from(await resp.arrayBuffer());
    res.status(resp.status).end(buf);
  } catch (err) {
    console.error('[proxy] error', err);
    res.status(502).json({ success: false, message: 'Upstream proxy error', error: String(err && err.message || err) });
  }
}
