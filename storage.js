// Storage utility for managing projects

const storage = {
  async getProjects() {
    const result = await chrome.storage.local.get(['projects']);
    return result.projects || [];
  },

  async saveProjects(projects) {
    await chrome.storage.local.set({ projects });
  },

  async addProject(project) {
    const projects = await this.getProjects();
    const newProject = {
      ...project,
      pinned: false,
      lastUpdated: Date.now(),
      createdAt: Date.now()
    };
    projects.push(newProject);
    await this.saveProjects(projects);
  },

  async deleteProject(id) {
    const projects = await this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    await this.saveProjects(filtered);
  },

  async updateProject(id, updatedProject) {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { 
        ...projects[index], 
        ...updatedProject,
        lastUpdated: Date.now()
      };
      await this.saveProjects(projects);
    }
  },

  async togglePin(id) {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index].pinned = !projects[index].pinned;
      projects[index].lastUpdated = Date.now();
      await this.saveProjects(projects);
    }
  },

  async updateLastAccessed(id) {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index].lastUpdated = Date.now();
      await this.saveProjects(projects);
    }
  },

  getSortedProjects(projects) {
    return [...projects].sort((a, b) => {
      // First sort by pinned status (pinned first)
      const aPinned = a.pinned || false;
      const bPinned = b.pinned || false;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // Then sort by lastUpdated (most recent first)
      const aTime = a.lastUpdated || a.createdAt || 0;
      const bTime = b.lastUpdated || b.createdAt || 0;
      return bTime - aTime;
    });
  },

  async findProjectByHost(host) {
    const projects = await this.getProjects();
    // Extract store name from host (e.g., "mystore.myshopify.com" -> "mystore")
    const storeName = host.replace('.myshopify.com', '').toLowerCase();
    return projects.find(p => p.storeName.toLowerCase() === storeName);
  }
};

