/**
 * Resume Download - Simple direct download link provider
 * Provides a download link to the existing resume PDF file
 */

(function () {
  // Track if download action is in progress to prevent multiple simultaneous requests

  let downloadInProgress = false;

  function getChatSessionId() {
    try {
      const raw = localStorage.getItem('chat_session_ga4');
      if (!raw) return '';
      const session = JSON.parse(raw);
      return session && session.id ? session.id : '';
    } catch (e) {
      return '';
    }
  }

  function trackFileDownload(fileName) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'file_download', {
      file_name: fileName,
      chat_session_id: getChatSessionId(),
    });
  }


  // Inline chat helpers for download status
  function showDownloadTypingIndicator() {
    const chat = document.getElementById('chat-messages');
    if (!chat) return;
    // Avoid duplicates
    if (chat.querySelector('.typing-message.download-typing')) return;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai typing-message download-typing';
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

  function hideDownloadTypingIndicator() {
    try {
      const chat = document.getElementById('chat-messages');
      const typing =
        chat && chat.querySelector('.typing-message.download-typing');
      if (typing) typing.remove();
    } catch {}
  }

  function appendChatMessage(html) {
    const chat = document.getElementById('chat-messages');
    if (!chat) return null;
    const wrap = document.createElement('div');
    wrap.className = 'message ai';
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = html;
    wrap.appendChild(content);
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
    return wrap;
  }

  // Simple resume download: provide direct link to existing PDF
  async function downloadResume() {
    if (downloadInProgress) return;
    downloadInProgress = true;
    showDownloadTypingIndicator();

    try {
      // Resume file path
      const resumePath = '/Corey Lawrence - Tech + Marketing.pdf';

      // Verify the file exists by attempting to fetch its headers
      try {
        const response = await fetch(resumePath, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Resume not found (status: ${response.status})`);
        }
      } catch (fetchError) {
        console.error('Resume file check failed:', fetchError);
        hideDownloadTypingIndicator();
        appendChatMessage(
          'Resume file not available. Please contact Corey directly.'
        );
        return;
      }

      // Show loading indicator briefly, then provide download link
      setTimeout(() => {
        hideDownloadTypingIndicator();
        const linkHtml = `<span>Resume ready:</span> <a href="${resumePath}" target="_blank" rel="noopener noreferrer" download="Corey Lawrence - Product Manager.pdf">Download Resume (PDF)</a>`;
        const messageEl = appendChatMessage(linkHtml);
        const link = messageEl ? messageEl.querySelector('a') : null;
        if (link) {
          const fileName = (resumePath.split('/').pop() || 'resume.pdf').trim();
          link.addEventListener(
            'click',
            () => trackFileDownload(fileName),
            { once: true }
          );
        }
      }, 500); // Shorter delay since no processing is needed
    } catch (error) {
      console.error('Resume download failed:', error);
      hideDownloadTypingIndicator();
      appendChatMessage(
        'Resume download failed. Please try again or contact Corey directly.'
      );
    } finally {
      downloadInProgress = false;
    }
  }

  // Initialize any download button if needed (though this is triggered by hidden actions)
  function init() {
    // No specific button initialization needed since this is triggered by hidden actions
    // But we can add a fallback button handler if one exists
    const downloadButton = document.getElementById('download-resume-btn');
    if (downloadButton) {
      // Replace button to remove any existing listeners
      const newButton = downloadButton.cloneNode(true);
      if (downloadButton.parentNode) {
        downloadButton.parentNode.replaceChild(newButton, downloadButton);
      }
      // Add click handler
      newButton.addEventListener('click', () => {
        showDownloadTypingIndicator();
        setTimeout(() => {
          hideDownloadTypingIndicator();
          downloadResume();
        }, 250);
      });
    }
  }

  // Expose a global API for other scripts to trigger download
  try {
    window.ResumeDownload = Object.assign({}, window.ResumeDownload, {
      downloadResume,
      isDownloading: () => !!downloadInProgress,
    });
  } catch {}

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
