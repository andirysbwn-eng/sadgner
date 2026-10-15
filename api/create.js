module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Request-Handler', 'apipass-create');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 1_000_000) {
        res.statusCode = 413;
        return res.end(JSON.stringify({ error: 'Request body terlalu besar.' }));
      }
    }

    let data;
    try {
      data = JSON.parse(body || '{}');
    } catch {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Body request bukan JSON yang valid.' }));
    }

    const key = String(data.apiKey || '').trim();
    const model = String(data.model || '').trim();
    const input = data.input;

    if (!key || !model || !input || typeof input !== 'object' || Array.isArray(input)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({
        error: 'API key, model, dan input wajib diisi.',
        source: 'website-validation'
      }));
    }

    const upstream = await fetch('https://api.apipass.dev/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model,
        input,
        channel: data.channel || 'auto'
      })
    });

    const raw = await upstream.text();
    let upstreamBody;
    try {
      upstreamBody = JSON.parse(raw);
    } catch {
      upstreamBody = raw;
    }

    // Keep successful ApiPass payloads unchanged for compatibility with the UI.
    if (upstream.ok) {
      res.statusCode = upstream.status;
      return res.end(typeof upstreamBody === 'string' ? upstreamBody : JSON.stringify(upstreamBody));
    }

    // Identify upstream errors clearly; never include or log the user's API key.
    const retryAfter = upstream.headers.get('retry-after');
    const detailText = typeof upstreamBody === 'string'
      ? upstreamBody
      : String(upstreamBody && (upstreamBody.detail || upstreamBody.message || upstreamBody.error) || '');
    const insufficientCredit = /insufficient credit|not enough credit|insufficient balance/i.test(detailText);
    res.statusCode = upstream.status;
    return res.end(JSON.stringify({
      error: insufficientCredit
        ? 'Kredit ApiPass tidak cukup untuk menjalankan model ini.'
        : upstream.status === 429
          ? 'ApiPass mengembalikan HTTP 429 (rate limit atau batas penggunaan).'
          : 'ApiPass mengembalikan respons error.',
      source: 'ApiPass',
      errorType: insufficientCredit ? 'INSUFFICIENT_CREDIT' : upstream.status === 429 ? 'RATE_LIMIT_OR_CREDIT_LIMIT' : 'UPSTREAM_ERROR',
      upstreamStatus: upstream.status,
      retryAfter: retryAfter || null,
      model,
      details: upstreamBody
    }));
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({
      error: 'Server website gagal menghubungi ApiPass.',
      source: 'website-server',
      details: String(e && e.message || e)
    }));
  }
};
