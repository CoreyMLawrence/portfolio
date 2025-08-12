// Chat Interface JavaScript with Gemini Integration
document.addEventListener('DOMContentLoaded', async () => {
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  const navItems = document.querySelectorAll('.nav-item');

  // Chat integration (migrated to /chat)
  let resumeData = null;
  let history = [];
  // Markdown renderer holder (set on window for global access)
  let snarkdown = null;

  // Load markdown renderer (snarkdown) dynamically
  try {
    const mod = await import('https://esm.run/snarkdown');
    snarkdown = mod.default || mod;
    window.__snarkdown = snarkdown;
  } catch (e) {
    console.error('Failed to load markdown renderer:', e);
  }

  // Load resume data
  try {
    const res = await fetch('./resume.json');
    resumeData = await res.json();
    console.log('Resume data loaded successfully');
    hydrateProfilePanel(resumeData);
  } catch (e) {
    console.error('Failed to load resume data:', e);
  }

  // Auto-resize textarea
  function autoResizeTextarea() {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
  }

  chatInput.addEventListener('input', autoResizeTextarea);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Handle suggestion chips
  suggestionChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const text = chip.textContent;
      chatInput.value = text;
      autoResizeTextarea();
      handleSendMessage();
    });
  });

  // Handle navigation
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all items
      navItems.forEach((nav) => nav.classList.remove('active'));

      // Add active class to clicked item
      item.classList.add('active');

      // Update chat context based on selection
      const section = item.dataset.section;
      updateChatContext(section);
    });
  });

  function updateChatContext(section) {
    // Generate a concise section summary using Gemini and résumé context
    const prompts = {
      about:
  "Provide a concise 'About Corey' summary for hiring managers. Emphasize strengths and how Corey adds value. Focus on roles, years of experience, domains, leadership, and impact. Include 4–7 short bullets. Third person. Use only facts from the résumé JSON. Omit unknowns.",
      projects:
  "Summarize Corey's flagship projects. Emphasize outcomes and relevance to typical hiring needs. Include project names, timeline, goals, outcomes/metrics, and tech stack. Use 4–8 bullets, grouped if helpful. Third person. Facts only from the résumé JSON. Omit unknowns.",
      expertise:
  "Summarize Corey's technical skills and expertise, highlighting strengths that matter to hiring managers. Group by categories (Product, Frontend, Backend, Cloud/DevOps, Data/AI, Tools). Note proficiency or depth when available and top tools. 5–10 bullets, concise. Third person. Facts only from the résumé JSON. Omit unknowns.",
      contact:
  "Provide Corey's contact and availability details suitable for a hiring manager. Include email, LinkedIn, portfolio URL, location, time zone, and preferred contact. Keep to 3–6 bullets. Use only data present in the résumé JSON. Omit unknowns.",
    };

    const prompt =
      prompts[section] ||
      'Give a concise overview of Corey for a hiring manager. Use short bullets and only facts from the résumé JSON.';

    showTypingIndicator();
    generateGeminiResponse(prompt);
  }

  function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);

    // Clear input
    chatInput.value = '';
    autoResizeTextarea();

    // Show typing indicator
    showTypingIndicator();

    // Generate AI response using Gemini (streamed)
    generateGeminiResponse(message);
  }

  async function generateGeminiResponse(question) {
    try {
      const API_KEY = 'AIzaSyDZdLgX_XQP6jaN7eCprfJx15GGt2nYD4k';
      const MODEL_ID = 'gemini-1.5-pro-latest';
      const MAX_HISTORY = 6;

      const { GoogleGenerativeAI } = await import(
        'https://esm.run/@google/generative-ai'
      );
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: MODEL_ID,
        systemInstruction:
          "You are 'Corey Portfolio Assistant' — a concise, persuasive advocate for Corey when speaking to hiring managers. Primary goal: demonstrate Corey's fit and value for the user's needs. Speak in third person about Corey (he/him). Use only factual details from the résumé JSON or prior messages; never invent facts. If the user shares a job description or role text, tailor the response to: (1) a 2–3 line fit summary, (2) requirement → Corey evidence mapping, (3) relevant achievements with outcomes/metrics, (4) tech/skills coverage, (5) suggested next steps/CTA. Focus on strengths and relevance; do not call out gaps or negatives unless the user asks directly. Keep a confident, warm, and succinct tone with no hedging or disclaimers. Prefer short sentences and scannable bullets. Include titles, companies, dates, scope, impact, and tech stack when relevant.",
      });

      const buildUserPrompt = (q) => {
        return `Context (résumé JSON):\n${JSON.stringify(
          resumeData,
          null,
          2
        )}\n\nUser message (may include a job description): ${q}\n\nInstructions:\n- Answer clearly in third person.\n- Use only facts from the context; never invent details.\n- Act as an advocate: emphasize Corey's fit and value for the user's needs.\n- If the message includes a job description or role text, structure the answer as:\n  1) Fit overview (2–3 lines).\n  2) Requirement → Corey evidence mapping (bullets).\n  3) Relevant achievements with outcomes/metrics.\n  4) Tech/skills coverage relevant to the role.\n  5) Suggested next steps/CTA (e.g., share demo, references, 30/60/90).\n- Focus on strengths; do not volunteer gaps or negatives unless directly asked.\n- If a direct, specific detail is missing, say briefly it's not in the résumé and, when helpful, add closely related known facts.\n- Otherwise, omit unknown details instead of calling them out.\n- Prefer concise bullets.`;
      };

      const userPrompt = buildUserPrompt(question);
      const trimmedHistory = history.slice(-MAX_HISTORY);
      const contents = [
        ...trimmedHistory.map((h) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: userPrompt }] },
      ];
      // Stream the response to the UI for nicer UX and Markdown support
      const stream = await model.generateContentStream({
        contents,
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

      hideTypingIndicator();
      const aiDiv = addMessage('ai', '');
      const contentEl = aiDiv.querySelector('.message-content');
      let buffer = '';
      for await (const chunk of stream.stream) {
        const t = chunk?.text?.() || '';
        if (!t) continue;
        buffer += t;
        contentEl.innerHTML = markdownToHtml(buffer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      const final = await stream.response;
      let answer = final?.text?.() || buffer || '';
      let truncated = false;
      try {
        const cand = final?.candidates?.[0];
        const fr = cand?.finishReason || cand?.finish_reason;
        if (fr && String(fr).toUpperCase().includes('MAX')) truncated = true;
      } catch {}
      answer = (answer || 'No answer produced.').trim();

      // Auto-continue streaming if truncated
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
        const contStream = await model.generateContentStream({
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
          contentEl.innerHTML = markdownToHtml(answer);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        const contFinal = await contStream.response;
        let fr2 = '';
        try {
          const cand2 = contFinal?.candidates?.[0];
          fr2 = cand2?.finishReason || cand2?.finish_reason || '';
        } catch {}
        truncated = !!fr2 && String(fr2).toUpperCase().includes('MAX');
      }

      contentEl.innerHTML = markdownToHtml(answer);
      history.push({ role: 'user', text: question });
      history.push({ role: 'model', text: answer });
    } catch (err) {
      console.error('Gemini API error:', err);
      hideTypingIndicator();
      addMessage(
        'ai',
        'Sorry, there was an error generating a response. Please try again.'
      );
    }
  }

  function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const content = document.createElement('div');
    content.className = 'message-content';
    if (sender === 'ai') {
      content.innerHTML = markdownToHtml(text || '');
    } else {
      content.textContent = text;
    }

    messageDiv.appendChild(content);

    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage && sender === 'user') {
      welcomeMessage.remove();
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
  }

  function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai typing-message';
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTypingIndicator() {
    const typingMessage = chatMessages.querySelector('.typing-message');
    if (typingMessage) {
      typingMessage.remove();
    }
  }

  // Populate right profile panel from resume data
  function hydrateProfilePanel(data) {
    try {
      const p = data?.persona || {};
      const contact = p.contact || {};
      // Basic text
      const nameEl = document.querySelector('.profile-header .name');
      const roleEl = document.querySelector('.profile-header .role');
      const headlineEl = document.querySelector('.profile-header .headline');
      if (nameEl && p.full_name) nameEl.textContent = p.full_name;
      if (roleEl) roleEl.textContent = 'Technologist + Marketer';
      if (headlineEl && p.headline) headlineEl.textContent = p.headline;

      // Contact links
      const emailEl = document.getElementById('profile-email');
      const phoneEl = document.getElementById('profile-phone');
      const liEl = document.getElementById('profile-linkedin');
      const ghEl = document.getElementById('profile-github');
      const locEl = document.getElementById('profile-location');
      if (emailEl && contact.email) {
        emailEl.textContent = contact.email;
        emailEl.href = `mailto:${contact.email}`;
      }
      if (phoneEl && contact.phone) {
        const tel = contact.phone.replace(/[^\d+]/g, '');
        phoneEl.textContent = contact.phone;
        phoneEl.href = `tel:${tel}`;
      }
      if (liEl && contact.linkedin) {
        const href = contact.linkedin.startsWith('http')
          ? contact.linkedin
          : `https://${contact.linkedin}`;
        liEl.textContent = 'LinkedIn';
        liEl.href = href;
      }
      if (ghEl && contact.github) {
        const href = contact.github.startsWith('http')
          ? contact.github
          : `https://${contact.github}`;
        ghEl.textContent = 'GitHub';
        ghEl.href = href;
      }
      if (locEl && p.current_city) {
        locEl.textContent = p.current_city;
      }

      // Top skills (pick a few representative from skills.front_end + design_ux + ai_automation)
      const tagList = document.getElementById('profile-skills');
      if (tagList && data.skills) {
        const picks = [
          ...(data.skills.front_end || []).slice(0, 3),
          ...(data.skills.design_ux || []).slice(0, 2),
          ...(data.skills.ai_automation || []).slice(0, 2),
        ].filter(Boolean);
        tagList.innerHTML = '';
        picks.forEach((s) => {
          const li = document.createElement('li');
          li.textContent = s;
          tagList.appendChild(li);
        });
      }
    } catch (err) {
      console.error('Failed to hydrate profile panel:', err);
    }
  }

  function getContextualResponse(section) {
    const contextMessages = {
      about:
        "I'd be happy to tell you about Corey's background and experience. What would you like to know?",
      projects:
        "Let me share information about Corey's projects. Which project interests you most?",
      expertise:
        "I can explain Corey's technical skills and areas of expertise. What specific technology or skill would you like to learn about?",
      contact:
        "I can provide Corey's contact information and how to reach out to him. How can I help you connect?",
    };

    return (
      contextMessages[section] || 'How can I help you learn more about Corey?'
    );
  }

  // Form submission
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendMessage();
  });

  // Clear chat functionality
  const clearButton = document.querySelector('.action-btn[title="Clear Chat"]');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      // Remove all messages except welcome
      const messages = chatMessages.querySelectorAll('.message');
      messages.forEach((message) => message.remove());

      // Re-add welcome message if needed
      if (!chatMessages.querySelector('.welcome-message')) {
        location.reload(); // Simple way to reset to initial state
      }
    });
  }
});

// --- Markdown rendering via snarkdown with basic sanitization ---
function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
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
  const lib = window.__snarkdown;
  if (!lib) return (md + '').replace(/</g, '&lt;');
  const html = lib(md);
  return sanitizeHtml(html);
}
