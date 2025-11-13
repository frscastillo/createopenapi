import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Configurar una URL base para jsdom
beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.history.pushState({}, 'Test', '/');
  }
});

// Limpiar DOM y mocks después de cada prueba
afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

// Espiar console.error para detectar errores inesperados
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

afterAll(() => {
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});
