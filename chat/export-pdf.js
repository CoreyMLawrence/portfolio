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
  async function loadLibraries() {
    if (librariesLoaded) return true;

    try {
      // Check if libraries are already loaded
      if (typeof jspdf !== 'undefined' && typeof html2canvas !== 'undefined') {
        librariesLoaded = true;
        return true;
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

      // Load both libraries
      await Promise.all([
        loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        ),
        loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        ),
      ]);

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

  // Format contact URLs for display
  function formatUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return (
        u.host.replace(/^www\./, '') + (u.pathname === '/' ? '' : u.pathname)
      );
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
  }

  // Create a styled notification element that shows export progress
  function createNotification(text, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'pdf-export-notification';
    notification.textContent = text;

    // Style the notification
    const style = {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      borderRadius: '4px',
      zIndex: '9999',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease',
    };

    // Set background color based on type
    if (type === 'error') {
      style.backgroundColor = '#dc3545';
    } else if (type === 'success') {
      style.backgroundColor = '#28a745';
    } else {
      style.backgroundColor = '#007bff';
    }

    // Apply styles
    Object.assign(notification.style, style);

    // Add to document
    document.body.appendChild(notification);

    return notification;
  }

  // Main export function that generates a PDF from the chat content
  async function exportChat() {
    // Prevent multiple exports running simultaneously
    if (exportInProgress) return;
    exportInProgress = true;

    // Create initial notification
    const notification = createNotification('Preparing PDF export...');

    try {
      // First load the libraries
      const loaded = await loadLibraries();
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

      // Prepare for PDF export by creating a clone of the messages
      notification.textContent = 'Capturing chat content...';

      // Create a container for the cloned content with chat-like styling
      const pdfContent = document.createElement('div');
      pdfContent.id = 'pdf-export-content';
      pdfContent.style.width = '210mm';
      pdfContent.style.padding = '15mm';
      pdfContent.style.backgroundColor = '#fff';
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.top = '0';
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

      // Convert to canvas
      notification.textContent = 'Converting to PDF...';

      // Wait a moment for rendering
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Use html2canvas to capture the content
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

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

      // Generate filename with current date
      const date = new Date().toISOString().slice(0, 10);
      const filename = `Chat-Corey-Lawrence-${date}.pdf`;

      // Save the PDF
      doc.save(filename);

      // Show success notification
      notification.textContent = 'PDF saved successfully!';
      notification.style.backgroundColor = '#28a745';

      // Clean up
      if (pdfContent && pdfContent.parentNode) {
        pdfContent.parentNode.removeChild(pdfContent);
      }

      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      notification.textContent = 'PDF export failed. Please try again.';
      notification.style.backgroundColor = '#dc3545';
    } finally {
      // Remove notification after delay
      setTimeout(() => {
        if (notification && notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        exportInProgress = false;
      }, 3000);
    }
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
