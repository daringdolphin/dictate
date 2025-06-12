// Test setup file for Jest
// Global mocks and configurations

// Mock Electron since we're running in Node environment
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  app: {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
  },
  BrowserWindow: jest.fn(() => ({
    loadFile: jest.fn(),
    webContents: {
      send: jest.fn(),
      openDevTools: jest.fn(),
    },
    show: jest.fn(),
    hide: jest.fn(),
    setIgnoreMouseEvents: jest.fn(),
    on: jest.fn(),
  })),
  globalShortcut: {
    register: jest.fn(() => true),
    unregister: jest.fn(),
    isRegistered: jest.fn(() => false),
  },
  Tray: jest.fn(() => ({
    setImage: jest.fn(),
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    destroy: jest.fn(),
  })),
  Menu: {
    buildFromTemplate: jest.fn(),
  },
  nativeImage: {
    createFromDataURL: jest.fn(() => ({})),
  },
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 }
    }))
  },
  clipboard: {
    writeText: jest.fn(),
    readText: jest.fn(() => ''),
  }
}));

// Mock robotjs
jest.mock('robotjs', () => ({
  keyTap: jest.fn(),
  getActiveWindow: jest.fn(() => ({
    title: 'Test Window',
    pid: 1234,
  })),
}));

// Mock node-fetch properly for both CommonJS and ES module imports
const mockFetch = jest.fn();
mockFetch.mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
});

jest.mock('node-fetch', () => {
  return {
    __esModule: true,
    default: mockFetch,
  };
});

// Global test timeout
jest.setTimeout(10000);