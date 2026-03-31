import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  theme: localStorage.getItem('mirrasync_theme') || 'dark',
  sidebarOpen: true,
  sidebarCollapsed: false,
  addModelModalOpen: false,
  settingsOpen: false,
  settingsTab: 'general',

  setTheme: (theme) => {
    localStorage.setItem('mirrasync_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  openAddModelModal: () => set({ addModelModalOpen: true }),
  closeAddModelModal: () => set({ addModelModalOpen: false }),

  openSettings: (tab = 'general') => set({ settingsOpen: true, settingsTab: tab }),
  closeSettings: () => set({ settingsOpen: false }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
}));

// Apply saved theme on init
const savedTheme = localStorage.getItem('mirrasync_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

export default useUIStore;
