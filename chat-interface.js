// Chat Interface JavaScript with Gemini Integration
document.addEventListener('DOMContentLoaded', async () => {
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  const navItems = document.querySelectorAll('.nav-item');

  // Use the Gemini integration from personal-chat/gemini-chat.js
  let resumeData = null;
  let history = [];

  // Load resume data
  try {
    const res = await fetch('chat/resume.json');
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
    // Build a targeted prompt per section and stream a concise summary via Gemini
    const prompts = {
      about:
  "Provide a concise 'About Corey' summary for hiring managers. Focus on roles, years of experience, domains, leadership, and impact. Include 4–7 short bullets. Third person. Use only facts from the résumé JSON. Do not mention unknowns; simply omit any details that aren't present.",
      projects:
  "Summarize Corey's flagship projects. Include project names, timeline, goals, outcomes/metrics, and tech stack. Use 4–8 bullets, grouped if helpful. Third person. Facts only from the résumé JSON. Do not mention unknowns; simply omit any details that aren't present.",
      expertise:
  "Summarize Corey's technical skills and expertise. Group by categories (Product, Frontend, Backend, Cloud/DevOps, Data/AI, Tools). Note proficiency or depth when available and top tools. 5–10 bullets, concise. Third person. Facts only from the résumé JSON. Do not mention unknowns; simply omit any details that aren't present.",
      contact:
  "Provide Corey's contact and availability details suitable for a hiring manager. Include email, LinkedIn, portfolio URL, location, time zone, and preferred contact. Keep to 3–6 bullets. Use only data present in the résumé JSON. Do not mention unknowns; simply omit any details that aren't present.",
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
          "You are 'Corey Portfolio Assistant' — a concise, professional guide for hiring managers. Speak in third person about Corey (he/him). Use only factual details from the résumé JSON or prior messages; never invent facts. If the user asks a direct, specific question for information that isn't in the context, say briefly that it isn't available in the résumé and, when helpful, pivot to related known facts. Otherwise, do not mention unknowns—simply omit details you cannot verify. Keep a confident, warm, and succinct tone with no hedging or disclaimers. Prefer short sentences and scannable bullets. Include titles, companies, dates, scope, impact, and tech stack when relevant.",
      });

      const buildUserPrompt = (q) => {
        return `Context (résumé JSON):\n${JSON.stringify(
          resumeData,
          null,
          2
        )}\n\nUser question: ${q}\n\nInstructions:\n- Answer clearly in third person.\n- Use only facts from the context; never invent details.\n- If the question asks for a specific detail that is missing, reply briefly that it isn't available in the résumé and, when helpful, add closely related known facts.\n- Otherwise, omit unknown details instead of calling them out.\n- Prefer concise bullets.`;
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
          maxOutputTokens: 500,
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
      answer = (answer || 'No answer produced.').trim();
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

// --- Minimal Markdown renderer (safe, bullet-friendly) ---
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function markdownToHtml(md) {
  if (!md) return '';
  const safe = escapeHtml(md);
  const lines = safe.split(/\r?\n/);
  const out = [];
  let inList = false;
  for (const line of lines) {
    const liMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (liMatch) {
      if (!inList) {
        inList = true;
        out.push('<ul>');
      }
      out.push(`<li>${liMatch[1]}</li>`);
      continue;
    }
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (line.trim() === '') {
      out.push('');
    } else {
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(
          /\[(.+?)\]\((https?:[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        );
      out.push(`<p>${formatted}</p>`);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}
