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
  // Status flags for reachability and source selection
  const status = {
    jspdf: { loaded: false, source: null, url: null, error: null },
    html2canvas: { loaded: false, source: null, url: null, error: null },
    cdn: { tested: false, reachable: null, lastUrl: null, error: null },
  };

  // --- Debug logging helpers (no-ops unless enabled) ---
  const _timers = {};
  function isDebug() {
    try {
      return !!(window.ChatExport && window.ChatExport.debug);
    } catch {
      return false;
    }
  }
  function dlog(...args) {
    if (!isDebug()) return;
    try {
      console.log('[PDF DEBUG]', ...args);
    } catch {}
  }
  function dtimeStart(label) {
    if (!isDebug()) return;
    _timers[label] =
      typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
    try {
      console.log('[PDF DEBUG TIME]', label, 'start');
    } catch {}
  }
  function dtimeEnd(label) {
    if (!isDebug()) return;
    const t0 = _timers[label];
    const t1 =
      typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
    const ms = t0 && t1 ? (t1 - t0).toFixed(1) : 'n/a';
    try {
      console.log('[PDF DEBUG TIME]', label, 'end', ms + 'ms');
    } catch {}
  }

  // Load required libraries dynamically
  async function loadLibraries(options = {}) {
    const { preferCdn = false, reload = false } = options || {};
    if (librariesLoaded && !reload) {
      dlog('Libraries already loaded; skip reload');
      return true;
    }

    try {
      // Check if libraries are already loaded when not reloading
      if (!reload) {
        if (
          typeof jspdf !== 'undefined' &&
          typeof html2canvas !== 'undefined'
        ) {
          librariesLoaded = true;
          status.jspdf.loaded = true;
          status.html2canvas.loaded = true;
          status.jspdf.source = status.jspdf.source || 'preloaded';
          status.html2canvas.source = status.html2canvas.source || 'preloaded';
          dlog('Detected preloaded libs:', {
            jspdf: status.jspdf,
            html2canvas: status.html2canvas,
          });
          return true;
        }
      }

      console.log('Loading PDF export libraries...');
      dlog('loadLibraries options:', { preferCdn, reload });

      // Function to load a script
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.onload = () => {
            dlog('Loaded script:', src);
            resolve();
          };
          script.onerror = () => {
            dlog('Script failed:', src);
            reject(new Error(`Failed to load: ${src}`));
          };
          document.head.appendChild(script);
        });
      };

      // Prefer vendored UMD bundles in repo; fallback to local node_modules, then CDN
      const vendorCandidates = [
        './vendor/jspdf.umd.min.js',
        './vendor/html2canvas.min.js',
      ];
      const base = './node_modules'; // relative to /chat
      const localCandidates = [
        `${base}/jspdf/dist/jspdf.umd.min.js`,
        `${base}/html2canvas/dist/html2canvas.min.js`,
      ];
      const cdnCandidates = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      ];

      async function tryLoadFrom(urls, sourceLabel) {
        dlog('Trying source:', sourceLabel, 'urls:', urls);
        const toLoad = urls.filter(
          (src) => !document.querySelector(`script[src="${src}"]`)
        );
        if (toLoad.length) {
          dtimeStart(`load:${sourceLabel}`);
          await Promise.all(toLoad.map((u) => loadScript(u)));
          dtimeEnd(`load:${sourceLabel}`);
        } else {
          dlog('All scripts for source already present:', sourceLabel);
        }
        // Update sources if libs are now present
        if (typeof jspdf !== 'undefined') {
          status.jspdf.loaded = true;
          status.jspdf.source = sourceLabel;
          status.jspdf.url = urls.find((u) => /jspdf/i.test(u)) || null;
        }
        if (typeof html2canvas !== 'undefined') {
          status.html2canvas.loaded = true;
          status.html2canvas.source = sourceLabel;
          status.html2canvas.url =
            urls.find((u) => /html2canvas/i.test(u)) || null;
        }
        dlog('Post-load status:', {
          jspdf: status.jspdf,
          html2canvas: status.html2canvas,
        });
      }

      // Loading strategy: prefer vendor first (checked-in), then node_modules, then CDN
      // If preferCdn=true, try CDN first, then vendor, then node_modules
      const order = preferCdn
        ? [cdnCandidates, vendorCandidates, localCandidates]
        : [vendorCandidates, localCandidates, cdnCandidates];
      let loadedFrom = null;
      let lastErr = null;
      for (const [idx, urls] of order.entries()) {
        const label =
          urls === cdnCandidates
            ? 'cdn'
            : urls === localCandidates
            ? 'local'
            : 'vendor';
        try {
          await tryLoadFrom(urls, label);
          loadedFrom = label;
          break;
        } catch (err) {
          lastErr = err;
          if (label === 'cdn') status.cdn.error = status.cdn.error || err;
          dlog('Source failed:', label, err?.message || err);
        }
      }
      if (!loadedFrom)
        throw lastErr || new Error('No library source succeeded');

      // Verify libraries loaded correctly
      if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        throw new Error('Libraries not available after loading');
      }

      librariesLoaded = true;
      console.log('PDF libraries loaded successfully from', loadedFrom);
      dlog('Libraries ready from:', loadedFrom);
      return true;
    } catch (error) {
      console.error('Failed to load PDF libraries:', error);
      status.jspdf.error = status.jspdf.error || error;
      status.html2canvas.error = status.html2canvas.error || error;
      dlog('loadLibraries error:', error?.message || error);
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

  // Main export function that generates a PDF from the chat content
  async function exportChat() {
    // Prevent multiple exports running simultaneously
    if (exportInProgress) return;
    exportInProgress = true;

    // Show typing dots in the chat area
    showExportTypingIndicator();

    try {
      // Decide default source: prefer vendored files by default; allow global override via window.ChatExport.preferSource
      const forced =
        (window.ChatExport && window.ChatExport.preferSource) || '';
      let preferCdnDefault = false; // vendor/local first by default
      if (typeof forced === 'string' && forced) {
        const f = forced.toLowerCase();
        if (f === 'cdn') preferCdnDefault = true;
        else preferCdnDefault = false; // 'vendor' or 'local' -> non-CDN path first
      }
      dlog(
        'exportChat start; forced source:',
        forced || '(none)',
        'preferCdnDefault:',
        preferCdnDefault
      );

      // Load libraries with environment-aware preference, then fallback
      let loaded = await loadLibraries({
        preferCdn: preferCdnDefault,
        reload: false,
      });
      if (!loaded) {
        console.warn('Local libraries unavailable; trying CDN...');
        dlog('Primary load failed; retrying with CDN reload');
        loaded = await loadLibraries({ preferCdn: true, reload: true });
      }
      if (!loaded) {
        throw new Error(
          'Required libraries (jsPDF or html2canvas) could not be loaded'
        );
      }

      // Create a PDF document (A4 portrait)
      const { jsPDF } = jspdf;
      dlog('Creating jsPDF document');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      dlog('jsPDF document created:', { size: doc.internal?.pageSize });

      // Add header with contact information
      dlog('Adding header to document');
      addHeaderToDocument(doc);

      // Get the chat messages container
      const chatContainer = document.getElementById('chat-messages');
      if (!chatContainer) {
        throw new Error('Chat messages container not found');
      }
      dlog('Found chat container');

      // Prevent horizontal scroll/shift while we add an offscreen render node
      const htmlEl = document.documentElement;
      const bodyEl = document.body;
      const prevHtmlOverflowX = htmlEl.style.overflowX;
      const prevBodyOverflowX = bodyEl.style.overflowX;
      htmlEl.style.overflowX = 'hidden';
      bodyEl.style.overflowX = 'hidden';
      dlog('Adjusted overflow for offscreen render');

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
      dlog('Messages selected for export:', { count: messages.length });

      // Prepare a text-only transcript fallback in case rendering fails or times out
      const messageTexts = messages.map((m) => {
        const isUser = m.classList.contains('user');
        const contentEl = m.querySelector('.message-content');
        const text = contentEl
          ? (contentEl.innerText || contentEl.textContent || '').trim()
          : '';
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
      dlog('Temporary PDF content appended to body');

      // Helper to attempt rendering a bounded region to a canvas with a timeout
      // Note: We limit output canvas size to avoid large allocations on iOS.
      async function attemptRenderSlice({ scale, timeoutMs, y = 0, heightPx }) {
        try {
          const widthPx = pdfContent.clientWidth;
          dlog('attemptRenderSlice start', { scale, timeoutMs, y, heightPx, widthPx });
          dtimeStart(`render-slice:${y}:${heightPx}:s${scale}`);
          const renderPromise = html2canvas(pdfContent, {
            scale,
            useCORS: true,
            backgroundColor: '#FFFFFF',
            logging: false,
            removeContainer: true,
            width: widthPx,
            height: heightPx,
            x: 0,
            y,
            windowWidth: Math.max(widthPx, 800),
            windowHeight: Math.max(heightPx, 600),
            scrollX: 0,
            scrollY: y,
          });
          const canvas = await Promise.race([
            renderPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('render-timeout')), timeoutMs)
            ),
          ]);
          dtimeEnd(`render-slice:${y}:${heightPx}:s${scale}`);
          if (canvas)
            dlog('Slice rendered:', { w: canvas.width, h: canvas.height, y });
          return canvas || null;
        } catch (e) {
          dlog('attemptRenderSlice error:', e?.message || e);
          return null;
        }
      }

      // Wait a moment for rendering and fonts, but never hang
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      await delay(300);
      dlog('Initial delay completed');
      if (
        document.fonts &&
        document.fonts.ready &&
        typeof document.fonts.ready.then === 'function'
      ) {
        // Race with timeout to avoid Safari hanging on fonts.ready
        dlog('Waiting on document.fonts.ready (with timeout)');
        await Promise.race([document.fonts.ready, delay(1200)]);
      }
      // Force a reflow to ensure layout is committed
      void pdfContent.offsetHeight;
      dlog('Layout reflowed');

      // iOS often needs more, smaller, faster retries rather than one long wait.
      // Build a short sequence of attempts with progressive downscaling and shorter timeouts.
      const ua = (navigator && navigator.userAgent) || '';
      const isIOS =
        /iP(hone|ad|od)/i.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      // Make sure any images in the cloned content are not tainting the canvas
      try {
        pdfContent.querySelectorAll('img').forEach((img) => {
          if (!img.getAttribute('crossorigin'))
            img.setAttribute('crossorigin', 'anonymous');
        });
      } catch {}

      const initialWidthPx = 760;
      const initialPaddingPx = 40;
      const vw = window.innerWidth || 0;
      const baseScale = vw <= 480 ? 1.0 : 1.15;
      const attempts = isIOS
        ? [
            { scale: baseScale, width: initialWidthPx, pad: initialPaddingPx, timeout: 6000 },
            { scale: Math.max(0.95, baseScale - 0.1), width: 720, pad: 34, timeout: 6000 },
            { scale: 0.9, width: 680, pad: 30, timeout: 5500 },
            { scale: 0.85, width: 640, pad: 26, timeout: 5000 },
            { scale: 0.8, width: 600, pad: 24, timeout: 4800 },
          ]
        : [
            { scale: baseScale, width: initialWidthPx, pad: initialPaddingPx, timeout: 7000 },
            { scale: baseScale - 0.1, width: 720, pad: 34, timeout: 6500 },
            { scale: 1.0, width: 680, pad: 30, timeout: 6500 },
            { scale: 0.9, width: 640, pad: 26, timeout: 6000 },
          ];

      // Page metrics and margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = { top: 15, right: 15, bottom: 15, left: 15 };
      const firstPageContentTop = 30; // below header
      const contentWidthMm = pageWidth - margins.left - margins.right;

      // We'll try a few scale attempts; for each, render in smaller slices to keep memory bounded
      let success = false;
      for (let i = 0; i < attempts.length && !success; i++) {
        const cfg = attempts[i];
        pdfContent.style.width = cfg.width + 'px';
        pdfContent.style.padding = cfg.pad + 'px';
        void pdfContent.offsetHeight; // reflow
        dlog('Slice render attempt', i + 1, '/', attempts.length, cfg);

        // Compute px/mm conversion for this width
        const contentWidthPx = pdfContent.clientWidth || cfg.width;
        const mmPerPx = contentWidthMm / contentWidthPx;
        const firstPageContentHeightMm = pageHeight - firstPageContentTop - margins.bottom;
        const nextPageContentHeightMm = pageHeight - margins.top - margins.bottom;
        const firstSliceHeightPx = Math.max(200, Math.floor(firstPageContentHeightMm / mmPerPx));
        const sliceHeightPx = Math.max(200, Math.floor(nextPageContentHeightMm / mmPerPx));
        const totalHeightPx = Math.max(pdfContent.scrollHeight, firstSliceHeightPx);

        try {
          // Render first page slice
          let offsetPx = 0;
          let pageCount = 0;
          const renderAndAdd = async (y, h, isFirst) => {
            const canvas = await attemptRenderSlice({
              scale: cfg.scale,
              timeoutMs: cfg.timeout,
              y,
              heightPx: h,
            });
            if (!canvas) throw new Error('slice-render-failed');
            try {
              const drawYmm = isFirst ? firstPageContentTop : margins.top;
              const sliceHeightMm = h * mmPerPx;
              // Prefer passing canvas directly if supported; jsPDF handles canvas inputs.
              doc.addImage(canvas, 'JPEG', margins.left, drawYmm, contentWidthMm, sliceHeightMm);
            } finally {
              // Aggressive canvas cleanup to free memory on iOS
              try { canvas.width = 1; canvas.height = 1; } catch {}
              try { canvas.remove(); } catch {}
            }
          };

          // First page
          const h0 = Math.min(firstSliceHeightPx, totalHeightPx);
          await renderAndAdd(offsetPx, h0, true);
          offsetPx += h0;
          pageCount++;

          // Remaining pages
          while (offsetPx < totalHeightPx) {
            doc.addPage();
            const remainingPx = totalHeightPx - offsetPx;
            const h = Math.min(sliceHeightPx, remainingPx);
            await renderAndAdd(offsetPx, h, false);
            offsetPx += h;
            pageCount++;
          }
          dlog('Added slice images to PDF', { pages: pageCount, scale: cfg.scale });
          success = true;
        } catch (sliceErr) {
          dlog('Slice attempt failed', sliceErr?.message || sliceErr);
          // Reset document to a clean state for next attempt
          try {
            // Remove all pages but the first (which only has header at this point)
            const total = doc.getNumberOfPages && doc.getNumberOfPages();
            if (total && total > 1) {
              for (let p = total; p > 1; p--) doc.deletePage(p);
            }
            // Clear any drawings on page 1 below the header by adding a white rect
            doc.setFillColor(255, 255, 255);
            doc.rect(margins.left, firstPageContentTop, contentWidthMm, pageHeight - firstPageContentTop - margins.bottom, 'F');
          } catch {}
          // small pause before next attempt
          await new Promise((r) => setTimeout(r, 120));
        }
      }

      if (!success) {
        dlog('All slice attempts failed; falling back to transcript-only PDF');
        addTranscriptToPdf(doc, messageTexts);
      }

      // Create a Blob URL and post a chat message with a text download link (desktop + mobile)
      const date = new Date().toISOString().slice(0, 10);
      const filename = `Chat-Corey-Lawrence-${date}.pdf`;
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        dlog('PDF blob created; size unknown in browser, URL prepared');

        // Hide typing dots
        hideExportTypingIndicator();

        // Add inline AI message with a plain text download link
        const linkHtml = `<span>PDF ready:</span> <a href="${url}" target="_blank" rel="noopener noreferrer" download="${filename}">Download PDF</a>`;
        appendChatMessage(linkHtml);

        // Revoke URL shortly after the user clicks; also set a shorter safeguard on iOS
        const chat = document.getElementById('chat-messages');
        const revokeSafely = () => {
          try { URL.revokeObjectURL(url); } catch {}
        };
        if (chat) {
          const lastLink = chat.querySelector(
            '.message.ai:last-child .message-content a[href^="blob:"]'
          );
          if (lastLink) {
            lastLink.addEventListener(
              'click',
              () => {
                setTimeout(revokeSafely, 45_000);
              },
              { once: true }
            );
          }
        }
        setTimeout(revokeSafely, isIOS ? 2 * 60 * 1000 : 10 * 60 * 1000);
      } catch (e) {
        // Final fallback: show error in chat
        hideExportTypingIndicator();
        appendChatMessage('PDF export failed. Please try again.');
      }

      console.log('PDF export completed successfully');
      dlog('exportChat finished');
    } catch (error) {
      console.error('PDF export failed:', error);
      dlog('exportChat error:', error?.message || error);
      hideExportTypingIndicator();
      appendChatMessage('PDF export failed. Please try again.');
    } finally {
      // Always clean up the offscreen node and any temporary style changes
      try {
        const temp = document.getElementById('pdf-export-content');
        if (temp) {
          // Force inline styles and children to be GC eligible
          try { temp.replaceChildren(); } catch {}
          if (temp.parentNode) temp.parentNode.removeChild(temp);
        }
        dlog('Cleaned up temporary export DOM');
      } catch {}
      try {
        if (typeof prevHtmlOverflowX !== 'undefined') {
          document.documentElement.style.overflowX = prevHtmlOverflowX;
        }
        if (typeof prevBodyOverflowX !== 'undefined') {
          document.body.style.overflowX = prevBodyOverflowX;
        }
        dlog('Restored overflow styles');
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
      // Prefer scoping styles to the export container to avoid head leaks
      const styleHost = document.getElementById('pdf-export-content') || document.head;
      styleHost.appendChild(styleTag);
      // If we had to append to head (rare), remove it shortly after
      if (styleHost === document.head) {
        setTimeout(() => styleTag.remove(), 2000);
      }
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
    dlog('Init complete; click handler bound');
  }

  // Expose a tiny global API so other scripts (chat-interface) can trigger export
  try {
    window.ChatExport = Object.assign({}, window.ChatExport, {
      exportChat,
      isExporting: () => !!exportInProgress,
      // Debug flag and helpers
      get debug() {
        try {
          return !!window.ChatExport._debug;
        } catch {
          return false;
        }
      },
      set debug(v) {
        try {
          window.ChatExport._debug = !!v;
        } catch {}
      },
      setDebug: (v) => {
        try {
          window.ChatExport._debug = !!v;
        } catch {}
      },
      // Allow overriding source preference at runtime: 'cdn' | 'vendor' | 'local'
      get preferSource() {
        try {
          return window.ChatExport && window.ChatExport._preferSource;
        } catch {
          return '';
        }
      },
      set preferSource(val) {
        try {
          window.ChatExport._preferSource = String(val || '').toLowerCase();
        } catch {}
      },
      setPreferSource: (val) => {
        try {
          window.ChatExport._preferSource = String(val || '').toLowerCase();
        } catch {}
      },
      getStatus: () => {
        try {
          return JSON.parse(JSON.stringify(status));
        } catch {
          return { error: 'unavailable' };
        }
      },
    });
    // Ensure debug logging is ON by default (you can turn off via window.ChatExport.setDebug(false))
    if (typeof window.ChatExport._debug === 'undefined') {
      window.ChatExport._debug = true;
    }
  } catch {}

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
