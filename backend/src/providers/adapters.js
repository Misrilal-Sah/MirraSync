/**
 * MirraSync Provider Adapters
 * Handles streaming API calls to all 8 AI providers.
 * Each adapter normalizes the provider's SSE format into a standard event stream.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Main entry point — routes to correct adapter based on model's adapterType
 */
async function streamFromModel(model, messages, userApiKey, userAccountId, onToken, onError, onDone) {
  const apiKey = userApiKey || process.env[model.apiKeyEnv];
  if (!apiKey) {
    onError('NO_KEY', 'No API key configured for this provider. Add your key in Settings.');
    return;
  }

  try {
    switch (model.adapterType) {
      case 'openai_compatible':
        await streamOpenAICompatible(model, messages, apiKey, onToken, onError, onDone);
        break;
      case 'google_ai':
        await streamGoogleAI(model, messages, apiKey, onToken, onError, onDone);
        break;
      case 'cohere':
        await streamCohere(model, messages, apiKey, onToken, onError, onDone);
        break;
      case 'cloudflare':
        const accountId = userAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;
        await streamCloudflare(model, messages, apiKey, accountId, onToken, onError, onDone);
        break;
      default:
        onError('UNKNOWN_ADAPTER', `Unknown adapter type: ${model.adapterType}`);
    }
  } catch (err) {
    console.error(`Error streaming from ${model.id}:`, err.message);
    onError('PROVIDER_ERROR', err.message);
  }
}

/**
 * OpenAI-compatible adapter
 * Used by: GitHub Models, Groq, Cerebras, Mistral, OpenRouter
 */
async function streamOpenAICompatible(model, messages, apiKey, onToken, onError, onDone) {
  const baseUrl = process.env[model.baseUrlEnv];
  const url = new URL(`${baseUrl}/chat/completions`);

  const body = JSON.stringify({
    model: model.modelId,
    messages: formatMessagesForOpenAI(messages),
    stream: true,
    temperature: 0.7,
    max_tokens: 4096,
  });

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    ...(model.extraHeaders || {}),
  };

  // doneRef lets the onLine closure signal completion through makeStreamRequest's guard
  const doneRef = { called: false };

  await makeStreamRequest(url, 'POST', headers, body, (line, safeDone) => {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') { safeDone(); return; }
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) onToken(delta);
        if (parsed.choices?.[0]?.finish_reason) safeDone();
      } catch (e) { /* ignore parse errors in stream */ }
    }
  }, onError, onDone);
}

/**
 * Google AI Studio adapter
 */
async function streamGoogleAI(model, messages, apiKey, onToken, onError, onDone) {
  const baseUrl = process.env[model.baseUrlEnv];
  const url = new URL(`${baseUrl}/models/${model.modelId}:streamGenerateContent`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('alt', 'sse');

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const systemMessage = messages.find(m => m.role === 'system');
  const body = JSON.stringify({
    contents,
    ...(systemMessage ? { systemInstruction: { parts: [{ text: systemMessage.content }] } } : {}),
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
  });

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  await makeStreamRequest(url, 'POST', headers, body, (line, safeDone) => {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) onToken(text);
        if (parsed.candidates?.[0]?.finishReason) safeDone();
      } catch (e) {}
    }
  }, onError, onDone);
}

/**
 * Cohere adapter
 */
async function streamCohere(model, messages, apiKey, onToken, onError, onDone) {
  const baseUrl = process.env[model.baseUrlEnv];
  const url = new URL(`${baseUrl}/chat`);

  const body = JSON.stringify({
    model: model.modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
  });

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  await makeStreamRequest(url, 'POST', headers, body, (line, safeDone) => {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content-delta') {
          const text = parsed.delta?.message?.content?.text;
          if (text) onToken(text);
        }
        if (parsed.type === 'message-end') safeDone();
      } catch (e) {}
    }
  }, onError, onDone);
}

/**
 * Cloudflare Workers AI adapter
 */
async function streamCloudflare(model, messages, apiKey, accountId, onToken, onError, onDone) {
  const baseUrl = process.env[model.baseUrlEnv];
  const url = new URL(`${baseUrl}/${accountId}/ai/run/${model.modelId}`);

  const body = JSON.stringify({
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
  });

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  await makeStreamRequest(url, 'POST', headers, body, (line, safeDone) => {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') { safeDone(); return; }
      try {
        const parsed = JSON.parse(data);
        const text = parsed.response || parsed.choices?.[0]?.delta?.content;
        if (text) onToken(text);
      } catch (e) {}
    }
  }, onError, onDone);
}

/**
 * Generic SSE stream request handler
 */
function makeStreamRequest(url, method, headers, body, onLine, onError, onDone) {
  return new Promise((resolve) => {
    const lib = url.protocol === 'https:' ? https : http;
    let buffer = '';
    let doneCalled = false;

    // Idempotent done — any path (onLine callback OR stream end) calls this
    const safeDone = () => {
      if (doneCalled) return;
      doneCalled = true;
      clearTimeout(timeout);
      onDone();
      resolve();
    };

    const safeError = (code, msg) => {
      if (doneCalled) return;
      doneCalled = true;
      clearTimeout(timeout);
      onError(code, msg);
      resolve();
    };

    const timeout = setTimeout(() => {
      req.destroy();
      safeError('TIMEOUT', 'Request timed out after 30 seconds');
    }, 30000);

    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
    }, (res) => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        safeError('AUTH_ERROR', 'Invalid API key. Please check your key in Settings.');
        return;
      }
      if (res.statusCode === 429) {
        safeError('RATE_LIMIT', 'Rate limit reached. Please wait before retrying.');
        return;
      }
      if (res.statusCode >= 500) {
        safeError('PROVIDER_ERROR', `Provider error (${res.statusCode}). Try again later.`);
        return;
      }
      // Catch-all for any other non-2xx status (400, 404, 422, etc.)
      if (res.statusCode < 200 || res.statusCode >= 300) {
        let errorBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { errorBody += chunk; });
        res.on('end', () => {
          let errorMsg = `Request failed (${res.statusCode})`;
          try {
            const parsed = JSON.parse(errorBody);
            errorMsg = parsed.error?.message || parsed.message || parsed.error || errorMsg;
            if (typeof errorMsg === 'object') errorMsg = JSON.stringify(errorMsg);
          } catch (e) {
            if (errorBody.length < 500) errorMsg += ': ' + errorBody.trim();
          }
          console.error(`Model API error ${res.statusCode}:`, errorMsg);
          safeError('PROVIDER_ERROR', errorMsg);
        });
        return;
      }

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.trim()) onLine(line, safeDone);
        }
      });
      res.on('end', () => {
        if (buffer.trim()) onLine(buffer, safeDone);
        safeDone();
      });
      res.on('error', (err) => {
        safeError('NETWORK_ERROR', err.message);
      });
    });

    req.on('error', (err) => {
      safeError('NETWORK_ERROR', err.message);
    });

    if (body) req.write(body);
    req.end();
  });
}

function formatMessagesForOpenAI(messages) {
  return messages.map(m => ({
    role: m.role,
    content: m.content
  }));
}

module.exports = { streamFromModel };
