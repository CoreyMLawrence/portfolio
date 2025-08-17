// Chat Interface JavaScript with Gemini Integration
document.addEventListener('DOMContentLoaded', async () => {
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  // Suggestion chips live inside chat-messages and can be replaced; use event delegation
  chatMessages.addEventListener('click', (e) => {
    const chip = e.target.closest('.suggestion-chip');
    if (!chip || !chatMessages.contains(chip)) return;
    const text = chip.textContent;
    chatInput.value = text;
    autoResizeTextarea();
    handleSendMessage();
  });
  const navItems = document.querySelectorAll('.nav-item');
  const appContainer = document.querySelector('.app-container');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.querySelector('.sidebar');

  // Mobile sidebar toggle
  if (sidebarToggle && appContainer) {
    sidebarToggle.addEventListener('click', () => {
      appContainer.classList.toggle('menu-open');
    });
  }

  // Close the menu when clicking a nav item (mobile)
  navItems.forEach((item) =>
    item.addEventListener('click', () => {
      if (appContainer && appContainer.classList.contains('menu-open')) {
        appContainer.classList.remove('menu-open');
      }
    })
  );

  // Close when clicking outside the sidebar while open (mobile)
  document.addEventListener('click', (e) => {
    const open = appContainer && appContainer.classList.contains('menu-open');
    if (!open) return;
    const withinSidebar = sidebarEl && sidebarEl.contains(e.target);
    const isToggle = sidebarToggle && sidebarToggle.contains(e.target);
    if (!withinSidebar && !isToggle) {
      appContainer.classList.remove('menu-open');
    }
  });

  // Chat integration (migrated to /chat)
  let resumeData = null;
  let history = [];
  // Project cards manager
  let projectCardsManager = null;
  // Markdown renderer holder (set on window for global access)
  let snarkdown = null;

  // Initialize project cards manager
  if (window.ProjectCardsManager) {
    projectCardsManager = new window.ProjectCardsManager();
  }

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

  // No direct binds needed; delegation above covers all current/future chips

  // Handle navigation
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all items
      navItems.forEach((nav) => nav.classList.remove('active'));

      // Add active class to clicked item
      item.classList.add('active');

      // Update chat context based on selection and show the tab label as a user message
      const section = item.dataset.section;
      const label = (
        item.querySelector('span')?.textContent ||
        item.textContent ||
        section ||
        ''
      ).trim();
      updateChatContext(section, label);
    });
  });

  function updateChatContext(section, label) {
    // Generate a concise section summary using Gemini and résumé context
    const prompts = {
      about:
        "Provide a concise 'About Corey' summary for hiring managers. Emphasize strengths and how Corey adds value. Focus on roles, years of experience, domains, leadership, and impact. Include 4–7 short bullets. Third person. Use only facts from the résumé JSON. Omit unknowns.",
      experience:
        "Summarize Corey's professional experience timeline for recruiters. List roles in reverse chronological order with title, company, dates (start–end), and a 1–2 line impact statement. Highlight leadership, ownership, and measurable outcomes when present. Use 4–7 concise bullets. Facts only from the résumé JSON; omit unknowns. Utilize markdown formatting and focus on fantastic readability for this section.",
      projects:
        "Summarize Corey's flagship projects. Emphasize outcomes and relevance to typical hiring needs. Include project names, timeline, goals, outcomes/metrics, and tech stack. Use 4–8 bullets, grouped if helpful. Third person. Facts only from the résumé JSON. Omit unknowns.",
      expertise:
        "Summarize Corey's technical skills and expertise, highlighting strengths that matter to hiring managers. Group by categories (Product, Frontend, Backend, Cloud/DevOps, Data/AI, Tools). Note proficiency or depth when available and top tools. 5–10 bullets, concise. Third person. Facts only from the résumé JSON. Omit unknowns.",
      education:
        "Summarize Corey's education. Include degree, major, institution, location, and timing exactly as provided in the résumé JSON. Keep it to 2–4 bullets. Do not infer GPA or honors.",
      achievements:
        "List Corey's notable achievements and impact highlights relevant to hiring managers. Focus on measurable outcomes, rebuilds, launches, CI/CD, SEO/page speed gains, accessibility, or automation. Derive only from the résumé JSON (career.key_responsibilities, summaries). Use 4–7 crisp bullets.",
      contact:
        "Provide Corey's contact and availability for a hiring manager. Include only fields present in the résumé JSON: email, LinkedIn, portfolio URL, location, time zone, and preferred contact. Use 3–6 concise bullets. Link formatting rules:\n- Use Markdown links.\n- Email: display the address (e.g., c@example.com); link as mailto:c@example.com. Do not show the word 'mailto'.\n- Web links: display a clean label without protocol, without 'www.', and without a trailing slash (e.g., coreylawrence.me or linkedin.com/in/handle); the href must be the full HTTPS URL from the résumé JSON.\n- Do not invent or guess missing fields; omit anything not in the résumé JSON.\n- Do not show raw URLs; always use Markdown link text with the correct href.\n- Treat links as external by ensuring hrefs begin with https:// (except for mailto).",
    };

    const prompt =
      prompts[section] ||
      'Give a concise overview of Corey for a hiring manager. Use short bullets and only facts from the résumé JSON.';

    // Post the tab title as the user's message for context/reference
    const sectionLabelMap = {
      about: 'About',
      experience: 'Experience',
      projects: 'Projects',
      expertise: 'Expertise',
      education: 'Education',
      achievements: 'Achievements',
      contact: 'Contact',
    };
    const display = (label || sectionLabelMap[section] || 'About').trim();
    if (display) addMessage('user', display);

    showTypingIndicator();
    // Generate response with internal prompt but store only the display text in history
    generateGeminiResponse(prompt, display);
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

  async function generateGeminiResponse(question, userDisplayText = null) {
    try {
      const API_KEY = 'AIzaSyDZdLgX_XQP6jaN7eCprfJx15GGt2nYD4k';
      const MODEL_ID = 'gemini-2.0-flash';
      const MAX_HISTORY = 6;

      const { GoogleGenerativeAI } = await import(
        'https://esm.run/@google/generative-ai'
      );
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: MODEL_ID,
        systemInstruction: getSystemInstruction(),
      });

      const buildUserPrompt = (q) => {
        let historyContext = '';
        if (history.length > 0) {
          historyContext =
            '\n\nPrevious messages (for context):\n' +
            history
              .slice(-MAX_HISTORY)
              .map(
                (h, i) =>
                  `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`
              )
              .join('\n') +
            '\n\n--- Current message below ---\n';
        }

        return `Context (résumé JSON):\n${JSON.stringify(
          resumeData,
          null,
          2
        )}${historyContext}\n\nCurrent user message (may include a job description): ${q}\n\nInstructions:\n- Answer clearly in third person.\n- Use only facts from the context; never invent details.\n- Act as an advocate: emphasize Corey's fit and value for the user's needs as long as it makes logical sense.\n- If the message includes a job description or role text, structure the answer as:\n  1) Fit overview (2–3 lines).\n  2) Requirement → Corey evidence mapping (bullets).\n  3) Relevant achievements with outcomes/metrics.\n  4) Tech/skills coverage relevant to the role.\n  5) Suggested next steps/CTA (e.g., share demo, references).\n- Focus on strengths; do not volunteer gaps or negatives unless directly asked.\n- If a direct, specific detail is missing, say briefly it's not in the résumé and, when helpful, add closely related known facts.\n- Otherwise, omit unknown details instead of calling them out.\n- Prefer concise bullets.\n- Write the response so it’s optimized for skim reading and ADHD-friendly. Use short paragraphs, clear headings, bullet points, and bold key phrases. Keep sentences concise, avoid unnecessary filler, and make the structure easy to scan quickly.\n-Present information in small, digestible chunks with visual hierarchy. Avoid long blocks of text. Use plain language, and highlight the most important points so they stand out at a glance.`;
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

      // Per-message auto-scroll with user-cancel behavior (only on manual input)
      let shouldAutoScroll = true;
      const nearBottom = () =>
        chatMessages.scrollHeight -
          chatMessages.scrollTop -
          chatMessages.clientHeight <=
        8;
      // Smooth auto-scroll animation (slower than default)
      const scroller = (() => {
        let raf = 0;
        let active = false;
        const isDesktopWidth = () =>
          (window.innerWidth || document.documentElement.clientWidth || 1080) >=
          1024;
        // Compute easing factor based on viewport width.
        // Wider screens scroll slower; 1080px is the slowest.
        // Clamp between [minW, maxW] for stability.
        function getScrollEaseFactor() {
          const w =
            window.innerWidth || document.documentElement.clientWidth || 1080;
          const minW = 320; // narrowest phones
          const maxW = 1080; // desktop baseline (slowest)
          const slowFactor = 0.85; // works well on 1080px (slowest)
          const fastFactor = 0.9; // faster on mobile; keep < 0.5 to avoid overshoot
          if (w >= maxW) return slowFactor;
          if (w <= minW) return fastFactor;
          const t = (maxW - w) / (maxW - minW); // 0 at 1080 -> 1 at 320
          return slowFactor + t * (fastFactor - slowFactor);
        }
        const step = () => {
          if (!active) return;
          const target = chatMessages.scrollHeight - chatMessages.clientHeight;
          const diff = target - chatMessages.scrollTop;
          // Stop when close enough
          if (Math.abs(diff) < 1) {
            chatMessages.scrollTop = target;
            active = false;
            raf = 0;
            return;
          }
          // Ease toward target; factor scales with screen width.
          chatMessages.scrollTop += diff * getScrollEaseFactor();
          raf = requestAnimationFrame(step);
        };
        return {
          start() {
            // Disable smooth animation on mobile/tablet; snap instead
            if (!isDesktopWidth()) {
              const target =
                chatMessages.scrollHeight - chatMessages.clientHeight;
              chatMessages.scrollTop = target;
              return;
            }
            if (!active) {
              active = true;
              step();
            }
          },
          cancel() {
            active = false;
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
          },
          isActive() {
            return active;
          },
        };
      })();
      const cancelIfUserMoves = () => {
        if (!nearBottom()) {
          shouldAutoScroll = false;
          // Also cancel any in-flight smooth scrolling
          scroller.cancel();
        }
      };
      // Listen to manual interactions only
      chatMessages.addEventListener('wheel', cancelIfUserMoves, {
        passive: true,
      });
      chatMessages.addEventListener('touchmove', cancelIfUserMoves, {
        passive: true,
      });
      chatMessages.addEventListener('touchstart', cancelIfUserMoves, {
        passive: true,
      });
      try {
        for await (const chunk of stream.stream) {
          const t = chunk?.text?.() || '';
          if (!t) continue;
          buffer += t;
          // While streaming, render but suppress any trailing tokens
          let visibleText;
          if (projectCardsManager) {
            const result = projectCardsManager.processProjectTokens(buffer);
            visibleText = stripHiddenActionForPDF(
              result.visibleText
            ).visibleText;
          } else {
            visibleText = stripHiddenAction(buffer).visibleText;
          }
          contentEl.innerHTML = markdownToHtml(visibleText);
          // Update data-markdown attribute with the raw markdown
          aiDiv.setAttribute('data-markdown', visibleText);
          if (shouldAutoScroll) {
            scroller.start();
          } else {
            scroller.cancel();
          }
        }
      } finally {
        // Stop any ongoing smooth scroll between phases
        scroller.cancel();
        chatMessages.removeEventListener('wheel', cancelIfUserMoves);
        chatMessages.removeEventListener('touchmove', cancelIfUserMoves);
        chatMessages.removeEventListener('touchstart', cancelIfUserMoves);
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

      // Auto-continue streaming if truncated (preserve per-message cancel state)
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

        // Re-attach manual input listeners during continuation
        shouldAutoScroll = shouldAutoScroll && nearBottom();
        chatMessages.addEventListener('wheel', cancelIfUserMoves, {
          passive: true,
        });
        chatMessages.addEventListener('touchmove', cancelIfUserMoves, {
          passive: true,
        });
        chatMessages.addEventListener('touchstart', cancelIfUserMoves, {
          passive: true,
        });
        try {
          for await (const chunk of contStream.stream) {
            const t = chunk?.text?.() || '';
            if (!t) continue;
            answer += t;
            contentEl.innerHTML = markdownToHtml(answer);
            // Update data-markdown attribute with the raw markdown
            aiDiv.setAttribute('data-markdown', answer);
            if (shouldAutoScroll) {
              scroller.start();
            } else {
              scroller.cancel();
            }
          }
        } finally {
          // Ensure smooth scrolling stops after this phase as well
          scroller.cancel();
          chatMessages.removeEventListener('wheel', cancelIfUserMoves);
          chatMessages.removeEventListener('touchmove', cancelIfUserMoves);
          chatMessages.removeEventListener('touchstart', cancelIfUserMoves);
        }
        const contFinal = await contStream.response;
        let fr2 = '';
        try {
          const cand2 = contFinal?.candidates?.[0];
          fr2 = cand2?.finishReason || cand2?.finish_reason || '';
        } catch {}
        truncated = !!fr2 && String(fr2).toUpperCase().includes('MAX');
      }

      // Detect and handle hidden actions; remove tokens from display
      let visibleText, actions, actionData;

      if (projectCardsManager) {
        // Use the new project cards manager for processing
        const result = projectCardsManager.processProjectTokens(answer);
        visibleText = result.visibleText;
        actions = result.actions;
        actionData = result.actionData;

        // Also check for PDF export action
        const pdfResult = stripHiddenActionForPDF(visibleText);
        visibleText = pdfResult.visibleText;
        if (pdfResult.actions.includes('EXPORT_PDF')) {
          actions.push('EXPORT_PDF');
        }
      } else {
        // Fallback to old method
        const result = stripHiddenAction(answer);
        visibleText = result.visibleText;
        actions = result.actions;
        actionData = result.actionData;
      }

      contentEl.innerHTML = markdownToHtml(visibleText);

      // Handle project cards injection using the new manager
      if (
        projectCardsManager &&
        (actions.includes('SHOW_PROJECTS') || actions.includes('SHOW_PROJECT'))
      ) {
        projectCardsManager.injectProjectCards(
          contentEl,
          visibleText,
          actions,
          actionData
        );
      }

      // Update data-markdown attribute with the final raw markdown
      aiDiv.setAttribute('data-markdown', visibleText);
      // If model requested a PDF export, trigger it without showing the token
      if (actions.includes('EXPORT_PDF') && window.ChatExport?.exportChat) {
        try {
          // Defer slightly to let the final message render first
          setTimeout(() => window.ChatExport.exportChat(), 500);
        } catch (e) {
          console.warn('Failed to trigger PDF export from hidden action:', e);
        }
      }
      // Final snap to bottom if user hasn't taken over scrolling
      if (shouldAutoScroll) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      // Use the display text for history storage (simple button text) instead of internal prompt
      const textToStore = userDisplayText || question;
      history.push({ role: 'user', text: textToStore });
      // Persist only the visible text (without hidden tokens)
      history.push({ role: 'model', text: visibleText });

      // Note: Session cache automatically saves markdown via data-markdown attributes
    } catch (err) {
      console.error('Gemini API error:', err);
      hideTypingIndicator();
      addMessage(
        'ai',
        'Sorry, there was an error generating a response. Please try again.'
      );
    }
  }

  // Generate system instruction based on current session state
  function getSystemInstruction() {
    const baseInstruction =
      "You are 'Corey Portfolio Assistant' — a concise, persuasive advocate for Corey when speaking to hiring managers. Primary goal: demonstrate Corey's fit and value for the user's needs. Speak in third person about Corey (he/him). Use only factual details from the résumé JSON or prior messages; never invent facts. If the user shares a job description or role text, tailor the response to: (1) a 2–3 line fit summary, (2) requirement → Corey evidence mapping, (3) relevant achievements with outcomes/metrics, (4) tech/skills coverage, (5) suggested next steps/CTA. Focus on strengths and relevance; do not call out gaps or negatives unless the user asks directly. Keep a confident, warm, and succinct tone with no hedging or disclaimers. Prefer short sentences and scannable bullets. Include titles, companies, dates, scope, impact, and tech stack when relevant.";

    const pdfProtocol =
      'Hidden action protocol: When the user explicitly asks to download or export the current message as a PDF, append the hidden control token [[ACTION:EXPORT_PDF]] at the very end of your response on its own line.';

    // Get project instructions from the manager
    const projectInstructions = projectCardsManager
      ? projectCardsManager.getProjectInstructions()
      : '';

    const tokenClosing =
      ' Do not mention or explain these tokens. The tokens must be plain text and are not part of the visible answer.';

    return (
      baseInstruction +
      '\n\n' +
      pdfProtocol +
      projectInstructions +
      tokenClosing
    );
  }

  // PDF-only action parser (for use with new project manager)
  function stripHiddenActionForPDF(text) {
    const actions = [];
    if (!text) return { visibleText: '', actions };
    let out = String(text);
    // Only look for PDF export action at the end
    const actionRe = /\n?\s*\[\[ACTION:EXPORT_PDF\]\]\s*$/;
    if (actionRe.test(out)) {
      actions.push('EXPORT_PDF');
      out = out.replace(actionRe, '');
    }
    return { visibleText: out.trimEnd(), actions };
  }

  // Legacy action parser (fallback)
  function stripHiddenAction(text) {
    const actions = [];
    const actionData = {};
    if (!text) return { visibleText: '', actions, actionData };
    let out = String(text);
    // Support multiple actions stacked at the end, each on its own line
    // Only match at the end of the string to avoid accidental capture in code blocks
    // Updated regex to capture action parameters (e.g., project names)
    const actionRe = /\n?\s*\[\[ACTION:([A-Z_]+)(?::([^\]]+))?\]\]\s*$/;
    let m;
    let guard = 0;
    while ((m = out.match(actionRe)) && guard < 5) {
      guard++;
      const action = m[1];
      const param = m[2];
      if (action && !actions.includes(action)) {
        actions.push(action);
        if (param) {
          actionData[action] = param;
        }
      }
      out = out.replace(actionRe, '');
    }
    return { visibleText: out.trimEnd(), actions, actionData };
  }

  function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const content = document.createElement('div');
    content.className = 'message-content';
    if (sender === 'ai') {
      content.innerHTML = markdownToHtml(text || '');
      // Store raw markdown in data attribute for PDF export
      messageDiv.setAttribute('data-markdown', text || '');
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
      const persona = data?.persona || {};
      // Support both shapes: data.persona.contact and data.contact
      const contact = (persona && persona.contact) || data?.contact || {};
      // Basic text
      const nameEl = document.querySelector('.profile-header .name');
      const roleEl = document.querySelector('.profile-header .role');
      const headlineEl = document.querySelector('.profile-header .headline');
      // Prefer persona.full_name, else top-level name
      if (nameEl && (persona.full_name || data?.name)) {
        nameEl.textContent = persona.full_name || data.name;
      }
      if (roleEl) roleEl.textContent = 'Technologist + Marketer';
      if (headlineEl && persona.headline)
        headlineEl.textContent = persona.headline;

      // Contact links (anchors include icon + inner span label)
      const emailEl = document.getElementById('profile-email');
      const phoneEl = document.getElementById('profile-phone');
      const liEl = document.getElementById('profile-linkedin');
      const ghEl = document.getElementById('profile-github');
      const locEl = document.getElementById('profile-location');
      if (emailEl && contact.email) {
        const label = emailEl.querySelector('span');
        if (label) label.textContent = contact.email;
        emailEl.href = `mailto:${contact.email}`;
      }
      // Phone link intentionally omitted in UI; guard remains harmless if present
      if (phoneEl && contact.phone) {
        const tel = contact.phone.replace(/[^\d+]/g, '');
        phoneEl.textContent = contact.phone;
        phoneEl.href = `tel:${tel}`;
      }
      if (liEl && contact.linkedin) {
        const href = contact.linkedin.startsWith('http')
          ? contact.linkedin
          : `https://${contact.linkedin}`;
        const label = liEl.querySelector('span');
        if (label) label.textContent = 'LinkedIn';
        liEl.href = href;
      }
      if (ghEl && contact.github) {
        const href = contact.github.startsWith('http')
          ? contact.github
          : `https://${contact.github}`;
        const label = ghEl.querySelector('span');
        if (label) label.textContent = 'GitHub';
        ghEl.href = href;
      }
      if (locEl && persona.current_city) {
        locEl.textContent = persona.current_city;
      }

      // Top skills: pick up to 5 broad, widely appealing skills from skills_overview
      const tagList = document.getElementById('profile-skills');
      const so = data?.skills_overview || {};
      if (tagList) {
        const maxTags = 4;
        const minTags = 2;
        const all = [
          ...(so.web_development || []),
          ...(so.marketing || []),
          ...(so.cms_platforms || []),
          ...(so.design_tools || []),
          ...(so.soft_skills || []),
        ];
        const have = new Set(all);
        // Preference order for broad appeal; will only include those present
        const prefs = [];
        const picks = [];
        for (const p of prefs) {
          if (have.has(p)) picks.push(p);
          if (picks.length >= maxTags) break;
        }
        // Fallback: ensure at least 4 by taking from web_development
        if (picks.length < minTags && Array.isArray(so.web_development)) {
          for (const s of so.web_development) {
            if (!picks.includes(s)) picks.push(s);
            if (picks.length >= maxTags) break;
          }
        }
        tagList.innerHTML = '';
        picks.slice(0, maxTags).forEach((s) => {
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

  // Delete chat confirmation functionality
  const deleteButton = document.getElementById('delete-chat-btn');
  let deleteTimeout = null;
  let isConfirming = false;

  if (deleteButton) {
    deleteButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isConfirming) {
        // First click - show confirmation
        showDeleteConfirmation();
      } else {
        // Second click - execute deletion
        executeDelete();
      }
    });

    // Hide confirmation when clicking outside
    document.addEventListener('click', (e) => {
      if (isConfirming && !deleteButton.contains(e.target)) {
        hideDeleteConfirmation();
      }
    });
  }

  function showDeleteConfirmation() {
    if (isConfirming) return;

    isConfirming = true;
    deleteButton.classList.add('confirming');

    // Auto-hide after 3 seconds
    deleteTimeout = setTimeout(() => {
      hideDeleteConfirmation();
    }, 3000);
  }

  function hideDeleteConfirmation() {
    if (!isConfirming) return;

    isConfirming = false;
    deleteButton.classList.remove('confirming');

    if (deleteTimeout) {
      clearTimeout(deleteTimeout);
      deleteTimeout = null;
    }
  }

  function executeDelete() {
    if (!isConfirming) return;

    // Visual feedback - brief deletion state
    deleteButton.classList.add('deleting');

    setTimeout(() => {
      // Remove all messages except welcome
      const messages = chatMessages.querySelectorAll('.message');
      messages.forEach((message) => message.remove());

      // Re-add welcome message if needed
      if (!chatMessages.querySelector('.welcome-message')) {
        // Recreate minimal welcome without reloading (session-cache clears itself on click)
        const wrap = document.createElement('div');
        wrap.className = 'welcome-message';
        wrap.innerHTML = `
          <h3>Ask me anything about Corey</h3>
          <p>I have access to his complete resume and can provide detailed information about his experience, projects, and skills.</p>
          <div class="suggestion-chips">
            <button class="suggestion-chip">Tell me about Corey's projects</button>
            <button class="suggestion-chip">What technologies does Corey use?</button>
            <button class="suggestion-chip">What is Corey's background?</button>
            <button class="suggestion-chip">Show me his best work</button>
          </div>`;
        chatMessages.appendChild(wrap);

        // Ensure welcome elements are visible when recreated (no animation needed)
        const welcomeP = wrap.querySelector('p');
        const suggestionChips = wrap.querySelector('.suggestion-chips');
        if (window.gsap) {
          gsap.set([welcomeP, suggestionChips], {
            opacity: 1,
            y: 0,
            pointerEvents: 'auto',
          });
        } else {
          // Fallback if GSAP isn't available
          if (welcomeP) {
            welcomeP.style.opacity = '1';
            welcomeP.style.transform = 'translateY(0)';
          }
          if (suggestionChips) {
            suggestionChips.style.opacity = '1';
            suggestionChips.style.transform = 'translateY(0)';
            suggestionChips.style.pointerEvents = 'auto';
          }
        }

        chatMessages.scrollTop = 0;
        // Reset in-memory history
        history = [];
        // Reset project cards manager
        if (projectCardsManager) {
          projectCardsManager.reset();
        }
        // Note: Session cache clears automatically when clear button is clicked
        // Delegated listener covers newly created chips automatically
      }

      // Reset button state
      deleteButton.classList.remove('deleting');
      hideDeleteConfirmation();
    }, 200);
  }

  // Download PDF functionality moved to export-pdf.js
  // PDF export now uses session cache directly as single source of truth

  // Hydrate in-memory history when session-cache restores a previous session
  document.addEventListener('chat:session-restored', (e) => {
    const restored = Array.isArray(e?.detail?.history) ? e.detail.history : [];
    if (restored.length) {
      // Use the restored history for basic chat functionality
      history = restored.map((item) => ({ role: item.role, text: item.text }));

      // Remove welcome message if present, since we have history
      const welcome = chatMessages.querySelector('.welcome-message');
      if (welcome) welcome.remove();
      // Ensure scroll is at bottom after hydration
      chatMessages.scrollTop = chatMessages.scrollHeight;

      console.log('Session restored with history:', history.length, 'messages');
      console.log('PDF export will use session cache directly');
    }
    // Delegated listener covers chips after restore as well
  });
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
  // Ensure chat links open safely in a new tab
  div.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const isSafe = /^(https?:|mailto:|tel:|#|\/)/i.test(href);
    if (!isSafe) a.setAttribute('href', '#');
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
  return div.innerHTML;
}

// Normalize Markdown to improve list rendering in simple parsers like snarkdown
// - Ensures a blank line before list blocks
// - Normalizes excessive spaces after list markers
// - Converts common unicode bullets to standard dashes
function normalizeMarkdown(md) {
  if (!md) return '';
  let s = String(md).replace(/\r\n?/g, '\n');
  // Normalize tabs to two spaces to avoid unpredictable indent width
  s = s.replace(/\t/g, '  ');

  // Insert a blank line before the first list item when it follows a non-list line.
  // Avoid adding blank lines between adjacent list items.
  s = s.replace(
    /^(?![ \t]*(?:[*+-]|\d+[.)])\s)(.*\S.*)\n(?=^[ \t]*(?:[*+-]|\d+[.)])\s)/gm,
    '$1\n\n'
  );

  // Normalize multiple spaces after bullet/number to a single space
  s = s.replace(/^([ \t]*[*+-])\s{2,}/gm, '$1 ');
  s = s.replace(/^([ \t]*\d+[.)])\s{2,}/gm, '$1 ');

  // Convert unicode bullets to dashes
  s = s.replace(/^\s*[•▪◦]\s+/gm, '- ');

  // Normalize nested list indentation: reduce 3+ leading spaces before a bullet/number to 2 spaces
  // This helps simple parsers treat them as nested lists rather than code blocks
  s = s.replace(/^([ \t]{3,})([*+-]|\d+[.)])\s+/gm, '  $2 ');
  s = s.replace(/\n[ \t]{3,}([*+-]|\d+[.)])\s+/g, '\n  $1 ');

  // Collapse extra blank lines (including whitespace-only lines) between adjacent list items
  // Example: "* item A\n\n* item B" -> "* item A\n* item B"
  s = s.replace(
    /(^[ \t]*(?:[*+-]|\d+[.)])\s+.+)\n(?:[ \t]*\n)+(?=^[ \t]*(?:[*+-]|\d+[.)])\s)/gm,
    '$1\n'
  );

  return s;
}

function markdownToHtml(md) {
  if (!md) return '';
  const lib = window.__snarkdown;
  if (!lib) return (md + '').replace(/</g, '&lt;');
  const html = lib(normalizeMarkdown(md));
  return sanitizeHtml(html);
}
