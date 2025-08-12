/*  ai-chat.js  –  vanilla-JS desktop Chat using TinyLlama-1.1B-Chat-v1.0 in a Web Worker
   ---------------------------------------------------------------      */

(async () => {
  // Device check
  const isDesktopEligible = navigator.gpu && (navigator.deviceMemory || 0) >= 8;
  if (!isDesktopEligible) {
    document.getElementById('fit-chat')?.remove();
    console.log('AI chat hidden (mobile / low RAM)');
    return;
  }

  // UI elements
  const section = document.getElementById('fit-chat');
  if (!section) return;
  section.style.display = 'block';
  const chat = document.getElementById('chat-window');
  const box = document.getElementById('jd-box');
  const button = document.getElementById('send-btn');
  if (!chat || !box || !button) return;

  // Spinner
  function showSpinner(msg) {
    let spinner = document.getElementById('ai-spinner');
    if (!spinner) {
      spinner = document.createElement('div');
      spinner.id = 'ai-spinner';
      spinner.style.textAlign = 'center';
      spinner.style.margin = '1em';
      spinner.textContent = msg || 'Loading AI...';
      chat.appendChild(spinner);
    } else {
      spinner.textContent = msg || 'Loading AI...';
    }
  }
  function hideSpinner() {
    const spinner = document.getElementById('ai-spinner');
    if (spinner) spinner.remove();
  }

  // Web Worker setup
  const worker = new Worker('ai-chat-worker.js');
  let aiReady = false;
  let thinkingDiv = null;

  // Detect Safari for dtype compatibility
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const dtype = isSafari ? 'fp32' : 'q4';

  // Load resume
  let resumeTxt = '';
  try {
    resumeTxt = await fetch('resume.txt').then((r) => r.text());
  } catch (e) {
    resumeTxt =
      'Corey Lawrence - Full-stack developer with experience in web development and AI integration.';
  }

  // Prompt builder
  function makePrompt(jobDesc, yamlProfile) {
    return `### user\nBased on the job description below, explain in first-person why Corey is a perfect fit.\n\n${yamlProfile}\n\n${jobDesc}\n\n### assistant\n`;
  }

  // Worker message handler
  worker.onmessage = (e) => {
    const { type, token, output, status, error } = e.data;
    if (type === 'status') {
      showSpinner(status);
    } else if (type === 'ready') {
      aiReady = true;
      hideSpinner();
    } else if (type === 'token') {
      if (thinkingDiv) {
        thinkingDiv.textContent += token;
        chat.scrollTop = chat.scrollHeight;
      }
    } else if (type === 'done') {
      hideSpinner();
      thinkingDiv = null;
    } else if (type === 'error') {
      hideSpinner();
      if (thinkingDiv) thinkingDiv.textContent = 'Error: ' + error;
      thinkingDiv = null;
    }
  };

  // Initialize worker
  showSpinner('Loading AI...');
  worker.postMessage({ type: 'init', dtype });

  // UI event
  button.addEventListener('click', run);
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      run();
    }
  });

  function bubble(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }

  function run() {
    if (!aiReady) {
      showSpinner('AI still loading...');
      return;
    }
    const jd = box.value.trim();
    if (!jd) return;
    box.value = '';
    bubble('me', jd);
    thinkingDiv = bubble('ai', '');
    showSpinner('Thinking...');
    const prompt = makePrompt(jd.slice(0, 1200), resumeTxt.slice(0, 1500));
    worker.postMessage({ type: 'generate', prompt });
  }
})();
