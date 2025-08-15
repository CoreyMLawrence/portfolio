// Session-only chat cache: persists while the browser/tab stays open.
// Restores chat messages and conversation history across navigations and reloads.
(function () {
  const KEY = 'corey_chat_session_v1';

  function getContainer() {
    return document.getElementById('chat-messages');
  }

  function deriveHistoryFromDom(container) {
    const history = [];
    if (!container) return history;
    container.querySelectorAll('.message').forEach((msg) => {
      const role = msg.classList.contains('user') ? 'user' : 'model';
      const contentEl = msg.querySelector('.message-content');
      const text = (contentEl?.textContent || '').trim();
      if (text) {
        const entry = { role, text };
        // Include markdown for AI messages if available
        if (role === 'model') {
          const markdown = msg.getAttribute('data-markdown');
          if (markdown) {
            entry.markdown = markdown;
          }
        }
        history.push(entry);
      }
    });
    return history;
  }

  function serialize(container) {
    if (!container) return;
    // Clone and remove ephemeral nodes (typing indicators)
    const clone = container.cloneNode(true);
    clone.querySelectorAll('.typing-message').forEach((n) => n.remove());
    const html = clone.innerHTML;
    const history = deriveHistoryFromDom(clone);
    const payload = { html, history, ts: Date.now() };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(payload));
    } catch (e) {
      // Best-effort; ignore quota errors
      console.warn('Session cache save failed:', e);
    }
  }

  function restore(container) {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && typeof data.html === 'string' && container) {
        container.innerHTML = data.html;
        // Scroll to bottom of restored conversation
        container.scrollTop = container.scrollHeight;
      }
      const history = Array.isArray(data?.history) ? data.history : [];
      // Notify chat code to hydrate its in-memory history
      document.dispatchEvent(
        new CustomEvent('chat:session-restored', { detail: { history } })
      );
      return history;
    } catch (e) {
      console.warn('Session cache restore failed:', e);
      return null;
    }
  }

  function clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  }

  function init() {
    const container = getContainer();
    if (!container) return;

    // Restore immediately on load
    restore(container);

    // Observe changes and persist with light debounce
    let t;
    const observer = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => serialize(container), 100);
    });
    observer.observe(container, { childList: true, subtree: true });

    // Wire the trash button to also clear session cache
    const clearBtn = document.querySelector('.action-btn[title="Clear Chat"]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => clear());
    }

    // Expose a tiny API if needed
    window.ChatSessionCache = {
      saveNow: () => serialize(container),
      restore: () => restore(container),
      clear,
      getCachedHistory: () => {
        try {
          const raw = sessionStorage.getItem(KEY);
          if (!raw) return [];
          const data = JSON.parse(raw);
          return Array.isArray(data?.history) ? data.history : [];
        } catch (e) {
          console.warn('Failed to get cached history:', e);
          return [];
        }
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
