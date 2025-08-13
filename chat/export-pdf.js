/**
 * Chat PDF Export - Uses jsPDF and html2canvas for reliable PDF generation
 * Required libraries:
 * - jspdf (https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)
 * - html2canvas (https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js)
 */

(function () {
  // Track if export is in progress to prevent multiple simultaneous exports
  let exportInProgress = false;
  let librariesLoaded = false;

  // Load required libraries dynamically
  async function loadLibraries(forceCdn = false) {
    if (librariesLoaded && !forceCdn) return true;

    try {
      // Check if libraries are already loaded when not forcing CDN
      if (!forceCdn) {
        if (typeof jspdf !== 'undefined' && typeof html2canvas !== 'undefined') {
          librariesLoaded = true;
          return true;
        }
      }

      console.log('Loading PDF export libraries...');

      // Function to load a script
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load: ${src}`));
          document.head.appendChild(script);
        });
      };

      // Load both libraries from CDN (always for forceCdn)
      const urls = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      ];
      // Avoid duplicate script tags when forceCdn=true and scripts already exist
      const toLoad = urls.filter((src) => !document.querySelector(`script[src="${src}"]`));
      if (toLoad.length) {
        await Promise.all(toLoad.map((u) => loadScript(u)));
      }

      // Verify libraries loaded correctly
  if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        throw new Error('Libraries not available after loading');
      }

      librariesLoaded = true;
      console.log('PDF libraries loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load PDF libraries:', error);
      return false;
    }
  }

  // (notification formatting helper removed; not needed for inline messages)

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
      const typing = chat && chat.querySelector('.typing-message.export-typing');
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

  // Main export function that generates a PDF from the chat content
  async function exportChat() {
    // Prevent multiple exports running simultaneously
    if (exportInProgress) return;
    exportInProgress = true;

  // Show typing dots in the chat area
  showExportTypingIndicator();

    try {
  // Load the libraries via CDN for consistent behavior across environments
  const loaded = await loadLibraries(true);
      if (!loaded) {
        throw new Error(
          'Required libraries (jsPDF or html2canvas) could not be loaded'
        );
      }

      // Create a PDF document (A4 portrait)
      const { jsPDF } = jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add header with contact information
      addHeaderToDocument(doc);

      // Get the chat messages container
      const chatContainer = document.getElementById('chat-messages');
      if (!chatContainer) {
        throw new Error('Chat messages container not found');
      }

      // Prevent horizontal scroll/shift while we add an offscreen render node
      const htmlEl = document.documentElement;
      const bodyEl = document.body;
      const prevHtmlOverflowX = htmlEl.style.overflowX;
      const prevBodyOverflowX = bodyEl.style.overflowX;
      htmlEl.style.overflowX = 'hidden';
      bodyEl.style.overflowX = 'hidden';

  // Create a container for the cloned content with chat-like styling
  const pdfContent = document.createElement('div');
  pdfContent.id = 'pdf-export-content';
  // Use px instead of mm to avoid odd reflow/zoom on Safari iOS
  // Optimize width & padding to reduce render surface (performance on mobile Safari)
  pdfContent.style.width = '760px';
  pdfContent.style.padding = '40px';
      pdfContent.style.backgroundColor = '#fff';
      // Keep it offscreen and invisible, but still renderable for html2canvas
      // Avoid visibility:hidden (html2canvas skips it). Use opacity:0 and off-canvas position.
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-10000px';
      pdfContent.style.top = '0';
      pdfContent.style.pointerEvents = 'none';
      pdfContent.style.overflow = 'hidden';
      pdfContent.style.contain = 'content';
      pdfContent.style.willChange = 'transform';
      pdfContent.style.transform = 'translateZ(0)';
      pdfContent.style.fontFamily =
        'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
      pdfContent.style.fontSize = '14px';
      pdfContent.style.color = '#333';
      pdfContent.style.display = 'flex';
      pdfContent.style.flexDirection = 'column';

      // Process each message and add to the PDF content container
      const messages = Array.from(chatContainer.children).filter(
        (el) =>
          el.classList.contains('message') &&
          !el.classList.contains('typing-message') &&
          !el.classList.contains('welcome-message')
      );

      // Prepare a text-only transcript fallback in case rendering fails or times out
      const messageTexts = messages.map((m) => {
        const isUser = m.classList.contains('user');
        const contentEl = m.querySelector('.message-content');
        const text = contentEl ? (contentEl.innerText || contentEl.textContent || '').trim() : '';
        return { role: isUser ? 'You' : 'Assistant', text };
      });

      if (messages.length === 0) {
        pdfContent.innerHTML =
          '<p style="text-align:center;color:#666;padding:20px;">No messages to export.</p>';
      } else {
        messages.forEach((message, index) => {
          const messageClone = createMessageElement(message);
          if (messageClone) {
            pdfContent.appendChild(messageClone);
          }
        });
      }

      // Add to document temporarily
      document.body.appendChild(pdfContent);

      // Helper to attempt rendering the entire cloned chat to a canvas with a timeout
      async function attemptRenderCanvas(scale, timeoutMs) {
        try {
          const renderPromise = html2canvas(pdfContent, {
            scale,
            useCORS: true,
            backgroundColor: '#FFFFFF',
            logging: false,
            // Trim large shadow/overflow computations for speed
            removeContainer: true,
          });
          const canvas = await Promise.race([
            renderPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('render-timeout')), timeoutMs)
            ),
          ]);
          return canvas || null;
        } catch (e) {
          return null;
        }
      }

      // Wait a moment for rendering and fonts, but never hang
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      await delay(300);
      if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
        // Race with timeout to avoid Safari hanging on fonts.ready
        await Promise.race([
          document.fonts.ready,
          delay(1200),
        ]);
      }
      // Force a reflow to ensure layout is committed
      void pdfContent.offsetHeight;

      // Strategy: High-quality first attempt; if it fails/timeouts, retry with lower scale.
      const viewportWidth = window.innerWidth || 0;
      const firstScale = viewportWidth <= 480 ? 1.05 : 1.3; // lower than before
      const secondScale = viewportWidth <= 480 ? 0.95 : 1.05; // fallback smaller scale
      let canvas = await attemptRenderCanvas(firstScale, 14000);
      if (!canvas) {
        // Reduce padding & width further for retry to shrink surface area
        pdfContent.style.padding = '32px';
        pdfContent.style.width = '700px';
        // Force reflow before second attempt
        void pdfContent.offsetHeight;
        canvas = await attemptRenderCanvas(secondScale, 18000);
      }

      // If rendering failed or timed out after retries, fallback to text-only transcript
      if (!canvas) {
        addTranscriptToPdf(doc, messageTexts);
      } else {
        // Replace the previous single-image + broken multipage block with reliable slicing
      // Page metrics and margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = { top: 15, right: 15, bottom: 15, left: 15 };

      // Header is already drawn; reserve extra top space on page 1 so content starts below it
      const firstPageContentTop = 30; // matches header layout
      const contentWidthMm = pageWidth - margins.left - margins.right;

      // Canvas dimensions (px)
      const srcWidthPx = canvas.width;
      const srcHeightPx = canvas.height;

      // Convert px <-> mm for consistent scaling
      const mmPerPx = contentWidthMm / srcWidthPx;

      // Compute how many source pixels fit on a page
      const firstPageContentHeightMm =
        pageHeight - firstPageContentTop - margins.bottom;
      const nextPageContentHeightMm = pageHeight - margins.top - margins.bottom;

      const firstSliceHeightPx = Math.floor(firstPageContentHeightMm / mmPerPx);
      const sliceHeightPx = Math.floor(nextPageContentHeightMm / mmPerPx);

      // Helper: add a slice of the big canvas as an image to the PDF
      function addSliceToPdf(srcCanvas, srcY, slicePxHeight, isFirstPage) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = srcCanvas.width;
        sliceCanvas.height = slicePxHeight;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(
          srcCanvas,
          0,
          srcY,
          srcCanvas.width,
          slicePxHeight, // src crop
          0,
          0,
          sliceCanvas.width,
          sliceCanvas.height // dst
        );
        const imgData = sliceCanvas.toDataURL('image/jpeg', 0.98);

        const drawYmm = isFirstPage ? firstPageContentTop : margins.top;
        const sliceHeightMm = slicePxHeight * mmPerPx;

        doc.addImage(
          imgData,
          'JPEG',
          margins.left,
          drawYmm,
          contentWidthMm,
          sliceHeightMm
        );
      }

        // Add first page content slice
        let offsetPx = 0;
        const firstHeight = Math.min(firstSliceHeightPx, srcHeightPx);
        addSliceToPdf(canvas, offsetPx, firstHeight, true);
        offsetPx += firstHeight;

        // Remaining pages
        while (offsetPx < srcHeightPx) {
          doc.addPage();
          const remainingPx = srcHeightPx - offsetPx;
          const thisSlicePx = Math.min(sliceHeightPx, remainingPx);
          addSliceToPdf(canvas, offsetPx, thisSlicePx, false);
          offsetPx += thisSlicePx;
        }
      }

      // Create a Blob URL and post a chat message with a text download link (desktop + mobile)
      const date = new Date().toISOString().slice(0, 10);
      const filename = `Chat-Corey-Lawrence-${date}.pdf`;
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);

        // Hide typing dots
        hideExportTypingIndicator();

        // Add inline AI message with a plain text download link
        const linkHtml = `<span>PDF ready:</span> <a href="${url}" target="_blank" rel="noopener noreferrer" download="${filename}">Download PDF</a>`;
        appendChatMessage(linkHtml);

        // Revoke URL shortly after the user clicks; also set a long-timeout safeguard
        const chat = document.getElementById('chat-messages');
        if (chat) {
          const lastLink = chat.querySelector('.message.ai:last-child .message-content a[href^="blob:"]');
          if (lastLink) {
            lastLink.addEventListener('click', () => {
              setTimeout(() => URL.revokeObjectURL(url), 60_000);
            }, { once: true });
          }
        }
        setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
      } catch (e) {
        // Final fallback: show error in chat
        hideExportTypingIndicator();
        appendChatMessage('PDF export failed. Please try again.');
      }

      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      hideExportTypingIndicator();
      appendChatMessage('PDF export failed. Please try again.');
    } finally {
      // Always clean up the offscreen node and any temporary style changes
      try {
        const temp = document.getElementById('pdf-export-content');
        if (temp && temp.parentNode) temp.parentNode.removeChild(temp);
      } catch {}
      try {
        if (typeof prevHtmlOverflowX !== 'undefined') {
          document.documentElement.style.overflowX = prevHtmlOverflowX;
        }
        if (typeof prevBodyOverflowX !== 'undefined') {
          document.body.style.overflowX = prevBodyOverflowX;
        }
      } catch {}
      exportInProgress = false;
    }
  }

  // Fallback: write a simple transcript into the PDF to guarantee an output
  function addTranscriptToPdf(doc) {
    const args = arguments;
    // Support previous signature addTranscriptToPdf(doc, messageTexts)
    const messageTexts = args[1] || [];
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 6; // in mm
    let cursorY = 30; // below header line

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const drawLines = (text, isUser) => {
      doc.setFont('helvetica', isUser ? 'bold' : 'normal');
      doc.setFontSize(11);
      doc.setTextColor(isUser ? 10 : 30, isUser ? 102 : 30, isUser ? 194 : 30);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((ln) => {
        if (cursorY + lineHeight > pageHeight - margin) {
          doc.addPage();
          // redraw header separator
          doc.setDrawColor(200, 200, 200);
          doc.line(15, 28, pageWidth - 15, 28);
          cursorY = 30;
        }
        doc.text(ln, margin, cursorY);
        cursorY += lineHeight;
      });
      // spacing between messages
      cursorY += 2;
    };

    messageTexts.forEach((m) => {
      const prefix = m.role === 'You' ? 'You: ' : 'Assistant: ';
      drawLines(prefix + (m.text || ''), m.role === 'You');
    });
  }

  // Create a styled message element for the PDF that matches the chat window appearance
  function createMessageElement(originalMessage) {
    const isUser = originalMessage.classList.contains('user');
    const isAI = originalMessage.classList.contains('ai');

    // Skip if not a message we recognize
    if (!isUser && !isAI) return null;

    // Get the content
    const contentEl = originalMessage.querySelector('.message-content');
    if (!contentEl) return null;

    // Create styled message box
    const messageBox = document.createElement('div');
    messageBox.style.marginBottom = '16px';
    messageBox.style.maxWidth = '100%';

    // Style differently based on message type to match chat window
    if (isUser) {
      // User message: blue bubble, right-aligned
      messageBox.style.padding = '12px 16px';
      messageBox.style.borderRadius = '18px';
      messageBox.style.backgroundColor = '#0078d7'; // Blue background like chat
      messageBox.style.color = '#fff'; // White text
      messageBox.style.alignSelf = 'flex-end';
      messageBox.style.width = 'auto';
      messageBox.style.maxWidth = '80%';
      messageBox.style.marginLeft = 'auto'; // Right align
      messageBox.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
    } else {
      // AI message: no bubble, full width
      messageBox.style.padding = '12px 16px';
      messageBox.style.backgroundColor = '#fff'; // Match background color (no visible bubble)
      messageBox.style.color = '#333'; // Dark text
      messageBox.style.width = '98%'; // Almost full width
      messageBox.style.borderBottom = '1px solid #f0f0f0'; // Light separator
    }

    // Create content container
    const messageContent = document.createElement('div');
    messageContent.style.lineHeight = '1.5';
    messageContent.style.wordBreak = 'break-word';

    // Handle content differently based on sender
    if (isUser) {
      // For user messages, use plain text (no sender label needed)
      messageContent.textContent = contentEl.textContent;
    } else {
      // For AI messages, preserve HTML formatting (no sender label needed)
      messageContent.innerHTML = contentEl.innerHTML;

      // Style specific elements within AI responses to match chat window
      messageContent.style.fontSize = '14px';

      // Style code blocks and other formatted elements
      const styleTag = document.createElement('style');
      styleTag.textContent = `
        #pdf-export-content pre {
          background-color: #f6f8fa;
          border-radius: 6px;
          padding: 12px;
          overflow-x: auto;
          font-family: monospace;
          font-size: 13px;
          line-height: 1.45;
          margin: 10px 0;
        }
        #pdf-export-content code {
          background-color: #f6f8fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 13px;
        }
        #pdf-export-content ul, #pdf-export-content ol {
          padding-left: 20px;
          margin: 8px 0;
        }
        #pdf-export-content li {
          margin-bottom: 6px;
        }
        #pdf-export-content p {
          margin: 0 0 10px 0;
        }
        #pdf-export-content a {
          color: #0366d6;
          text-decoration: underline;
        }
      `;
      document.head.appendChild(styleTag);

      // Remove the style tag after PDF generation
      setTimeout(() => styleTag.remove(), 2000);
    }

    messageBox.appendChild(messageContent);
    return messageBox;
  }

  // Add header with contact information to the PDF
  function addHeaderToDocument(doc) {
    // Get contact information from the DOM
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

    // Page metrics
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(0, 0, 0);
    doc.text('Chat with Corey Lawrence', pageWidth / 2, 14, {
      align: 'center',
    });

    // Contact links (slightly larger font)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // Prepare items: email shows the address; others show a word label
    const items = [];
    if (email) items.push({ text: email, url: `mailto:${email}` });
    if (linkedinHref) items.push({ text: 'LinkedIn', url: linkedinHref });
    if (githubHref) items.push({ text: 'GitHub', url: githubHref });
    if (portfolioHref) items.push({ text: 'Portfolio', url: portfolioHref });

    const sep = ' | ';
    const sepColor = [120, 120, 120];
    const linkColor = [10, 102, 194]; // link blue

    // Compute total line width to center it
    const sepWidth = doc.getTextWidth(sep);
    const linksWidth = items.reduce(
      (sum, it) => sum + doc.getTextWidth(it.text),
      0
    );
    const totalWidth = linksWidth + Math.max(0, items.length - 1) * sepWidth;

    // Draw centered at y
    const y = 24;
    let x = (pageWidth - totalWidth) / 2;

    items.forEach((it, idx) => {
      if (idx > 0) {
        doc.setTextColor(...sepColor);
        doc.text(sep, x, y);
        x += sepWidth;
      }
      doc.setTextColor(...linkColor);
      // Render the word with a proper hyperlink
      if (typeof doc.textWithLink === 'function') {
        doc.textWithLink(it.text, x, y, { url: it.url });
      } else {
        // Fallback: draw text then attach a link rectangle
        const w = doc.getTextWidth(it.text);
        doc.text(it.text, x, y);
        doc.link(x, y - 4, w, 6, { url: it.url });
      }
      x += doc.getTextWidth(it.text);
    });

    // Separator line under header
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 28, pageWidth - 15, 28);
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
    console.log('PDF export initialized with jsPDF implementation');
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
