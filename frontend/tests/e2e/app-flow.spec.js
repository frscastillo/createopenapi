import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.resolve(__dirname, '../fixtures');
const reportsRoot = path.resolve(__dirname, '../../reports/validaciones');
const editingResultsPath = path.join(reportsRoot, 'editing-results.json');

const CASES = [
  '01-get-con-query',
  '02-post-con-body',
  '03-put-con-path-param',
  '04-patch-form-data',
  '05-delete-simple',
  '06-get-con-filtros',
  '07-post-con-body-bulk',
  '08-put-con-path-compuesto',
  '09-patch-form-data-avatar',
  '10-delete-con-headers',
  '11-head-sin-responses',
  '12-options-muchos-headers'
];

const UNSUPPORTED_CASES = [
  '13-trace-custom-auth',
  '14-connect-large-body'
];

const EDIT_CASES = [...CASES];

async function captureAndStoreScreenshot(page, testInfo, baseName, options = {}) {
  const screenshotPath = testInfo.outputPath(`${baseName}.png`);
  const { locator = null, fullPage = true } = options;

  if (locator) {
    await locator.screenshot({ path: screenshotPath });
  } else {
    await page.screenshot({ path: screenshotPath, fullPage });
  }

  await fs.mkdir(reportsRoot, { recursive: true });
  const destination = path.join(reportsRoot, `${baseName}.png`);
  await fs.copyFile(screenshotPath, destination);
  await testInfo.attach(baseName, { path: screenshotPath, contentType: 'image/png' });
  return { screenshotPath, destination };
}

async function recordEditingResult(result) {
  await fs.mkdir(reportsRoot, { recursive: true });
  let data = { cases: [] };

  try {
    const raw = await fs.readFile(editingResultsPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.cases)) {
      data = parsed;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const existingIndex = data.cases.findIndex((item) => item.caseId === result.caseId);
  if (existingIndex >= 0) {
    data.cases[existingIndex] = result;
  } else {
    data.cases.push(result);
  }

  await fs.writeFile(editingResultsPath, JSON.stringify(data, null, 2), 'utf8');
}

test.describe('flujo completo: convertir cURL y validar preview', () => {
  test.beforeAll(async () => {
    await fs.mkdir(reportsRoot, { recursive: true });
    await fs.rm(editingResultsPath, { force: true });
  });

  for (const caseId of CASES) {
    test(`renderiza correctamente ${caseId}`, async ({ page }, testInfo) => {
      const { curl, responses, expected } = await loadFixture(caseId);

      await page.goto('/');

      await page.fill('#curlInput', curl);
      await configureResponses(page, responses);

      await page.click('#convertCurlBtn');

      const pathLocator = page.locator('.opblock-summary-path').first();
      await expect(pathLocator).toHaveText(expected.path);

      const methodLocator = page.locator('.opblock-summary-method').first();
      await expect(methodLocator).toHaveText(expected.method.toUpperCase());

      await page.locator('.opblock-summary').first().click();

      if (expected.parameters) {
        if (expected.parameters.query) {
          for (const paramName of expected.parameters.query) {
            await expect(
              page
                .locator('.parameters .parameters-col_name')
                .filter({ hasText: paramName })
            ).toBeVisible();
          }
        }
        if (expected.parameters.path) {
          for (const paramName of expected.parameters.path) {
            await expect(
              page
                .locator('.parameters .parameters-col_name')
                .filter({ hasText: paramName })
            ).toBeVisible();
          }
        }
        if (expected.parameters.header) {
          for (const paramName of expected.parameters.header) {
            await expect(
              page
                .locator('.parameters .parameters-col_name')
                .filter({ hasText: paramName })
            ).toBeVisible();
          }
        }
      }

      // ...resto del test...
    });
  }
});

async function expandFirstOperation(page) {
  const summary = page.locator('.opblock-summary').first();
  await summary.waitFor();
  const opblock = page.locator('.opblock').first();
  const className = await opblock.getAttribute('class');
  if (!className || !className.includes('is-open')) {
    await summary.click();
  }
  await summary.scrollIntoViewIfNeeded();
  return { summary, opblock };
}

async function loadFixture(caseId) {
  const caseDir = path.join(fixturesRoot, caseId);
  const [curl, responses, expected] = await Promise.all([
    fs.readFile(path.join(caseDir, 'curl.txt'), 'utf8'),
    fs.readFile(path.join(caseDir, 'responses.json'), 'utf8'),
    fs.readFile(path.join(caseDir, 'expected.json'), 'utf8')
  ]);

  return {
    curl,
    responses: JSON.parse(responses),
    expected: JSON.parse(expected)
  };
}

async function configureResponses(page, responses) {
  const addButton = page.locator('#addResponseBtn');
  let items = page.locator('.response-item');
  let count = await items.count();

  // Aumentar cantidad de items si es necesario
  while (count < responses.length) {
    await addButton.click();
    items = page.locator('.response-item');
    count = await items.count();
  }

  // Reducir items sobrantes dejando al menos uno
  while (count > responses.length && count > 1) {
    const index = count - 1;
    const item = items.nth(index);
    const removeButton = item.locator('.remove-response-btn');
    if (await removeButton.isVisible()) {
      await removeButton.click();
    }
    items = page.locator('.response-item');
    count = await items.count();
  }

  if (responses.length === 0) {
    const firstItem = items.first();
    const select = firstItem.locator('.status-code-select');
    await select.selectOption('custom');
    await firstItem.locator('.custom-status-code').fill('');
    await firstItem.locator('.response-description').fill('');
    await firstItem.locator('.response-body').fill('');
    return;
  }

  for (let index = 0; index < responses.length; index += 1) {
    const definition = responses[index];
    const item = items.nth(index);

    const select = item.locator('.status-code-select');
    const optionExists = await select
      .locator(`option[value="${definition.code}"]`)
      .count();

    if (optionExists > 0) {
      await select.selectOption(definition.code);
    } else {
      await select.selectOption('custom');
      await item.locator('.custom-status-code').fill(definition.code);
    }

    await item.locator('.response-description').fill(definition.description || '');

    const bodyLocator = item.locator('.response-body');
    if (definition.body) {
      await bodyLocator.fill(JSON.stringify(definition.body, null, 2));
    } else {
      await bodyLocator.fill('');
    }
  }
}

test.describe('flujo completo: convertir cURL y validar preview', () => {
  for (const caseId of CASES) {
    test(`renderiza correctamente ${caseId}`, async ({ page }, testInfo) => {
      const { curl, responses, expected } = await loadFixture(caseId);

      await page.goto('/');

      await page.fill('#curlInput', curl);
      await configureResponses(page, responses);

      await page.click('#convertCurlBtn');

      const pathLocator = page.locator('.opblock-summary-path').first();
      await expect(pathLocator).toHaveText(expected.path);

      const methodLocator = page.locator('.opblock-summary-method').first();
      await expect(methodLocator).toHaveText(expected.method.toUpperCase());

      await page.locator('.opblock-summary').first().click();

      if (expected.parameters) {
        if (expected.parameters.query) {
          for (const paramName of expected.parameters.query) {
            await expect(
              page
                .locator('.parameters .parameters-col_name')
                .filter({ hasText: paramName })
            ).toBeVisible();
          }
        }
        if (expected.parameters.path) {
          for (const paramName of expected.parameters.path) {
            await expect(
              page
                .locator('.parameters .parameters-col_name')
                .filter({ hasText: paramName })
            ).toBeVisible();
          }
        }
        if (expected.parameters.header) {
          for (const paramName of expected.parameters.header) {
            await expect(
              page
                .locator('.parameters .parameters-col_name')
                .filter({ hasText: paramName })
            ).toBeVisible();
          }
        }
      }

      for (const statusCode of expected.responses) {
        await expect(
          page.locator('td.response-col_status').filter({ hasText: statusCode })
        ).toBeVisible();
      }

      if (expected.requestBodyContentType) {
        const opblockBody = page.locator('.opblock-body').first();
        await expect(opblockBody).toContainText('Request body');
        await expect(opblockBody).toContainText(expected.requestBodyContentType);
      }

      await captureAndStoreScreenshot(page, testInfo, `preview-${caseId}`);
    });
  }
});

test.describe('métodos no soportados', () => {
  for (const caseId of UNSUPPORTED_CASES) {
    test(`notifica error para ${caseId}`, async ({ page }, testInfo) => {
      const { curl, responses } = await loadFixture(caseId);

      await page.goto('/');

      await page.fill('#curlInput', curl);
      await configureResponses(page, responses);

      await page.click('#convertCurlBtn');

      const notification = page
        .locator('.notification-error .notification-message')
        .first();
      await expect(notification).toContainText('Método HTTP no válido');

      await captureAndStoreScreenshot(page, testInfo, `preview-${caseId}`);
    });
  }
});

test.describe.serial('edición de metadatos por método', () => {
  for (const caseId of EDIT_CASES) {
    test(`actualiza la preview editada para ${caseId}`, async ({ page }, testInfo) => {
      const { curl, responses, expected } = await loadFixture(caseId);
      let pathValue = expected.path;
      let methodUpper = expected.method.toUpperCase();
      let methodKey = expected.method.toLowerCase();
      const updatedQueryParams = {};
      const updatedResponses = {};
      let requestBodyDescription = null;
      const screenshots = {};

      const recordScreenshot = async (key, baseName, { scrollToTop = true } = {}) => {
        if (scrollToTop) {
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        await captureAndStoreScreenshot(page, testInfo, baseName);
        screenshots[key] = `${baseName}.png`;
      };

      try {
        await page.goto('/');

        await page.fill('#curlInput', curl);
        await configureResponses(page, responses);
        await page.click('#convertCurlBtn');

        await expect(page.locator('.opblock-summary-path').first()).toHaveText(expected.path);

        await expandFirstOperation(page);
        await recordScreenshot('previewBefore', `preview-before-${caseId}`);

        const { spec: originalSpec, version: originalVersion } = await page.evaluate(() => ({
          spec: window.__CURRENT_OPENAPI_SPEC,
          version: window.__CURRENT_OPENAPI_SPEC_VERSION ?? 0
        }));

        if (!originalSpec) {
          throw new Error('No se encontró la especificación actual para edición');
        }

        const firstPath = Object.keys(originalSpec.paths || {})[0];
        if (firstPath) {
          pathValue = firstPath;
        }

        const firstMethod = firstPath ? Object.keys(originalSpec.paths[firstPath] || {})[0] : null;
        if (firstMethod) {
          methodKey = firstMethod;
          methodUpper = firstMethod.toUpperCase();
        }

        const operation = originalSpec.paths?.[pathValue]?.[methodKey];
        if (!operation) {
          throw new Error('No se encontró la operación objetivo para editar');
        }

        await page.click('#editMetadataBtn');
        const overlay = page.locator('#metadataModalOverlay');
        await expect(overlay).toBeVisible();
        const modal = overlay.locator('.metadata-modal');

        await recordScreenshot('modalBefore', `modal-before-${caseId}`, { scrollToTop: false });

        const newTitle = `API ${methodUpper} editada`;
        const newDescription = `Descripción actualizada ${caseId}`;
        const newTag = `Categoria ${methodUpper}`;
        const newSummary = `Resumen ${caseId}`;
        const newEndpointDescription = `Detalle del endpoint ${caseId}`;

        await modal.locator('#apiTitle').fill(newTitle);
        await modal.locator('#apiDescription').fill(newDescription);
        await modal.locator('#endpointTag').fill(newTag);
        await modal.locator('#endpointSummary').fill(newSummary);
        await modal.locator('#endpointDescription').fill(newEndpointDescription);

        if (Array.isArray(operation.parameters)) {
          for (const param of operation.parameters.filter((p) => p.in === 'query')) {
            const field = modal.locator(`#param_${param.name}`);
            if (await field.count()) {
              const description = `Descripción ${param.name} ${methodUpper}`;
              await field.fill(description);
              updatedQueryParams[param.name] = description;
            }
          }
        }

        if (operation.requestBody) {
          const requestBodyField = modal.locator('#requestBodyDescription');
          if (await requestBodyField.count()) {
            requestBodyDescription = `Request body ${methodUpper}`;
            await requestBodyField.fill(requestBodyDescription);
          }
        }

        if (operation.responses) {
          for (const statusCode of Object.keys(operation.responses)) {
            const responseField = modal.locator(`#response_${statusCode}`);
            if (await responseField.count()) {
              const description = `Respuesta ${statusCode} ${methodUpper}`;
              await responseField.fill(description);
              updatedResponses[statusCode] = description;
            }
          }
        }

        await recordScreenshot('modalAfter', `modal-after-${caseId}`, { scrollToTop: false });

        page.once('dialog', (dialog) => dialog.accept());
        await modal.locator('#saveMetadataChanges').click();
        await expect(overlay).toBeHidden();

        await expect.poll(async () =>
          page.evaluate(() => window.__CURRENT_OPENAPI_SPEC_VERSION ?? 0)
        ).toBeGreaterThan(originalVersion);

        const updatedSpec = await page.evaluate(() => window.__CURRENT_OPENAPI_SPEC);
        const updatedOperation = updatedSpec.paths?.[pathValue]?.[methodKey];
        if (!updatedOperation) {
          throw new Error('No se pudo obtener la operación actualizada');
        }

        expect(updatedSpec.info.title).toBe(newTitle);
        expect(updatedSpec.info.description).toBe(newDescription);
        expect(updatedOperation.tags?.[0]).toBe(newTag);
        expect(updatedOperation.summary).toBe(newSummary);
        expect(updatedOperation.description).toBe(newEndpointDescription);

        for (const [paramName, description] of Object.entries(updatedQueryParams)) {
          const targetParam = (updatedOperation.parameters || []).find(
            (param) => param.name === paramName && param.in === 'query'
          );
          expect(targetParam?.description).toBe(description);
        }

        if (requestBodyDescription) {
          expect(updatedOperation.requestBody?.description).toBe(requestBodyDescription);
        }

        for (const [statusCode, description] of Object.entries(updatedResponses)) {
          expect(updatedOperation.responses?.[statusCode]?.description).toBe(description);
        }

        const infoSection = page.locator('.information-container');
        await expect(infoSection).toContainText(newTitle);
        await expect(infoSection).toContainText(newDescription);

        const { summary, opblock } = await expandFirstOperation(page);

        await expect(page.locator('.opblock-tag').first()).toContainText(newTag);
        const summaryDescription = summary.locator('.opblock-summary-description');
        await expect(summaryDescription).toContainText(newSummary);

        if (newEndpointDescription) {
          const descriptionLocator = opblock.locator('.opblock-description').first();
          if (await descriptionLocator.count()) {
            await expect(descriptionLocator).toContainText(newEndpointDescription);
          }
        }

        if (requestBodyDescription) {
          await expect(opblock).toContainText(requestBodyDescription);
        }

        for (const description of Object.values(updatedQueryParams)) {
          await expect(opblock).toContainText(description);
        }

        for (const description of Object.values(updatedResponses)) {
          await expect(opblock).toContainText(description);
        }

        await recordScreenshot('previewAfter', `preview-after-${caseId}`);

        const result = {
          caseId,
          method: methodUpper,
          path: pathValue,
          status: 'success',
          editedTitle: newTitle,
          editedDescription: newDescription,
          editedTag: newTag,
          editedSummary: newSummary,
          editedEndpointDescription: newEndpointDescription,
          editedParameters: Object.keys(updatedQueryParams).length ? updatedQueryParams : null,
          editedRequestBody: requestBodyDescription,
          editedResponses: Object.keys(updatedResponses).length ? updatedResponses : null,
          screenshots
        };

        await recordEditingResult(result);
      } catch (error) {
        if (!screenshots.error) {
          try {
            await recordScreenshot('error', `preview-error-${caseId}`);
          } catch (captureError) {
            console.error('No se pudo capturar la evidencia de error:', captureError);
          }
        }
        const failureResult = {
          caseId,
          method: methodUpper,
          path: pathValue,
          status: 'failure',
          failureReason: error.message,
          screenshots
        };
        await recordEditingResult(failureResult).catch(() => {});
        throw error;
      }
    });
  }
});
