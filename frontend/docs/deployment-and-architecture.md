# Informe de despliegue y arquitectura — CreateOpenAPI (resumen técnico)

Fecha: 2025-11-12

Este documento resume el estado actual del proyecto, las elecciones recomendadas para hosting del frontend y backend, requisitos de seguridad, estructura final del repositorio y el flujo de despliegue propuesto. Está pensado como guía práctica para poner en producción el sitio usando dominio propio.

---

## 1. Resumen del proyecto (hallazgos)

- Tipo de frontend: HTML/CSS/JS (vanilla ES modules). SPA ligera centrada en `index.html`.
- Dependencias front: `swagger-ui-dist`, `yaml`. Dev: `jest`, `@playwright/test`, `http-server`.
- Comunicación: `fetch` + `ApiClient` apuntando por defecto a `http://localhost:4000/api`. Encabezados: `Content-Type: application/json`, `x-api-key`, y `Authorization: Bearer <token>` si existe token. `credentials: 'include'`.
- Backend: no incluido en este repo (el frontend espera endpoints: `/auth/token`, `/examples/defaults`, `/convert/curl`, `/convert/spec/yaml`, `/health`, `/contact`).
- Internacionalización: diccionarios JSON en `i18n/` y `js/i18n.js`.
- Logs en UI: `#serviceCallsList` persistente para debugging.

---

## 2. Información requerida — FRONTEND (completado)

- Tipo de proyecto: HTML/CSS/JS (vanilla).
- SPA o multipage: SPA (single page, toda la app en `index.html`).
- Frameworks/libraries: `swagger-ui-dist`, `yaml`. No framework SPA (React/Vue/Angular).
- Dependencias adicionales: npm presente; puede funcionar como archivos estáticos (no requiere build por defecto). `start` usa `http-server`.
- Comunicación con backend: `fetch` (vía `ApiClient`) con JSON, cabeceras `x-api-key` y `Authorization`. Usa `credentials: 'include'`.
- Requerimientos especiales:
  - HTTPS obligatorio (recomendado y soportado por los hosts propuestos).
  - Soporte multi-idioma: ya implementado.
  - CDN: opcional; recomendado si tráfico global.
  - Dominio propio: sí (ya comprado).

Notas importantes: mover API_KEY y `ApiClient.baseURL` a configuración runtime o env vars en despliegue (no hardcodear).

---

## 3. Información requerida — BACKEND (basada en lo que el front espera)

- Lenguaje recomendado: Node.js + Express (por compatibilidad y rapidez de prototipado). También válido: FastAPI (Python).
- Endpoints esperados (mínimos):
  - POST `/api/auth/token` → devuelve { success, data: { token } }
  - GET `/api/examples/defaults` → devuelve ejemplos (array | object | string)
  - POST `/api/convert/curl` → acepta `{ curl, response }` o `{ curl, responses }` y devuelve OpenAPI spec
  - POST `/api/convert/spec/yaml` → acepta `{ spec }` y devuelve YAML string
  - GET `/api/health`
  - POST `/api/contact`
- Tipos HTTP: GET y POST principalmente.
- Base de datos: no obligatoria inicialmente. Recomiendo PostgreSQL si necesitas persistencia de usuarios o feedback a largo plazo.
- Autenticación y seguridad: JWT para autorización; `x-api-key` para cliente; HTTPS obligatorio; validación de input (zod/joi), rate limiting y cabeceras de seguridad (helmet).
- Puertos locales: front suele correr en 8080 (http-server), backend en 4000 (ApiClient apunta a `localhost:4000/api`).

---

## 4. Preferencias de hosting (recomendación práctica)

- Frontend (estático): Netlify o Vercel (ambos fáciles, SSL automático, integración Git).
- Backend (API): Render (fácil), Fly.io o Cloud Run si prefieres contenedores.
- Recomendación inicial rápida y económica: Front → Netlify; Back → Render.
- Si quieres todo en una sola plataforma: Render puede alojar front y back, pero separar servicios suele ser más flexible.
- Soporte Docker: recomendable para backend si buscas reproducibilidad.

---

## 5. Estructura actual y final recomendada del proyecto

Estructura actual (simplificada):

```
/createopenapi-beta
  index.html
  css/
  js/
    services/
      ApiClient.js
      AppState.js
      ErrorHandler.js
    metadataEditor.js
    main.js
    openAPIViewer.js
  i18n/
  package.json
  tests/
```

Estructura final recomendada (monorepo o repos separados):

Opción A — Monorepo
```
/project-root
  /frontend
    package.json
    index.html
    css/
    js/
    i18n/
  /backend
    package.json
    src/
      server.js
      routes/
      controllers/
    Dockerfile
  .github/workflows/
  README.md
```

Opción B — Repos separados
- repo-frontend (todo lo actual)
- repo-backend (API)

Notas: hacer `ApiClient.baseURL` configurable mediante `window.__APP_CONFIG` inyectado por host o build-time env var.

---

## 6. Requisitos de seguridad (detallado)

- HTTPS obligatorio con certificado (Let's Encrypt gestionado por provider).
- No exponer secrets en el frontend (mover API keys a env vars en el host o gestionarlas en el backend).
- JWT con expiración corta.
- CORS: permitir solo orígenes del frontend (no `*`).
- Rate limiting y protección contra abuso.
- Input validation (zod/joi), escape de datos.
- Cabeceras de seguridad (helmet): HSTS, CSP, X-Frame-Options.
- Monitoreo y logs (Sentry, Papertrail) y backups si hay BD.

---

## 7. Flujo de despliegue recomendado (Netlify + Render)

1. Preparación
   - Crear repos en GitHub para frontend y backend.
   - Mover frontend a `frontend/` si haces monorepo.
   - Asegurar `package.json` con scripts `start` y (opcional) `build`.

2. Despliegue Frontend (Netlify)
   - Conectar repo GitHub en Netlify → deploy automático.
   - Publish directory: root (o `dist` si hay build).
   - Añadir dominio personalizado (`example.com`). Netlify provee registros DNS y SSL.

3. Despliegue Backend (Render)
   - Conectar repo en Render → Web Service.
   - Configurar `start` script en `package.json` (`node src/server.js`).
   - Configurar env vars (JWT_SECRET, DB_URL, API_KEY si aplica).
   - Añadir dominio personalizado `api.example.com` en Render (CNAME).

4. DNS
   - `www` CNAME → Netlify host
   - apex (example.com) ALIAS/ANAME → Netlify or provided A records
   - `api` CNAME → backend.onrender.com

5. Pruebas y verificación
   - Verificar SSL y que el front haga llamadas a `https://api.example.com/api/*`.
   - Ajustar CORS en backend (permitir solo `https://example.com` and `https://www.example.com`).

6. CI/CD
   - Netlify/Render ya despliegan por push. Opcional: GitHub Actions para tests y verificaciones.

---

## 8. Archivos que puedo generar para facilitar el despliegue

- `backend/Dockerfile` y `backend/Procfile` (si quieres Heroku/Platform-as-a-Service).
- `backend/server.example.js` (Express) con rutas mínimas que el frontend espera.
- `frontend/config.runtime.js` snippet para inyectar `window.__APP_CONFIG = { API_BASE_URL: 'https://api.example.com/api' }`.
- `Dockerfile` y `README.md` de despliegue.
- `.github/workflows/ci.yml` (test) y `.github/workflows/deploy.yml` (opcional) para deploy automatizado.

---

## 9. Checklist accionable (rápido)

- [ ] Crear repos GitHub (frontend y backend o monorepo).
- [ ] Quitar secrets del frontend y hacer `API_BASE_URL` configurable.
- [ ] Netlify: deploy front + custom domain.
- [ ] Render: deploy backend + custom domain + env vars.
- [ ] Configurar DNS en registrador.
- [ ] Verificar CORS y HTTPS.
- [ ] Activar monitoreo y logging.

---

## 10. Próximos pasos (qué puedo hacer por vos ahora)

Indica qué preferís y lo preparo automáticamente:

- Generar `backend/server.example.js` (Express) y `Dockerfile` de ejemplo y subirlos al repo.
- Cambiar `js/services/ApiClient.js` para leer `baseURL` desde `window.__APP_CONFIG` y eliminar `x-api-key` hard-coded, además crear un pequeño snippet para inyectar la config desde `index.html`.
- Crear GitHub Actions para tests (jest/playwright) y deploy automático.
- Proveer los registros DNS exactos (A/CNAME) según tu registrador (decime cuál: Cloudflare, GoDaddy, Namecheap, etc.).

---

Si quieres que genere archivos concretos (por ejemplo el `server.example.js` y `Dockerfile`) dímelo y los creo en el repo. También dime qué hosting prefieres (Netlify / Vercel para front, Render / Fly / Cloud Run para back) y preparo los pasos exactos y los comandos CLI listos para ejecutar.

---

Archivo generado por: asistente de desarrollo — versión: informe automatizado
