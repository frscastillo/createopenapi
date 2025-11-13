import { describe, expect, it, vi, beforeAll } from 'vitest';
import { ErrorHandler } from '../js/services/ErrorHandler.js';
import { appState } from '../js/services/AppState.js';

beforeAll(() => {
  global.window = global.window || {};
  global.localStorage = global.localStorage || {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
});

describe('ErrorHandler', () => {
  it('crea notificaciones de error amigables', () => {
    const spy = vi.spyOn(appState, 'addNotification');

    ErrorHandler.handle(new Error('Invalid JSON in request body'), 'curl-conversion');

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );

    spy.mockRestore();
  });

  it('regresa información estructurada cuando parsea errores', () => {
    const info = ErrorHandler.parseError('Mensaje de error');
    expect(info).toMatchObject({
      message: 'Mensaje de error',
      type: 'UserError'
    });
  });
});
