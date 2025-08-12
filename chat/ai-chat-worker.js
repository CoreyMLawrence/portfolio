// ai-chat-worker.js
// Web Worker for streaming LLM inference using transformers.js

importScripts('transformers.min.js');
let pipe = null;
let ready = false;

self.onmessage = async (e) => {
  const { type, prompt, dtype } = e.data;

  if (type === 'init') {
    // Load the model only once
    if (!pipe) {
      self.postMessage({ type: 'status', status: 'Loading model...' });
      pipe = await self.pipeline(
        'text-generation',
        'Xenova/TinyLlama-1.1B-Chat-v1.0',
        {
          quantized: true,
          dtype: dtype || 'q4',
        }
      );
      ready = true;
      self.postMessage({ type: 'ready' });
    }
  }

  if (type === 'generate' && ready && prompt) {
    try {
      let output = '';
      const stream = await pipe.stream(prompt, {
        max_new_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
      });
      for await (const token of stream) {
        output += token;
        self.postMessage({ type: 'token', token });
      }
      self.postMessage({ type: 'done', output });
    } catch (err) {
      self.postMessage({ type: 'error', error: err.message });
    }
  }
};
