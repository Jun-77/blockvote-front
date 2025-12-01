export default async function handler(req, res) {
  try {
    const base = process.env.BACKEND_URL;
    if (!base) {
      res.status(500).json({ success: false, message: 'BACKEND_URL is not set' });
      return;
    }

    // Extract the full path after /api/
    const urlWithoutQuery = req.url.split('?')[0];
    const subPath = urlWithoutQuery.replace(/^\/api\//, '');

    // Extract query string, excluding Vercel's internal ...path parameter
    let qs = '';
    const qsIndex = req.url.indexOf('?');
    if (qsIndex !== -1) {
      const params = new URLSearchParams(req.url.substring(qsIndex));
      params.delete('...path'); // Remove Vercel's catch-all parameter
      const queryStr = params.toString();
      qs = queryStr ? `?${queryStr}` : '';
    }

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
