/**
 * Chat PDF Export (Vector) - Uses jsPDF only, no html2canvas
 * Required library:
 * - jsPDF UMD (https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)
 * 
 * Enhanced with markdown support for AI messages
 */

(function () {
  // Track if export is in progress to prevent multiple simultaneous exports
  let exportInProgress = false;
  let librariesLoaded = false;

  // Status flags for reachability and source selection
  const status = {
    jspdf: { loaded: false, source: null, url: null, error: null },
    cdn: { tested: false, reachable: null, lastUrl: null, error: null },
  };

  // Load required library dynamically (jsPDF only)
  async function loadLibraries(options = {}) {
    const { preferCdn = false, reload = false } = options || {};
    if (librariesLoaded && !reload) return true;

    try {
      // Check if library is already loaded when not reloading
      if (!reload) {
        if (typeof jspdf !== 'undefined') {
          librariesLoaded = true;
          status.jspdf.loaded = true;
          status.jspdf.source = status.jspdf.source || 'preloaded';
          return true;
        }
      }

      // Function to load a script
      const loadScript = (src) =>
        new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load: ${src}`));
          document.head.appendChild(script);
        });

      // Prefer vendored UMD bundle in repo; fallback to local node_modules, then CDN
      const vendorCandidates = ['./vendor/jspdf.umd.min.js'];
      const base = './node_modules'; // relative to /chat
      const localCandidates = [`${base}/jspdf/dist/jspdf.umd.min.js`];
      const cdnCandidates = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      ];

      async function tryLoadFrom(urls, sourceLabel) {
        const toLoad = urls.filter(
          (src) => !document.querySelector(`script[src="${src}"]`)
        );
        if (toLoad.length) {
          await Promise.all(toLoad.map((u) => loadScript(u)));
        }
        if (typeof jspdf !== 'undefined') {
          status.jspdf.loaded = true;
          status.jspdf.source = sourceLabel;
          status.jspdf.url = urls.find((u) => /jspdf/i.test(u)) || null;
        }
      }

      // Loading strategy
      const order = preferCdn
        ? [cdnCandidates, vendorCandidates, localCandidates]
        : [vendorCandidates, localCandidates, cdnCandidates];
      let loadedFrom = null;
      let lastErr = null;

      for (const urls of order) {
        const label =
          urls === cdnCandidates
            ? 'cdn'
            : urls === localCandidates
            ? 'local'
            : 'vendor';
        try {
          await tryLoadFrom(urls, label);
          if (typeof jspdf !== 'undefined') {
            loadedFrom = label;
            break;
          }
        } catch (err) {
          lastErr = err;
          if (label === 'cdn') status.cdn.error = status.cdn.error || err;
        }
      }

      if (!loadedFrom)
        throw lastErr || new Error('No library source succeeded');

      if (typeof jspdf === 'undefined') {
        throw new Error('jsPDF not available after loading');
      }

      librariesLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load PDF library:', error);
      status.jspdf.error = status.jspdf.error || error;
      return false;
    }
  }

  // Markdown parsing utilities for PDF export
  function parseMarkdownForPdf(markdown) {
    if (!markdown) return [];
    
    const lines = markdown.split('\n');
    const elements = [];
    let currentList = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Empty line - close current list if any
        if (currentList) {
          elements.push(currentList);
          currentList = null;
        }
        elements.push({ type: 'spacing', height: 2 });
        continue;
      }
      
      // Headers
      if (line.startsWith('### ')) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
        }
        elements.push({ type: 'header3', text: line.substring(4), style: 'bold', fontSize: 12 });
      } else if (line.startsWith('## ')) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
        }
        elements.push({ type: 'header2', text: line.substring(3), style: 'bold', fontSize: 13 });
      } else if (line.startsWith('# ')) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
        }
        elements.push({ type: 'header1', text: line.substring(2), style: 'bold', fontSize: 14 });
      }
      // Lists
      else if (line.match(/^[-*+]\s+/)) {
        const text = line.replace(/^[-*+]\s+/, '');
        if (!currentList) {
          currentList = { type: 'list', items: [] };
        }
        currentList.items.push({ text, level: 0 });
      } else if (line.match(/^\d+\.\s+/)) {
        const text = line.replace(/^\d+\.\s+/, '');
        if (!currentList) {
          currentList = { type: 'orderedList', items: [] };
        }
        currentList.items.push({ text, level: 0 });
      } else if (line.match(/^  [-*+]\s+/)) {
        const text = line.replace(/^  [-*+]\s+/, '');
        if (!currentList) {
          currentList = { type: 'list', items: [] };
        }
        currentList.items.push({ text, level: 1 });
      }
      // Bold text
      else if (line.includes('**')) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
        }
        elements.push({ type: 'paragraph', text: line, hasBold: true });
      }
      // Regular paragraph
      else {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
        }
        elements.push({ type: 'paragraph', text: line });
      }
    }
    
    // Close any remaining list
    if (currentList) {
      elements.push(currentList);
    }
    
    return elements;
  }

  function renderMarkdownText(doc, text, x, maxWidth, style = 'normal', fontSize = 11) {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    
    if (!text.includes('**')) {
      return doc.splitTextToSize(text, maxWidth);
    }
    
    // Handle bold text inline
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    const lines = [];
    let currentLine = '';
    let currentWidth = 0;
    
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        doc.setFont('helvetica', 'bold');
        const boldWidth = doc.getTextWidth(boldText);
        doc.setFont('helvetica', style);
        
        if (currentWidth + boldWidth > maxWidth && currentLine) {
          lines.push({ text: currentLine, hasBold: false });
          currentLine = boldText;
          currentWidth = boldWidth;
        } else {
          currentLine += boldText;
          currentWidth += boldWidth;
        }
      } else {
        const words = part.split(' ');
        for (const word of words) {
          if (!word) continue;
          const wordWidth = doc.getTextWidth(word + ' ');
          
          if (currentWidth + wordWidth > maxWidth && currentLine) {
            lines.push({ text: currentLine.trim(), hasBold: currentLine.includes('**') });
            currentLine = word + ' ';
            currentWidth = wordWidth;
          } else {
            currentLine += word + ' ';
            currentWidth += wordWidth;
          }
        }
      }
    }
    
    if (currentLine.trim()) {
      lines.push({ text: currentLine.trim(), hasBold: currentLine.includes('**') });
    }
    
    return lines.map(line => line.text);
  }

  // Inline chat helpers for export status
  function showExportTypingIndicator() {
    const chat = document.getElementById('chat-messages');
    if (!chat) return;
    // Avoid duplicates
    if (chat.querySelector('.typing-message.export-typing')) return;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai typing-message export-typing';
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    chat.appendChild(typingDiv);
    chat.scrollTop = chat.scrollHeight;
  }

  function hideExportTypingIndicator() {
    try {
      const chat = document.getElementById('chat-messages');
      const typing =
        chat && chat.querySelector('.typing-message.export-typing');
      if (typing) typing.remove();
    } catch {}
  }

  function appendChatMessage(html) {
    const chat = document.getElementById('chat-messages');
    if (!chat) return;
    const wrap = document.createElement('div');
    wrap.className = 'message ai';
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = html;
    wrap.appendChild(content);
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  }

  // Vector export: generate a PDF from text only (no DOM rasterization)
  async function exportChat() {
    if (exportInProgress) return;
    exportInProgress = true;
    showExportTypingIndicator();

    try {
      // Decide default source: CDN on production, local on localhost
      const host = (window.location && window.location.hostname) || '';
      const isLocalHost =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '[::1]' ||
        (window.location && window.location.protocol === 'file:');
      const preferCdnDefault = !isLocalHost;

      const loaded = await loadLibraries({
        preferCdn: preferCdnDefault,
        reload: false,
      });
      if (!loaded) {
        const retry = await loadLibraries({ preferCdn: true, reload: true });
        if (!retry) {
          throw new Error('jsPDF could not be loaded');
        }
      }

      const { jsPDF } = jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Page metrics
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = { top: 18, right: 15, bottom: 18, left: 15 };

      // Header
      addHeaderToDocument(doc);
      let cursorY = margin.top + 15;

      // Styles
      const bubble = {
        padX: 4,
        padY: 4,
        radius: 4,
        maxWidth: 140, // mm
        fillR: 0,
        fillG: 120,
        fillB: 215,
        textR: 255,
        textG: 255,
        textB: 255,
        lineH: 5, // mm per line in bubble
        fontSize: 11,
      };
      const ai = {
        textR: 20,
        textG: 20,
        textB: 20,
        lineH: 5.2, // mm per line
        fontSize: 11,
      };

      // Read transcript from enhanced history (with markdown) or fallback to DOM
      let transcript = [];
      
      // Try to get enhanced history with markdown first
      if (window.ChatExport && Array.isArray(window.ChatExport.enhancedHistory)) {
        transcript = window.ChatExport.enhancedHistory.map(item => ({
          role: item.role === 'model' ? 'ai' : item.role,
          text: item.text,
          markdown: item.markdown || item.text
        }));
      }
      
      // Fallback to DOM parsing if no enhanced history
      if (transcript.length === 0) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) throw new Error('Chat messages container not found');

        const nodes = Array.from(chatContainer.children).filter(
          (el) =>
            el.classList.contains('message') &&
            !el.classList.contains('typing-message') &&
            !el.classList.contains('welcome-message')
        );

        transcript = nodes.map((el) => {
          const role = el.classList.contains('user') ? 'user' : 'ai';
          const text = (
            el.querySelector('.message-content')?.innerText || ''
          ).trim();
          const markdown = el.getAttribute('data-markdown') || text;
          return { role, text, markdown: role === 'ai' ? markdown : text };
        });
      }

      // Helpers
      function addPageIfNeeded(blockHeight) {
        if (cursorY + blockHeight > pageH - margin.bottom) {
          doc.addPage();
          // no header on subsequent pages
          cursorY = margin.top;
        }
      }

      function drawUserBubble(text) {
        if (!text) return;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(bubble.fontSize);

        // Max inner width for wrapping
        const innerMax = bubble.maxWidth - 2 * bubble.padX;

        // Wrap to innerMax so long messages break, short ones stay narrow
        const lines = doc.splitTextToSize(text, innerMax);

        // Measure the longest wrapped line to size the bubble up to max
        let maxLineW = 0;
        for (let i = 0; i < lines.length; i++) {
          const w = doc.getTextWidth(lines[i]);
          if (w > maxLineW) maxLineW = w;
        }

        // Inner width is the measured longest line, but never over innerMax
        const rectInnerW = Math.min(maxLineW, innerMax);
        // Bubble width fits content + padding, capped at maxWidth
        const rectW = Math.min(bubble.maxWidth, rectInnerW + 2 * bubble.padX);

        // Height from wrapped lines
        const textH = lines.length * bubble.lineH;
        const rectH = textH + 2 * bubble.padY;

        // Page break if needed
        addPageIfNeeded(rectH);

        // Right-align the bubble box
        const xRight = pageW - margin.right;
        const rectX = xRight - rectW;
        const rectY = cursorY;

        // Bubble shape
        doc.setFillColor(bubble.fillR, bubble.fillG, bubble.fillB);
        if (doc.roundedRect) {
          doc.roundedRect(
            rectX,
            rectY,
            rectW,
            rectH,
            bubble.radius,
            bubble.radius,
            'F'
          );
        } else {
          doc.rect(rectX, rectY, rectW, rectH, 'F');
        }

        // Text inside (left aligned within the bubble)
        doc.setTextColor(bubble.textR, bubble.textG, bubble.textB);
        let ty = rectY + bubble.padY + 3.6;
        const tx = rectX + bubble.padX;
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], tx, ty);
          ty += bubble.lineH;
        }

        // Space after the bubble
        cursorY = rectY + rectH + 12;
      }

      function drawAiBlock(text, markdown) {
        if (!text && !markdown) return;
        
        const contentToRender = markdown || text;
        const maxWidth = pageW - margin.left - margin.right;
        
        // Parse markdown into structured elements
        const elements = parseMarkdownForPdf(contentToRender);
        
        for (const element of elements) {
          switch (element.type) {
            case 'header1':
            case 'header2':
            case 'header3':
              addPageIfNeeded(element.fontSize * 1.2);
              doc.setFont('helvetica', element.style || 'bold');
              doc.setFontSize(element.fontSize || ai.fontSize);
              doc.setTextColor(ai.textR, ai.textG, ai.textB);
              doc.text(element.text, margin.left, cursorY);
              cursorY += (element.fontSize || ai.fontSize) * 1.2;
              break;
              
            case 'list':
            case 'orderedList':
              for (let i = 0; i < element.items.length; i++) {
                const item = element.items[i];
                const indent = margin.left + (item.level * 8);
                const bulletWidth = element.type === 'orderedList' ? 10 : 6;
                const textMaxWidth = maxWidth - (item.level * 8) - bulletWidth;
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(ai.fontSize);
                doc.setTextColor(ai.textR, ai.textG, ai.textB);
                
                const lines = renderMarkdownText(doc, item.text, indent + bulletWidth, textMaxWidth);
                const blockHeight = lines.length * ai.lineH;
                
                addPageIfNeeded(blockHeight);
                
                // Draw bullet/number
                const bullet = element.type === 'orderedList' ? `${i + 1}.` : '•';
                doc.text(bullet, indent, cursorY);
                
                // Draw text lines
                let lineY = cursorY;
                for (const line of lines) {
                  // Handle bold text within lines
                  if (line.includes('**')) {
                    renderBoldText(doc, line, indent + bulletWidth, lineY);
                  } else {
                    doc.text(line, indent + bulletWidth, lineY);
                  }
                  lineY += ai.lineH;
                }
                
                cursorY = lineY;
              }
              cursorY += 2; // spacing after list
              break;
              
            case 'paragraph':
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(ai.fontSize);
              doc.setTextColor(ai.textR, ai.textG, ai.textB);
              
              const lines = renderMarkdownText(doc, element.text, margin.left, maxWidth);
              const blockHeight = lines.length * ai.lineH;
              
              addPageIfNeeded(blockHeight);
              
              for (const line of lines) {
                if (element.hasBold && line.includes('**')) {
                  renderBoldText(doc, line, margin.left, cursorY);
                } else {
                  doc.text(line, margin.left, cursorY);
                }
                cursorY += ai.lineH;
              }
              cursorY += 2; // spacing after paragraph
              break;
              
            case 'spacing':
              cursorY += element.height || 2;
              break;
          }
        }
      }

      function renderBoldText(doc, text, x, y) {
        const parts = text.split(/(\*\*[^*]+\*\*)/);
        let currentX = x;
        
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            doc.setFont('helvetica', 'bold');
            const boldText = part.slice(2, -2);
            doc.text(boldText, currentX, y);
            currentX += doc.getTextWidth(boldText);
            doc.setFont('helvetica', 'normal');
          } else {
            doc.text(part, currentX, y);
            currentX += doc.getTextWidth(part);
          }
        }
      }

      if (transcript.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('No messages to export.', margin.left, cursorY);
      } else {
        for (const m of transcript) {
          if (m.role === 'user') {
            drawUserBubble(m.text);
          } else {
            drawAiBlock(m.text, m.markdown);
          }
        }
      }

      // Footer page numbers
      addPageNumbers(doc, pageW, pageH, margin);

      // Create a Blob URL and post a chat message with a text download link
      const date = new Date().toISOString().slice(0, 10);
      const filename = `Chat-Corey-Lawrence-${date}.pdf`;
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);

        hideExportTypingIndicator();

        const linkHtml = `<span>PDF ready:</span> <a href="${url}" target="_blank" rel="noopener noreferrer" download="${filename}">Download PDF</a>`;
        appendChatMessage(linkHtml);

        const chat = document.getElementById('chat-messages');
        if (chat) {
          const lastLink = chat.querySelector(
            '.message.ai:last-child .message-content a[href^="blob:"]'
          );
          if (lastLink) {
            lastLink.addEventListener(
              'click',
              () => {
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
              },
              { once: true }
            );
          }
        }
        setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
      } catch (e) {
        hideExportTypingIndicator();
        appendChatMessage('PDF export failed. Please try again.');
      }

      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      hideExportTypingIndicator();
      appendChatMessage('PDF export failed. Please try again.');
    } finally {
      exportInProgress = false;
    }
  }

  function addHeaderToDocument(doc) {
    const emailHref = document.getElementById('profile-email')?.href || '';
    const email =
      emailHref && emailHref.startsWith('mailto:')
        ? emailHref.replace('mailto:', '')
        : '';
    const linkedinHref =
      document.getElementById('profile-linkedin')?.href || '';
    const githubHref = document.getElementById('profile-github')?.href || '';
    const portfolioHref =
      document.querySelector('link[rel="canonical"]')?.href ||
      window.location.origin + '/';

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(0, 0, 0);
    doc.text('Chat with Corey Lawrence', pageWidth / 2, 14, {
      align: 'center',
    });

    // Contact links row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const items = [];
    if (email) items.push({ text: email, url: `mailto:${email}` });
    if (linkedinHref) items.push({ text: 'LinkedIn', url: linkedinHref });
    if (githubHref) items.push({ text: 'GitHub', url: githubHref });
    if (portfolioHref) items.push({ text: 'Portfolio', url: portfolioHref });

    const sep = ' | ';
    const sepColor = [120, 120, 120];
    const linkColor = [10, 102, 194];

    const sepWidth = doc.getTextWidth(sep);
    const linksWidth = items.reduce(
      (sum, it) => sum + doc.getTextWidth(it.text),
      0
    );
    const totalWidth = linksWidth + Math.max(0, items.length - 1) * sepWidth;

    const y = 24;
    let x = (pageWidth - totalWidth) / 2;

    items.forEach((it, idx) => {
      if (idx > 0) {
        doc.setTextColor(...sepColor);
        doc.text(sep, x, y);
        x += sepWidth;
      }
      doc.setTextColor(...linkColor);
      if (typeof doc.textWithLink === 'function') {
        doc.textWithLink(it.text, x, y, { url: it.url });
      } else {
        const w = doc.getTextWidth(it.text);
        doc.text(it.text, x, y);
        doc.link(x, y - 4, w, 6, { url: it.url });
      }
      x += doc.getTextWidth(it.text);
    });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 28, pageWidth - 15, 28);
  }

  function addPageNumbers(doc, pageW, pageH, margin) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const label = `Page ${i} of ${pageCount}`;
      doc.text(label, pageW - margin.right, pageH - 6, { align: 'right' });
    }
  }

  // Initialize the export button
  function init() {
    const exportButton = document.getElementById('download-pdf-btn');
    if (!exportButton) {
      console.warn('PDF export button not found');
      return;
    }
    // Replace button to remove any existing listeners
    const newButton = exportButton.cloneNode(true);
    if (exportButton.parentNode) {
      exportButton.parentNode.replaceChild(newButton, exportButton);
    }
    // Add click handler
    newButton.addEventListener('click', exportChat);
    console.log('PDF export initialized with jsPDF vector implementation');
  }

  // Expose a tiny global API so other scripts can trigger export
  try {
    window.ChatExport = Object.assign({}, window.ChatExport, {
      exportChat,
      isExporting: () => !!exportInProgress,
      getStatus: () => {
        try {
          return JSON.parse(JSON.stringify(status));
        } catch {
          return { error: 'unavailable' };
        }
      },
    });
  } catch {}

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
