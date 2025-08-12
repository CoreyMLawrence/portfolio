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
    const contextMessage = getContextualResponse(section);
    if (contextMessage) {
      addMessage('ai', contextMessage);
    }
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
          "You are 'Corey Portfolio Assistant' — a concise, professional guide for hiring managers. Speak in third person about Corey (he/him). Use only factual details from the provided resume JSON or prior messages. If information is missing, say it's not available. Prefer short sentences and scannable bullets. Include titles, companies, dates, scope, impact, and tech stack when relevant.",
      });

      const buildUserPrompt = (q) => {
        return `Context (résumé JSON):\n${JSON.stringify(
          resumeData,
          null,
          2
        )}\n\nUser question: ${q}\n\nAnswer clearly, in third person, using only facts from the context (say if unknown). Prefer concise bullets.`;
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
