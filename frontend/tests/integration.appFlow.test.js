import { beforeEach, describe, expect, it, vi } from 'vitest';
// @vitest-environment jsdom
import { waitFor } from '@testing-library/dom';

let updateSpecSpy;

const buildDom = () => {
  document.body.innerHTML = `
    <button id="convertCurlBtn">Convertir</button>
    <textarea id="curlInput"></textarea>
    <button id="addResponseBtn">Agregar respuesta</button>
    <div id="responsesList"></div>
    <button id="downloadYamlBtn">Descargar</button>
    <div id="swagger-ui"></div>

    <div id="metadataModalOverlay" style="display: none;">
      <div>
        <button id="closeMetadataModal"></button>
        <button id="saveMetadataChanges"></button>
        <button id="cancelMetadataEdit"></button>
        <div id="queryParamsContainer"></div>
        <div id="requestBodySection" style="display:none;"></div>
        <textarea id="requestBodyDescription"></textarea>
        <div id="responsesContainer"></div>
      </div>
    </div>

    <button id="editMetadataBtn"></button>
    <input id="apiTitle" />
    <textarea id="apiDescription"></textarea>
    <input id="endpointTag" />
    <input id="endpointSummary" />
    <textarea id="endpointDescription"></textarea>
  `;
};

describe('Flujo principal de la aplicación', () => {
  beforeEach(() => {
    vi.resetModules();
    buildDom();

    updateSpecSpy = vi.fn();

    global.SwaggerUIBundle = vi.fn(() => ({
      specActions: {
        updateSpec: updateSpecSpy
      }
    }));

    global.SwaggerUIBundle.presets = { apis: {}, SwaggerUIStandalonePreset: {} };
    global.SwaggerUIBundle.plugins = { DownloadUrl: {} };

    global.SwaggerUIBundle.SwaggerUIStandalonePreset = {};

    global.window.jsyaml = {
      dump: vi.fn(() => 'openapi: 3.0.0')
    };

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    global.URL.createObjectURL = vi.fn(() => 'blob:123');
    global.URL.revokeObjectURL = vi.fn();

    global.alert = vi.fn();
  });

  it('convierte un CURL y prepara la descarga en YAML', async () => {
    await import('../js/main.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const curlInput = document.getElementById('curlInput');
    curlInput.value = 'curl -X GET "https://api.integration.com/items"';

    document.getElementById('convertCurlBtn').click();

    await waitFor(() => {
      expect(updateSpecSpy).toHaveBeenCalled();
    });

    document.getElementById('downloadYamlBtn').click();
    expect(global.window.jsyaml.dump).toHaveBeenCalled();
  });
});
