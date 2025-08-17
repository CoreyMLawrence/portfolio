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
        description: 'Advanced airline scheduling simulator with profit optimization algorithms',
        technologies: ['Python', 'JavaScript', 'HTML', 'CSS'],
        link: 'https://github.com/CoreyMLawrence/Comfort-Airlines'
      },
      {
        id: 'music-player',
        title: 'Music Player PWA',
        subtitle: 'Progressive Web App',
        image: '../assets/images/music-main.webp',
        description: 'Offline-capable music player with dynamic preloading and Media Session API',
        technologies: ['JavaScript', 'HTML', 'CSS'],
        link: 'https://coreylawrencemusic.duckdns.org'
      },
      {
        id: 'devolve',
        title: 'DevolveAI',
        subtitle: 'AI-Powered Decompiler',
        image: '../assets/images/devolveAI.webp',
        description: 'AI tool that turns executables into readable code with simple web interface',
        technologies: ['Python', 'Gemini AI', 'JavaScript', 'PHP'],
        link: 'https://github.com/CoreyMLawrence'
      },
      {
        id: 'adventureai-player',
        title: 'AdventureAI',
        subtitle: 'AI-Powered Adventure Game',
        image: '../assets/images/AdventureAI-full.webp',
        description: 'Choose-your-own-adventure game with dynamic storytelling and AI integration',
        technologies: ['JavaScript', 'Gemini AI', 'HTML', 'CSS'],
        link: 'https://adventureai.duckdns.org/'
      }
    ];
  }

  // Generate the AI prompt instructions for project cards
  getProjectInstructions() {
    if (this.projectCardsShown) {
      return ""; // No project functionality after first use
    }

    const projectIds = this.projectsData.map(p => p.id).join(', ');
    const projectNames = this.projectsData.map(p => p.title).join(', ');
    
    return ` You can display interactive project cards anywhere in your response using these tokens:
- [[ACTION:SHOW_PROJECTS]] - Shows all project cards
- [[ACTION:SHOW_PROJECT:project-id]] - Shows a specific project card

Available project IDs: ${projectIds}
Project names: ${projectNames}

Use these tokens anywhere in your response where you want cards to appear. For example, you can mention a project in text and then insert its card token on the next line. Only use valid project IDs - invalid IDs will be ignored.`;
  }

  // Parse and process project action tokens
  processProjectTokens(text) {
    const actions = [];
    const actionData = {};
    const validTokens = [];
    
    if (!text) return { visibleText: '', actions, actionData, validTokens };

    let processedText = text;
    
    // Find all project tokens in the text (not just at the end)
    const projectTokenRegex = /\[\[ACTION:(SHOW_PROJECTS|SHOW_PROJECT):?([^\]]*)\]\]/g;
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
        if (param && this.projectsData.find(p => p.id === param)) {
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
      validTokens 
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
    const cardsHtml = projects.map(project => this.createProjectCard(project)).join('');
    return `
      <div class="project-cards-grid">
        ${cardsHtml}
      </div>
    `;
  }

  // Inject project cards into message content
  injectProjectCards(contentEl, text, actions, actionData) {
    if (!actions.length) return;

    // Process the text to find where tokens were and replace with cards
    let processedHTML = contentEl.innerHTML;
    
    if (actions.includes('SHOW_PROJECTS')) {
      const cardsHtml = this.createProjectCardsGrid(this.projectsData);
      // Find and replace the token placeholder or append at the end
      if (processedHTML.includes('[[ACTION:SHOW_PROJECTS]]')) {
        processedHTML = processedHTML.replace('[[ACTION:SHOW_PROJECTS]]', cardsHtml);
      } else {
        processedHTML += cardsHtml;
      }
      this.projectCardsShown = true;
    }

    if (actions.includes('SHOW_PROJECT') && actionData.SHOW_PROJECT) {
      actionData.SHOW_PROJECT.forEach(projectId => {
        const project = this.projectsData.find(p => p.id === projectId);
        if (project) {
          const cardHtml = this.createProjectCardsGrid([project]);
          const tokenPattern = `[[ACTION:SHOW_PROJECT:${projectId}]]`;
          if (processedHTML.includes(tokenPattern)) {
            processedHTML = processedHTML.replace(tokenPattern, cardHtml);
          } else {
            processedHTML += cardHtml;
          }
        }
      });
      this.projectCardsShown = true;
    }

    contentEl.innerHTML = processedHTML;
  }

  // Reset the cards shown flag (called when chat is cleared)
  reset() {
    this.projectCardsShown = false;
  }

  // Check if cards have been shown
  hasShownCards() {
    return this.projectCardsShown;
  }

  // Get all project IDs for validation
  getValidProjectIds() {
    return this.projectsData.map(p => p.id);
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
