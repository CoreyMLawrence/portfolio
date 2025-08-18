// Project Cards System for Chat Interface
// Handles dynamic project card injection with token-based AI integration

class ProjectCardsManager {
  constructor() {
    this.projectCardsShown = false;
    this.projectsData = this.loadProjectsData();
  }

  // Load projects data from the main portfolio page
  loadProjectsData() {
    return [
      {
        id: 'comfort-airlines',
        title: 'Comfort Airlines',
        subtitle: 'Airline Simulator',
        image: '../assets/images/comfort-airlines.webp',
        description:
          'Advanced airline scheduling simulator with profit optimization algorithms',
        technologies: ['Python', 'JavaScript', 'HTML', 'CSS'],
        link: 'https://github.com/CoreyMLawrence/Comfort-Airlines',
      },
      {
        id: 'music-player',
        title: 'Music Player PWA',
        subtitle: 'Progressive Web App',
        image: '../assets/images/CoreyLawrenceMusic.webp',
        description:
          'Offline-capable music player with dynamic preloading and Media Session API',
        technologies: ['JavaScript', 'HTML', 'CSS'],
        link: 'https://coreylawrencemusic.duckdns.org',
      },
      {
        id: 'devolve',
        title: 'DevolveAI',
        subtitle: 'AI-Powered Decompiler',
        image: '../assets/images/devolveAI.webp',
        description:
          'AI tool that turns executables into readable code with simple web interface',
        technologies: ['Python', 'Gemini AI', 'JavaScript', 'PHP'],
        link: 'https://github.com/CoreyMLawrence',
      },
      {
        id: 'adventureai-player',
        title: 'AdventureAI',
        subtitle: 'AI-Powered Adventure Game',
        image: '../assets/images/adventureAI.webp',
        description:
          'Choose-your-own-adventure game with dynamic storytelling and AI integration',
        technologies: ['JavaScript', 'Gemini AI', 'HTML', 'CSS'],
        link: 'https://adventureai.duckdns.org/',
      },
    ];
  }

  // Generate the AI prompt instructions for project cards
  getProjectInstructions() {
    // Always provide project functionality (no longer remove after first use)
    const projectIds = this.projectsData.map((p) => p.id).join(', ');
    const projectNames = this.projectsData.map((p) => p.title).join(', ');

    return ` Project cards are available ONLY when users specifically ask about Corey's projects, portfolio work, or technical examples. Use these tokens ONLY when appropriate:
- [[ACTION:SHOW_PROJECTS]] - Shows all project cards (use when user asks about "projects", "portfolio", "work samples", or "what has Corey built")
- [[ACTION:SHOW_PROJECT:project-id]] - Shows a specific project card (use when user mentions a specific project by name)

Available project IDs: ${projectIds}
Project names: ${projectNames}

DO NOT use these tokens for:
- General resume/career discussions
- Job requirements/skills questions  
- Interview preparation
- General conversation about Corey's background

ONLY use these tokens when the user explicitly asks about Corey's projects, portfolio work, or wants to see examples of what he has built. Only use valid project IDs - invalid IDs will be ignored.`;
  }

  // Parse and process project action tokens
  processProjectTokens(text) {
    const actions = [];
    const actionData = {};
    const validTokens = [];

    if (!text) return { visibleText: '', actions, actionData, validTokens };

    let processedText = text;

    // Find all project tokens in the text (not just at the end)
    const projectTokenRegex =
      /\[\[ACTION:(SHOW_PROJECTS|SHOW_PROJECT):?([^\]]*)\]\]/g;
    let match;

    while ((match = projectTokenRegex.exec(text)) !== null) {
      const action = match[1];
      const param = match[2];

      if (action === 'SHOW_PROJECTS') {
        if (!actions.includes('SHOW_PROJECTS')) {
          actions.push('SHOW_PROJECTS');
          validTokens.push(match[0]);
        }
      } else if (action === 'SHOW_PROJECT') {
        // Validate project ID
        if (param && this.projectsData.find((p) => p.id === param)) {
          if (!actions.includes('SHOW_PROJECT')) {
            actions.push('SHOW_PROJECT');
            actionData['SHOW_PROJECT'] = actionData['SHOW_PROJECT'] || [];
          }
          actionData['SHOW_PROJECT'].push(param);
          validTokens.push(match[0]);
        }
        // Invalid project IDs are ignored (token gets removed but no action taken)
      }
    }

    // Remove all project tokens from the visible text
    processedText = processedText.replace(projectTokenRegex, '').trim();

    return {
      visibleText: processedText,
      actions,
      actionData,
      validTokens,
    };
  }

  // Generate HTML for a single project card
  createProjectCard(project) {
    return `
      <a href="../#${project.id}" target="_blank" class="project-card" rel="noopener">
        <div class="project-card-image">
          <img src="${project.image}" alt="${project.title}" loading="lazy" />
          <div class="project-card-overlay">
            <h3 class="project-card-title">${project.title}</h3>
            <p class="project-card-subtitle">${project.subtitle}</p>
          </div>
        </div>
      </a>
    `;
  }

  // Generate HTML for project cards grid
  createProjectCardsGrid(projects) {
    const cardsHtml = projects
      .map((project) => this.createProjectCard(project))
      .join('');
    return `
      <div class="project-cards-grid">
        ${cardsHtml}
      </div>
    `;
  }

  // Generate HTML for individual cards (without grid wrapper)
  createProjectCardsOnly(projects) {
    return projects.map((project) => this.createProjectCard(project)).join('');
  }

  // Inject project cards into message content
  injectProjectCards(contentEl, text, actions, actionData) {
    if (!actions.length) return;

    // Find or create a single grid container for all cards
    let gridContainer = contentEl.querySelector('.project-cards-grid');
    if (!gridContainer) {
      gridContainer = document.createElement('div');
      gridContainer.className = 'project-cards-grid';
      contentEl.appendChild(gridContainer);
    }

    // Process the text to find where tokens were and replace with cards
    let processedHTML = contentEl.innerHTML;

    if (actions.includes('SHOW_PROJECTS')) {
      const cardsHtml = this.createProjectCardsOnly(this.projectsData);
      // Add cards to the grid container
      gridContainer.insertAdjacentHTML('beforeend', cardsHtml);
      // Remove any token placeholders from the text
      processedHTML = processedHTML.replace(
        /\[\[ACTION:SHOW_PROJECTS\]\]/g,
        ''
      );
      this.projectCardsShown = true;
    }

    if (actions.includes('SHOW_PROJECT') && actionData.SHOW_PROJECT) {
      actionData.SHOW_PROJECT.forEach((projectId) => {
        const project = this.projectsData.find((p) => p.id === projectId);
        if (project) {
          const cardHtml = this.createProjectCard(project);
          // Add card to the grid container
          gridContainer.insertAdjacentHTML('beforeend', cardHtml);
          // Remove token placeholders from the text
          const tokenPattern = `\\[\\[ACTION:SHOW_PROJECT:${projectId}\\]\\]`;
          processedHTML = processedHTML.replace(
            new RegExp(tokenPattern, 'g'),
            ''
          );
        }
      });
      this.projectCardsShown = true;
    }

    // Update the content without the grid (since we added it separately)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedHTML;
    // Remove any grid containers from the processed HTML to avoid duplicates
    const existingGrids = tempDiv.querySelectorAll('.project-cards-grid');
    existingGrids.forEach((grid) => {
      if (grid !== gridContainer) grid.remove();
    });

    // Only update the text content, keeping our grid container
    const textContent = tempDiv.innerHTML;
    if (textContent.trim()) {
      contentEl.innerHTML = textContent;
      contentEl.appendChild(gridContainer);
    }
  }

  // Reset any temporary state (called when chat is cleared)
  reset() {
    // Note: We no longer disable functionality after first use
    // This method is kept for future state management if needed
    this.projectCardsShown = false;
  }

  // Check if cards have been shown (for analytics/tracking)
  hasShownCards() {
    return this.projectCardsShown;
  }

  // Get all project IDs for validation
  getValidProjectIds() {
    return this.projectsData.map((p) => p.id);
  }

  // Add a new project (for future extensibility)
  addProject(projectData) {
    this.projectsData.push(projectData);
  }

  // Update project data (for dynamic loading)
  updateProjects(newProjectsData) {
    this.projectsData = newProjectsData;
  }
}

// Export for use in chat interface
window.ProjectCardsManager = ProjectCardsManager;
