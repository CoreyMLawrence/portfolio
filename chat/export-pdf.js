/**
 * Chat PDF Export - Uses jsPDF and html2canvas for reliable PDF generation
 * Required libraries:
 * - jspdf (https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)
 * - html2canvas (https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js)
 */

(function () {
  // Single export gate
  let exportInProgress = false;
  let librariesLoaded = false;

  // Status snapshot for debugging and ops checks
  const status = {
    jspdf: { loaded: false, source: null, url: null, error: null },
    html2canvas: { loaded: false, source: null, url: null, error: null },
    cdn: { tested: false, reachable: null, lastUrl: null, error: null },
  };

  // ---------------------------
  // Debug helpers
  // ---------------------------
  const _timers = {};
  const now = () =>
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  function isDebug() {
    try {
      return !!(window.ChatExport && window.ChatExport.debug);
    } catch {
      return false;
    }
  }
  function dlog(...args) {
    if (isDebug()) {
      try {
        console.log('[PDF DEBUG]', ...args);
      } catch {}
    }
  }
  function dtimeStart(label) {
    if (!isDebug()) return;
    _timers[label] = now();
    try {
      console.log('[PDF DEBUG TIME]', label, 'start');
    } catch {}
  }
  function dtimeEnd(label) {
    if (!isDebug()) return;
    const t0 = _timers[label];
    const t1 = now();
    const ms = t0 && t1 ? (t1 - t0).toFixed(1) : 'n/a';
    try {
      console.log('[PDF DEBUG TIME]', label, 'end', ms + 'ms');
    } catch {}
  }

  // ---------------------------
  // Script loader
  // ---------------------------
  async function loadLibraries({ preferCdn = false, reload = false } = {}) {
    if (librariesLoaded && !reload) {
      dlog('Libraries already loaded. Skip reload.');
      return true;
    }

    // Preloaded detection
    if (
      !reload &&
      typeof jspdf !== 'undefined' &&
      typeof html2canvas !== 'undefined'
    ) {
      librariesLoaded = true;
      status.jspdf.loaded = true;
      status.html2canvas.loaded = true;
      status.jspdf.source = status.jspdf.source || 'preloaded';
      status.html2canvas.source = status.html2canvas.source || 'preloaded';
      dlog('Detected preloaded libs');
      return true;
    }

    const sources = {
      vendor: ['./vendor/jspdf.umd.min.js', './vendor/html2canvas.min.js'],
      local: [
        './node_modules/jspdf/dist/jspdf.umd.min.js',
        './node_modules/html2canvas/dist/html2canvas.min.js',
      ],
      cdn: [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      ],
    };

    const order = preferCdn
      ? ['cdn', 'vendor', 'local']
      : ['vendor', 'local', 'cdn'];

    async function loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(s);
      });
    }

    async function tryLoadFrom(label) {
      const urls = sources[label];
      dtimeStart(`load:${label}`);
      await Promise.all(urls.map(loadScript));
      dtimeEnd(`load:${label}`);
      if (typeof jspdf !== 'undefined') {
        status.jspdf.loaded = true;
        status.jspdf.source = label;
        status.jspdf.url = urls.find((u) => /jspdf/i.test(u)) || null;
      }
      if (typeof html2canvas !== 'undefined') {
        status.html2canvas.loaded = true;
        status.html2canvas.source = label;
        status.html2canvas.url =
          urls.find((u) => /html2canvas/i.test(u)) || null;
      }
      return typeof jspdf !== 'undefined' && typeof html2canvas !== 'undefined';
    }

    let ok = false;
    let lastErr = null;
    for (const label of order) {
      try {
        ok = await tryLoadFrom(label);
        if (ok) break;
      } catch (e) {
        lastErr = e;
        if (label === 'cdn') status.cdn.error = status.cdn.error || e;
        dlog(`Source failed: ${label}`, e?.message || e);
      }
    }

    if (!ok) {
      const err = lastErr || new Error('No library source succeeded');
      status.jspdf.error = status.jspdf.error || err;
      status.html2canvas.error = status.html2canvas.error || err;
      return false;
    }

    librariesLoaded = true;
    return true;
  }

  // ---------------------------
  // Inline chat helpers
  // ---------------------------
  function showExportTypingIndicator() {
    const chat = document.getElementById('chat-messages');
    if (!chat) return;
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
    const chat = document.getElementById('chat-messages');
    const typing = chat && chat.querySelector('.typing-message.export-typing');
    if (typing) typing.remove();
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

  // ---------------------------
  // Export pipeline
  // ---------------------------
  async function exportChat() {
    if (exportInProgress) return;
    exportInProgress = true;
    showExportTypingIndicator();

    // Platform detection - do this early so it's available throughout
    const ua = (navigator && navigator.userAgent) || '';
    const isIOS =
      /iP(hone|ad|od)/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // We capture previous overflow values in the outer scope to guarantee restoration
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prevHtmlOverflowX = htmlEl.style.overflowX;
    const prevBodyOverflowX = bodyEl.style.overflowX;

    // Offscreen container that html2canvas will render
    let pdfContent = null;

    try {
      const forced =
        (window.ChatExport && window.ChatExport.preferSource) || '';
      const preferCdnDefault =
        typeof forced === 'string' && forced.toLowerCase() === 'cdn';
      let loaded = await loadLibraries({
        preferCdn: preferCdnDefault,
        reload: false,
      });
      if (!loaded)
        loaded = await loadLibraries({ preferCdn: true, reload: true });
      if (!loaded)
        throw new Error(
          'Required libraries (jsPDF or html2canvas) could not be loaded'
        );

      const { jsPDF } = jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      addHeaderToDocument(doc);

      const chatContainer = document.getElementById('chat-messages');
      if (!chatContainer) throw new Error('Chat messages container not found');

      // Freeze horizontal scroll to avoid layout shift
      htmlEl.style.overflowX = 'hidden';
      bodyEl.style.overflowX = 'hidden';

      // Build a single offscreen container
      pdfContent = document.createElement('div');
      pdfContent.id = 'pdf-export-content';
      pdfContent.style.width = '760px';
      pdfContent.style.padding = '40px';
      pdfContent.style.backgroundColor = '#fff';
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
      
      // iOS-specific optimizations
      if (isIOS) {
        pdfContent.style.webkitBackfaceVisibility = 'hidden';
        pdfContent.style.webkitPerspective = '1000px';
        pdfContent.style.webkitTransform = 'translate3d(0,0,0)';
        pdfContent.style.isolation = 'isolate';
        // Reduce complexity for iOS
        pdfContent.style.textRendering = 'optimizeSpeed';
        pdfContent.style.fontSmooth = 'never';
        pdfContent.style.webkitFontSmoothing = 'none';
      }

      // Style once for code and lists to match chat look
      const globalStyle = document.createElement('style');
      globalStyle.textContent = `
        #pdf-export-content pre {
          background-color: #f6f8fa;
          border-radius: 6px;
          padding: 12px;
          overflow-x: auto;
          font-family: monospace;
          font-size: 13px;
          line-height: 1.45;
          margin: 10px 0;
          ${isIOS ? 'will-change: auto; transform: translateZ(0);' : ''}
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
        #pdf-export-content li { margin-bottom: 6px; }
        #pdf-export-content p { margin: 0 0 10px 0; }
        #pdf-export-content a { color: #0366d6; text-decoration: underline; }
        ${isIOS ? `
        #pdf-export-content * {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
        #pdf-export-content img {
          image-rendering: -webkit-optimize-contrast;
          max-width: 100%;
          height: auto;
        }
        ` : ''}
      `;
      pdfContent.appendChild(globalStyle);

      // Collect messages
      const messages = Array.from(chatContainer.children).filter(
        (el) =>
          el.classList.contains('message') &&
          !el.classList.contains('typing-message') &&
          !el.classList.contains('welcome-message')
      );

      const messageTexts = messages.map((m) => {
        const isUser = m.classList.contains('user');
        const contentEl = m.querySelector('.message-content');
        const text = contentEl
          ? (contentEl.innerText || contentEl.textContent || '').trim()
          : '';
        return { role: isUser ? 'You' : 'Assistant', text };
      });

      if (messages.length === 0) {
        pdfContent.innerHTML +=
          '<p style="text-align:center;color:#666;padding:20px;">No messages to export.</p>';
      } else {
        messages.forEach((m) => {
          const el = createMessageElement(m);
          if (el) pdfContent.appendChild(el);
        });
      }

      document.body.appendChild(pdfContent);

      // Give the browser a beat to layout and load fonts
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      
      // Longer delay for iOS to ensure proper layout
      const layoutDelay = isIOS ? 500 : 300;
      await delay(layoutDelay);
      
      if (
        document.fonts &&
        document.fonts.ready &&
        typeof document.fonts.ready.then === 'function'
      ) {
        dlog('Waiting on fonts.ready with timeout');
        const fontTimeout = isIOS ? 2000 : 1200;
        await Promise.race([document.fonts.ready, delay(fontTimeout)]);
      }
      void pdfContent.offsetHeight; // reflow
      
      // Additional iOS stabilization delay
      if (isIOS) {
        await delay(200);
      }

      // Platform tuning with iOS memory optimization
      const vw = window.innerWidth || 0;
      
      // Detect device memory constraints
      const deviceMemory = navigator.deviceMemory || 4; // Default to 4GB if unknown
      const isLowMemory = deviceMemory <= 2 || isIOS;
      
      // More aggressive scaling for iOS to reduce memory pressure
      const baseScale = isIOS 
        ? (vw <= 480 ? 0.8 : 0.9) 
        : (vw <= 480 ? 1.0 : 1.15);

      // Mark all imgs CORS safe to reduce taint risk
      try {
        pdfContent.querySelectorAll('img').forEach((img) => {
          if (!img.getAttribute('crossorigin'))
            img.setAttribute('crossorigin', 'anonymous');
        });
      } catch {}

      const attempts = isIOS
        ? [
            { scale: 0.75, width: 600, pad: 24, timeout: 8000, maxSliceHeight: 800 },
            { scale: 0.7, width: 580, pad: 22, timeout: 8000, maxSliceHeight: 700 },
            { scale: 0.65, width: 560, pad: 20, timeout: 7500, maxSliceHeight: 600 },
            { scale: 0.6, width: 540, pad: 18, timeout: 7000, maxSliceHeight: 500 },
            { scale: 0.55, width: 520, pad: 16, timeout: 6500, maxSliceHeight: 400 },
          ]
        : [
            { scale: baseScale, width: 760, pad: 40, timeout: 7000, maxSliceHeight: 1200 },
            { scale: baseScale - 0.1, width: 720, pad: 34, timeout: 6500, maxSliceHeight: 1100 },
            { scale: 1.0, width: 680, pad: 30, timeout: 6500, maxSliceHeight: 1000 },
            { scale: 0.9, width: 640, pad: 26, timeout: 6000, maxSliceHeight: 900 },
          ];

      // Page metrics
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = { top: 15, right: 15, bottom: 15, left: 15 };
      const firstPageContentTop = 30;
      const contentWidthMm = pageWidth - margins.left - margins.right;

      async function attemptRenderSlice({ scale, timeoutMs, y, heightPx }) {
        try {
          const widthPx = pdfContent.clientWidth;
          
          // Force garbage collection on iOS before rendering
          if (isIOS && window.gc) {
            try {
              window.gc();
            } catch {}
          }
          
          dtimeStart(`render-slice:${y}:${heightPx}:s${scale}`);
          
          // iOS-specific canvas options for better compatibility
          const canvasOptions = {
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
            // iOS-specific optimizations
            allowTaint: false,
            foreignObjectRendering: false,
            imageTimeout: isIOS ? 5000 : 15000,
            onclone: isIOS ? (clonedDoc) => {
              // Remove heavy elements that might cause issues on iOS
              try {
                const videos = clonedDoc.querySelectorAll('video, iframe, embed, object');
                videos.forEach(v => v.remove());
                
                // Simplify complex CSS that might cause rendering issues
                const style = clonedDoc.createElement('style');
                style.textContent = `
                  * { 
                    box-shadow: none !important; 
                    text-shadow: none !important;
                    filter: none !important;
                    backdrop-filter: none !important;
                  }
                `;
                clonedDoc.head.appendChild(style);
              } catch {}
              return clonedDoc;
            } : undefined,
          };
          
          const renderPromise = html2canvas(pdfContent, canvasOptions);
          const canvas = await Promise.race([
            renderPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('render-timeout')), timeoutMs)
            ),
          ]);
          dtimeEnd(`render-slice:${y}:${heightPx}:s${scale}`);
          return canvas || null;
        } catch (e) {
          dlog('attemptRenderSlice error:', e?.message || e);
          return null;
        }
      }

      let success = false;

      for (let i = 0; i < attempts.length && !success; i++) {
        const cfg = attempts[i];
        pdfContent.style.width = cfg.width + 'px';
        pdfContent.style.padding = cfg.pad + 'px';
        void pdfContent.offsetHeight;

        const contentWidthPx = pdfContent.clientWidth || cfg.width;
        const mmPerPx = contentWidthMm / contentWidthPx;
        const firstPageContentHeightMm =
          pageHeight - firstPageContentTop - margins.bottom;
        const nextPageContentHeightMm =
          pageHeight - margins.top - margins.bottom;
        
        // iOS-specific slice height limits to prevent memory issues
        const maxSliceHeightPx = cfg.maxSliceHeight || 1000;
        const firstSliceHeightPx = Math.min(
          maxSliceHeightPx,
          Math.max(200, Math.floor(firstPageContentHeightMm / mmPerPx))
        );
        const sliceHeightPx = Math.min(
          maxSliceHeightPx,
          Math.max(200, Math.floor(nextPageContentHeightMm / mmPerPx))
        );
        const totalHeightPx = Math.max(
          pdfContent.scrollHeight,
          firstSliceHeightPx
        );

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
            
            // Convert canvas to JPEG with quality optimization for iOS
            const quality = isIOS ? 0.8 : 0.92;
            doc.addImage(
              canvas,
              'JPEG',
              margins.left,
              drawYmm,
              contentWidthMm,
              sliceHeightMm,
              undefined,
              'MEDIUM',
              0,
              quality
            );
          } finally {
            // Aggressive canvas cleanup for iOS memory management
            try {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
              canvas.width = 1;
              canvas.height = 1;
            } catch {}
            try {
              canvas.remove();
            } catch {}
            
            // Force cleanup on iOS
            if (isIOS) {
              setTimeout(() => {
                if (window.gc) {
                  try { window.gc(); } catch {}
                }
              }, 100);
            }
          }
        };

        try {
          let offsetPx = 0;
          const h0 = Math.min(firstSliceHeightPx, totalHeightPx);
          await renderAndAdd(offsetPx, h0, true);
          offsetPx += h0;

          while (offsetPx < totalHeightPx) {
            doc.addPage();
            const remainingPx = totalHeightPx - offsetPx;
            const h = Math.min(sliceHeightPx, remainingPx);
            await renderAndAdd(offsetPx, h, false);
            offsetPx += h;
            
            // iOS memory management: small delay between slices
            if (isIOS && offsetPx < totalHeightPx) {
              await delay(150);
            }
          }
          success = true;
        } catch (err) {
          dlog('Slice attempt failed', err?.message || err);
          // Reset document to header-only
          try {
            const total = doc.getNumberOfPages && doc.getNumberOfPages();
            if (total && total > 1) {
              for (let p = total; p > 1; p--) doc.deletePage(p);
            }
            doc.setFillColor(255, 255, 255);
            doc.rect(
              margins.left,
              firstPageContentTop,
              contentWidthMm,
              pageHeight - firstPageContentTop - margins.bottom,
              'F'
            );
          } catch {}
          
          // Longer recovery delay for iOS
          const recoveryDelay = isIOS ? 300 : 120;
          await new Promise((r) => setTimeout(r, recoveryDelay));
        }
      }

      if (!success) {
        dlog('All slice attempts failed. Falling back to transcript-only PDF');
        addTranscriptToPdf(doc, messageTexts);
      }

      // Emit blob link into chat
      const date = new Date().toISOString().slice(0, 10);
      const filename = `Chat-Corey-Lawrence-${date}.pdf`;

      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);

        hideExportTypingIndicator();
        appendChatMessage(
          `<span>PDF ready:</span> <a href="${url}" target="_blank" rel="noopener noreferrer" download="${filename}">Download PDF</a>`
        );

        const revokeSafely = () => {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        };
        const chat = document.getElementById('chat-messages');
        if (chat) {
          const lastLink = chat.querySelector(
            '.message.ai:last-child .message-content a[href^="blob:"]'
          );
          if (lastLink) {
            lastLink.addEventListener(
              'click',
              () => {
                setTimeout(revokeSafely, 45000);
              },
              { once: true }
            );
          }
        }
        setTimeout(revokeSafely, isIOS ? 2 * 60 * 1000 : 10 * 60 * 1000);
      } catch {
        hideExportTypingIndicator();
        appendChatMessage('PDF export failed. Please try again.');
      }
    } catch (error) {
      dlog('exportChat error:', error?.message || error);
      hideExportTypingIndicator();
      appendChatMessage('PDF export failed. Please try again.');
    } finally {
      // Cleanup offscreen DOM and restore overflow no matter what
      try {
        if (pdfContent) {
          try {
            pdfContent.replaceChildren();
          } catch {}
          if (pdfContent.parentNode)
            pdfContent.parentNode.removeChild(pdfContent);
        }
      } catch {}
      try {
        htmlEl.style.overflowX = prevHtmlOverflowX;
        bodyEl.style.overflowX = prevBodyOverflowX;
      } catch {}
      exportInProgress = false;
    }
  }

  // ---------------------------
  // Helpers
  // ---------------------------
  function addTranscriptToPdf(doc, messageTexts = []) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 6;
    let cursorY = 30;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    function drawLines(text, isUser) {
      doc.setFont('helvetica', isUser ? 'bold' : 'normal');
      doc.setFontSize(11);
      doc.setTextColor(isUser ? 10 : 30, isUser ? 102 : 30, isUser ? 194 : 30);
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const ln of lines) {
        if (cursorY + lineHeight > pageHeight - margin) {
          doc.addPage();
          doc.setDrawColor(200, 200, 200);
          doc.line(15, 28, pageWidth - 15, 28);
          cursorY = 30;
        }
        doc.text(ln, margin, cursorY);
        cursorY += lineHeight;
      }
      cursorY += 2;
    }

    messageTexts.forEach((m) => {
      const prefix = m.role === 'You' ? 'You: ' : 'Assistant: ';
      drawLines(prefix + (m.text || ''), m.role === 'You');
    });
  }

  function createMessageElement(originalMessage) {
    const isUser = originalMessage.classList.contains('user');
    const isAI = originalMessage.classList.contains('ai');
    if (!isUser && !isAI) return null;

    const contentEl = originalMessage.querySelector('.message-content');
    if (!contentEl) return null;

    const box = document.createElement('div');
    box.style.marginBottom = '16px';
    box.style.maxWidth = '100%';
    box.style.padding = '12px 16px';

    if (isUser) {
      box.style.borderRadius = '18px';
      box.style.backgroundColor = '#0078d7';
      box.style.color = '#fff';
      box.style.alignSelf = 'flex-end';
      box.style.width = 'auto';
      box.style.maxWidth = '80%';
      box.style.marginLeft = 'auto';
      box.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
    } else {
      box.style.backgroundColor = '#fff';
      box.style.color = '#333';
      box.style.width = '98%';
      box.style.borderBottom = '1px solid #f0f0f0';
    }

    const content = document.createElement('div');
    content.style.lineHeight = '1.5';
    content.style.wordBreak = 'break-word';
    content.style.fontSize = '14px';

    if (isUser) {
      content.textContent = contentEl.textContent;
    } else {
      content.innerHTML = contentEl.innerHTML;
    }

    box.appendChild(content);
    return box;
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

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 28, pageWidth - 15, 28);
  }

  // ---------------------------
  // Init and public API
  // ---------------------------
  function init() {
    const exportButton = document.getElementById('download-pdf-btn');
    if (!exportButton) {
      console.warn('PDF export button not found');
      return;
    }
    const newButton = exportButton.cloneNode(true);
    if (exportButton.parentNode)
      exportButton.parentNode.replaceChild(newButton, exportButton);
    newButton.addEventListener('click', exportChat);
    dlog('Init complete. Click handler bound.');
  }

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

      // Source preference: "cdn" | "vendor" | "local"
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

    if (typeof window.ChatExport._debug === 'undefined') {
      window.ChatExport._debug = true;
    }
  } catch {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
