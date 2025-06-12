import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ipcRenderer } from 'electron';

interface Tab {
  id: string;
  title: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  container: HTMLElement;
}

const tabs = new Map<string, Tab>();
let activeTabId: string | null = null;

function createTerminal(): Terminal {
  return new Terminal({
    fontFamily: 'SF Mono, Monaco, Inconsolata, "Courier New", monospace',
    fontSize: 14,
    theme: {
      background: 'transparent',
      foreground: 'rgba(255, 255, 255, 0.95)',
      cursor: 'rgba(255, 255, 255, 0.9)',
      cursorAccent: 'rgba(0, 0, 0, 0.5)',
      selectionBackground: 'rgba(255, 255, 255, 0.25)',
      selectionForeground: 'rgba(0, 0, 0, 0.9)',
      black: 'rgba(0, 0, 0, 0.8)',
      red: '#ff6b6b',
      green: '#51cf66',
      yellow: '#ffd93d',
      blue: '#6c92ff',
      magenta: '#ff6ac1',
      cyan: '#5fcde4',
      white: 'rgba(255, 255, 255, 0.95)',
      brightBlack: 'rgba(100, 100, 100, 0.8)',
      brightRed: '#ff8787',
      brightGreen: '#6eddd6',
      brightYellow: '#fff59d',
      brightBlue: '#8fa4ff',
      brightMagenta: '#ff92d0',
      brightCyan: '#9aedfe',
      brightWhite: '#ffffff'
    },
    cursorBlink: true,
    cursorStyle: 'bar',
    allowTransparency: true,
    macOptionIsMeta: true,
    drawBoldTextInBrightColors: false
  });
}

async function createTab() {
  const { id, title } = await ipcRenderer.invoke('terminal-create');
  
  const terminal = createTerminal();
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  
  // Skip WebGL addon for now to ensure transparency works
  // const webglAddon = new WebglAddon();
  // terminal.loadAddon(webglAddon);
  
  const container = document.createElement('div');
  container.className = 'terminal-container terminal-glass';
  container.style.display = 'none';
  document.getElementById('terminals')!.appendChild(container);
  
  terminal.open(container);
  
  // Force transparent background after opening
  const xtermElement = container.querySelector('.xterm');
  if (xtermElement) {
    (xtermElement as HTMLElement).style.background = 'transparent';
  }
  
  fitAddon.fit();
  
  const tab: Tab = {
    id,
    title,
    terminal,
    fitAddon,
    container
  };
  
  tabs.set(id, tab);
  
  // Handle terminal data
  terminal.onData(data => {
    ipcRenderer.send('terminal-data', id, data);
  });
  
  // Handle data from PTY
  ipcRenderer.on(`terminal-data-${id}`, (_event, data) => {
    terminal.write(data);
  });
  
  // Handle terminal resize
  terminal.onResize(({ cols, rows }) => {
    ipcRenderer.send('terminal-resize', id, cols, rows);
  });
  
  // Handle process title changes
  ipcRenderer.on(`terminal-title-${id}`, (_event, newTitle) => {
    tab.title = newTitle;
    updateTabUI();
    updateWindowTitle();
  });
  
  // Handle PTY exit
  ipcRenderer.on(`terminal-exit-${id}`, () => {
    closeTab(id);
  });
  
  // Add tab to UI
  addTabToUI(tab);
  
  // Make this tab active
  switchToTab(id);
  
  return tab;
}

function addTabToUI(tab: Tab) {
  const tabBar = document.getElementById('tab-bar')!;
  
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.tabId = tab.id;
  tabElement.innerHTML = `
    <span class="tab-title">${tab.title}</span>
    <button class="tab-close" data-tab-id="${tab.id}">×</button>
  `;
  
  tabElement.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).classList.contains('tab-close')) {
      switchToTab(tab.id);
    }
  });
  
  tabElement.querySelector('.tab-close')!.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tab.id);
  });
  
  tabBar.appendChild(tabElement);
  
  // Update tab bar visibility
  updateTabBarVisibility();
}

function updateTabUI() {
  const tabBar = document.getElementById('tab-bar')!;
  tabs.forEach(tab => {
    const tabElement = tabBar.querySelector(`[data-tab-id="${tab.id}"]`);
    if (tabElement) {
      const titleElement = tabElement.querySelector('.tab-title');
      if (titleElement) {
        titleElement.textContent = tab.title;
      }
    }
  });
}

function switchToTab(id: string) {
  const tab = tabs.get(id);
  if (!tab) return;
  
  // Hide all terminals
  tabs.forEach(t => {
    t.container.style.display = 'none';
  });
  
  // Update tab UI
  document.querySelectorAll('.tab').forEach(el => {
    el.classList.remove('active');
  });
  
  // Show selected terminal
  tab.container.style.display = 'block';
  document.querySelector(`[data-tab-id="${id}"]`)?.classList.add('active');
  
  activeTabId = id;
  tab.terminal.focus();
  tab.fitAddon.fit();
  
  updateWindowTitle();
}

function closeTab(id: string) {
  const tab = tabs.get(id);
  if (!tab) return;
  
  // Remove from UI
  document.querySelector(`[data-tab-id="${id}"]`)?.remove();
  
  // Clean up terminal
  tab.terminal.dispose();
  tab.container.remove();
  
  // Clean up IPC listeners
  ipcRenderer.removeAllListeners(`terminal-data-${id}`);
  ipcRenderer.removeAllListeners(`terminal-title-${id}`);
  ipcRenderer.removeAllListeners(`terminal-exit-${id}`);
  
  // Tell main process to clean up
  ipcRenderer.send('terminal-close', id);
  
  tabs.delete(id);
  
  // Update tab bar visibility
  updateTabBarVisibility();
  
  // If this was the active tab, switch to another
  if (activeTabId === id) {
    const remainingTabs = Array.from(tabs.keys());
    if (remainingTabs.length > 0) {
      switchToTab(remainingTabs[remainingTabs.length - 1]);
    } else {
      // No more tabs, close window
      window.close();
    }
  }
}

function updateWindowTitle() {
  const activeTab = activeTabId ? tabs.get(activeTabId) : null;
  const title = activeTab ? `${activeTab.title} - Liquid Terminal` : 'Liquid Terminal';
  document.title = title;
}

function updateTabBarVisibility() {
  const tabBar = document.getElementById('tab-bar')!;
  const terminalsContainer = document.getElementById('terminals')!;
  
  if (tabs.size > 1) {
    tabBar.style.display = 'flex';
    terminalsContainer.style.marginTop = '0';
  } else {
    tabBar.style.display = 'none';
    terminalsContainer.style.marginTop = '10px';
  }
}

function handleResize() {
  tabs.forEach(tab => {
    if (tab.container.style.display !== 'none') {
      tab.fitAddon.fit();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Create initial tab
  createTab();
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Handle window controls
  document.getElementById('close-btn')?.addEventListener('click', () => {
    ipcRenderer.send('window-close');
  });

  document.getElementById('minimize-btn')?.addEventListener('click', () => {
    ipcRenderer.send('window-minimize');
  });

  document.getElementById('maximize-btn')?.addEventListener('click', () => {
    ipcRenderer.send('window-maximize');
  });
  
  // Handle menu commands
  ipcRenderer.on('new-tab', () => {
    createTab();
  });
  
  ipcRenderer.on('close-tab', () => {
    if (activeTabId) {
      closeTab(activeTabId);
    }
  });
  
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 't') {
      e.preventDefault();
      createTab();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
    }
  });
});