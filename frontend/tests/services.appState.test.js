import { describe, expect, it } from 'vitest';
import { AppState } from '../js/services/AppState.js';

describe('AppState', () => {
  it('permite actualizar el estado y notificar subscriptores', () => {
    const state = new AppState();
    let notified = false;

    state.subscribe((current, previous) => {
      notified = true;
      expect(previous.currentSpec).toBe(null);
      expect(current.currentSpec).toEqual({ test: true });
    });

    state.setCurrentSpec({ test: true });
    expect(state.getState().currentSpec).toEqual({ test: true });
    expect(notified).toBe(true);
  });

  it('gestiona notificaciones con auto-remoción', async () => {
    const state = new AppState();
    const id = state.addNotification({ message: 'hola', type: 'info', duration: 10 });

    expect(state.getState().notifications.length).toBe(1);

    // Esperar a que corra el timeout
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(state.getState().notifications.some((n) => n.id === id)).toBe(false);
  });
});
