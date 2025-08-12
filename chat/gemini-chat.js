/* Gemini Chat (vanilla JS) – Q&A about Corey using resume.json context */
const API_KEY = 'AIzaSyDZdLgX_XQP6jaN7eCprfJx15GGt2nYD4k'; // Restrict via HTTP referrer in Google Cloud console.
const MODEL_ID = 'gemini-1.5-pro-latest'; // align with working setup
const MAX_HISTORY = 6;

const el = {
  log: null,
  form: null,
  input: null,
  send: null,
  section: null,
};

let resumeData = null;
let history = []; // {role:'user'|'model', text:''}

// Lazy-loaded SDK + model instance
let genAI = null;
let model = null;

async function ensureModel() {
  if (model) return model;
  if (!API_KEY) throw new Error('Missing Gemini API key');
  // Dynamic import of the browser SDK to match working setup
  const { GoogleGenerativeAI } = await import(
    'https://esm.run/@google/generative-ai'
  );
  genAI = new GoogleGenerativeAI(API_KEY);
  // Set a persistent system instruction to enforce role and style across turns
  model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction:
  "You are 'Corey Portfolio Assistant' — a concise, persuasive advocate for Corey when speaking to hiring managers. Primary goal: demonstrate Corey's fit and value for the user's needs. Speak in third person about Corey (he/him). Use only factual details from the resume JSON or prior messages; never invent facts. If the user shares a job description or role text, tailor the response to: (1) a 2–3 line fit summary, (2) requirement → Corey evidence mapping, (3) relevant achievements with outcomes/metrics, (4) tech/skills coverage, (5) suggested next steps/CTA. Focus on strengths and relevance; do not call out gaps or negatives unless the user asks directly. Keep a confident, warm, and succinct tone with no hedging or disclaimers. Prefer short sentences and scannable bullets. Include titles, companies, dates, scope, impact, and tech stack when relevant. Use Markdown formatting (lists, short headings) when helpful.",
  });
  return model;
}

init();

async function init() {
  el.log = document.getElementById('chat-log');
  el.form = document.getElementById('chat-form');
  el.input = document.getElementById('chat-input');
  el.send = document.getElementById('chat-send');
  el.section = document.getElementById('corey-chat');
  if (!el.log || !el.form) return;
  try {
    const res = await fetch('./resume.json');
    resumeData = await res.json();
    systemMsg(
      "Ask about Corey's experience, skills, projects, or background. Designed for hiring managers—ask about outcomes, scope, dates, roles, or tech stack."
    );
  } catch (e) {
    systemMsg('Failed to load resume data.');
    console.error(e);
  }
  el.form.addEventListener('submit', onSubmit);
}

function buildContext() {
  return JSON.stringify(resumeData, null, 2);
}

function buildUserPrompt(q) {
  return `Context (resume JSON):\n${buildContext()}\n\nUser message (may include a job description): ${q}\n\nInstructions:\n- Answer clearly in third person.\n- Use only facts from the context; never invent details.\n- Act as an advocate: emphasize Corey's fit and value for the user's needs.\n- If the message includes a job description or role text, structure the answer as:\n  1) Fit overview (2–3 lines).\n  2) Requirement → Corey evidence mapping (bullets).\n  3) Relevant achievements with outcomes/metrics.\n  4) Tech/skills coverage relevant to the role.\n  5) Suggested next steps/CTA (e.g., share demo, references, 30/60/90).\n- Focus on strengths; do not volunteer gaps or negatives unless directly asked.\n- If a direct, specific detail is missing, say briefly it's not in the resume and, when helpful, add closely related known facts.\n- Otherwise, omit unknown details instead of calling them out.\n- Prefer concise bullets.`;
}

async function onSubmit(e) {
  e.preventDefault();
  const q = el.input.value.trim();
  if (!q) return;
  el.input.value = '';
  addMsg('user', q);
  await generate(q);
}

function addMsg(role, text) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role === 'user' ? 'user' : 'ai'}`;
  if (role === 'ai') {
    const inner = document.createElement('div');
    inner.className = 'bubble';
    inner.textContent = text;
    div.appendChild(inner);
  } else {
    div.textContent = text;
  }
  el.log.appendChild(div);
  el.log.scrollTop = el.log.scrollHeight;
  return div;
}

function systemMsg(text) {
  const m = document.createElement('div');
  m.className = 'chat-status';
  m.textContent = text;
  el.log.appendChild(m);
  el.log.scrollTop = el.log.scrollHeight;
}

function setBusy(b) {
  el.send.disabled = b;
  el.input.disabled = b;
  if (b) el.send.classList.add('busy');
  else el.send.classList.remove('busy');
}

function typingIndicator() {
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg ai';
  const b = document.createElement('div');
  b.className = 'bubble';
  const t = document.createElement('div');
  t.className = 'typing';
  t.innerHTML = '<span></span><span></span><span></span>';
  b.appendChild(t);
  wrap.appendChild(b);
  el.log.appendChild(wrap);
  el.log.scrollTop = el.log.scrollHeight;
  return wrap;
}

async function generate(question) {
  setBusy(true);
  const indicator = typingIndicator();
  try {
    const userPrompt = buildUserPrompt(question);
    const trimmedHistory = history.slice(-MAX_HISTORY);
    const contents = [
      ...trimmedHistory.map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      })),
      { role: 'user', parts: [{ text: userPrompt }] },
    ];
    const mdl = await ensureModel();
    // Stream the response for a better UX and Markdown rendering
    const streamResult = await mdl.generateContentStream({
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1200,
        topP: 0.9,
        responseMimeType: 'text/plain',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH',
        },
      ],
    });

    let buffer = '';
    // Create the AI message bubble to progressively fill
    indicator.remove();
    const aiDiv = addMsg('ai', '');
    const bubble = aiDiv.querySelector('.bubble');

    await ensureMarkdown();
    window.__snarkdown = snarkdown;
    for await (const chunk of streamResult.stream) {
      const chunkText = chunk?.text?.() || '';
      if (!chunkText) continue;
      buffer += chunkText;
      bubble.innerHTML = markdownToHtml(buffer);
      el.log.scrollTop = el.log.scrollHeight;
    }

    // Ensure final response is captured for history
    const finalResponse = await streamResult.response;
    let answer = finalResponse?.text?.() || buffer || '';
    let truncated = false;
    try {
      const cand = finalResponse?.candidates?.[0];
      const fr = cand?.finishReason || cand?.finish_reason;
      if (fr && String(fr).toUpperCase().includes('MAX')) truncated = true;
    } catch {}
    answer = (answer || 'No answer produced.').trim();

    // If truncated by token limit, ask Gemini to continue and stream into the same bubble
    let continueCount = 0;
    while (truncated && continueCount < 2) {
      continueCount++;
      const continueContents = [
        ...contents,
        { role: 'model', parts: [{ text: answer }] },
        {
          role: 'user',
          parts: [
            {
              text: 'Continue the same answer from where you left off. Do not repeat any text. Keep the same format and bullet structure.',
            },
          ],
        },
      ];
      const contStream = await mdl.generateContentStream({
        contents: continueContents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1200,
          topP: 0.9,
          responseMimeType: 'text/plain',
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_ONLY_HIGH',
          },
        ],
      });

      for await (const chunk of contStream.stream) {
        const t = chunk?.text?.() || '';
        if (!t) continue;
        answer += t;
        bubble.innerHTML = markdownToHtml(answer);
        el.log.scrollTop = el.log.scrollHeight;
      }
      const contFinal = await contStream.response;
      let fr2 = '';
      try {
        const cand2 = contFinal?.candidates?.[0];
        fr2 = cand2?.finishReason || cand2?.finish_reason || '';
      } catch {}
      truncated = !!fr2 && String(fr2).toUpperCase().includes('MAX');
    }

    bubble.innerHTML = markdownToHtml(answer);
    history.push({ role: 'user', text: question });
    history.push({ role: 'model', text: answer });
  } catch (err) {
    console.error(err);
    indicator.remove();
    addMsg('ai', 'Sorry, there was an error generating a response.');
  } finally {
    setBusy(false);
  }
}

// --- Markdown rendering via snarkdown (lightweight) ---
let snarkdown = null;
async function ensureMarkdown() {
  if (snarkdown) return snarkdown;
  // Import from CDN for browser; node_modules is not directly accessible in static hosting
  const mod = await import('https://esm.run/snarkdown');
  snarkdown = mod.default || mod;
  return snarkdown;
}

function sanitizeHtml(html) {
  // Basic sanitizer: strip script/style and on* attributes
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('script,style').forEach((el) => el.remove());
  div.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    });
  });
  return div.innerHTML;
}

function markdownToHtml(md) {
  if (!md) return '';
  const mdLib = snarkdown;
  if (!mdLib) return md.replace(/</g, '&lt;');
  const html = mdLib(md);
  return sanitizeHtml(html);
}
