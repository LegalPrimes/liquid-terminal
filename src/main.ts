import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import * as os from 'os';
import * as pty from 'node-pty';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-shell', () => {
  return process.env.SHELL || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash');
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

interface TerminalSession {
  pty: pty.IPty;
  title: string;
  processName: string;
}

const terminals = new Map<string, TerminalSession>();

function getProcessName(pid: number): string {
  try {
    // Get the process tree to find the actual running command
    const result = require('child_process')
      .execSync(`pgrep -P ${pid} | tail -1`)
      .toString()
      .trim();
    
    if (result) {
      const childProcess = require('child_process')
        .execSync(`ps -p ${result} -o comm=`)
        .toString()
        .trim();
      return childProcess.split('/').pop() || 'bash';
    } else {
      // If no child process, get the shell name
      const shellProcess = require('child_process')
        .execSync(`ps -p ${pid} -o comm=`)
        .toString()
        .trim();
      return shellProcess.split('/').pop() || 'bash';
    }
  } catch {
    return 'bash';
  }
}

ipcMain.handle('terminal-create', (event) => {
  const shell = process.env.SHELL || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash');
  const id = Date.now().toString();
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env as any
  });

  const processName = getProcessName(ptyProcess.pid);
  terminals.set(id, {
    pty: ptyProcess,
    title: processName,
    processName: processName
  });

  ptyProcess.onData((data) => {
    event.sender.send(`terminal-data-${id}`, data);
  });

  ptyProcess.onExit(() => {
    terminals.delete(id);
    event.sender.send(`terminal-exit-${id}`);
  });

  // Monitor process changes
  const checkProcess = setInterval(() => {
    if (terminals.has(id)) {
      const session = terminals.get(id)!;
      const currentProcess = getProcessName(session.pty.pid);
      if (currentProcess !== session.processName) {
        session.processName = currentProcess;
        session.title = currentProcess;
        event.sender.send(`terminal-title-${id}`, currentProcess);
      }
    } else {
      clearInterval(checkProcess);
    }
  }, 1000);

  return { id, title: processName };
});

ipcMain.on('terminal-data', (_event, id: string, data: string) => {
  const session = terminals.get(id);
  if (session) {
    session.pty.write(data);
  }
});

ipcMain.on('terminal-resize', (_event, id: string, cols: number, rows: number) => {
  const session = terminals.get(id);
  if (session) {
    session.pty.resize(cols, rows);
  }
});

ipcMain.on('terminal-close', (_event, id: string) => {
  const session = terminals.get(id);
  if (session) {
    session.pty.kill();
    terminals.delete(id);
  }
});

function createMenu() {
  const template: any[] = [
    {
      label: 'Shell',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('new-tab');
            }
          }
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('close-tab');
            }
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}