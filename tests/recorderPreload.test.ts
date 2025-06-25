describe('Recorder preload safety', () => {
  beforeEach(() => {
    (global as any).window = {};
  });

  test('safeSend handles missing ipcRenderer gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mod = require('../src/renderer/recorder/index');
    expect(() => mod.__test__.safeSend('test')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('safeOn handles missing ipcRenderer gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mod = require('../src/renderer/recorder/index');
    expect(() => mod.__test__.safeOn('test', () => {})).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
