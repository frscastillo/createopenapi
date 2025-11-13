import { CONSTANTS } from './constants.js';

export class ValidationUtils {
  /**
   * Recibe un comando curl válido y lo estandariza para procesamiento seguro.
   * - Unifica comillas dobles en body y headers
   * - Elimina fragmentos (#) y espacios innecesarios
   * - Ordena y limpia headers
   * - Normaliza flags y método HTTP
   * - Elimina continuaciones de línea
   * - Retorna el curl listo para parsear a YAML/OpenAPI
   */
  static normalizeCurlCommand(curlCommand) {
    let normalized = curlCommand.trim();
    // Eliminar fragmentos (#...)
    normalized = normalized.replace(/#.*$/, '');
    // Unificar continuaciones de línea (\, ^, `)
    normalized = normalized.replace(/\\\s*$/gm, '').replace(/\^\s*$/gm, '').replace(/`\s*$/gm, '');
    // Unificar comillas en body (-d)
    normalized = normalized.replace(/-d\s+'([^']+)'/g, (m, body) => `-d "${body.replace(/"/g, '\\"')}"`);
    normalized = normalized.replace(/-d\s+"([^"]+)"/g, (m, body) => `-d "${body.replace(/"/g, '\\"')}"`);
    // Unificar comillas en headers
    normalized = normalized.replace(/-H\s+'([^']+)'/g, (m, h) => `-H "${h.replace(/"/g, '\\"')}"`);
    // Eliminar espacios innecesarios en la URL
    normalized = normalized.replace(/(https?:\/\/[^\s"']+)/g, (m) => m.replace(/\s+/g, ''));
    // Ordenar headers (opcional, aquí solo los limpia)
    // Eliminar espacios leading/trailing en headers
    normalized = normalized.replace(/-H\s+"([^"]+)"/g, (m, h) => `-H "${h.trim()}"`);
    // Unificar método HTTP
    const methodMatch = normalized.match(/-X\s+([A-Z]+)/i);
    if (!methodMatch && /-d|--data|--data-raw|--data-binary/.test(normalized)) {
      normalized = normalized.replace(/^curl/, 'curl -X POST');
    }
    // Eliminar fragmentos en query
    normalized = normalized.replace(/(\?[^#"]*)#.*$/, '$1');
    return normalized;
  }
  static shouldFieldBeRequired(fieldName, value) {
    if (value === null || value === undefined || value === '') return false;

    const lowerFieldName = String(fieldName).toLowerCase();

    if (CONSTANTS.VALIDATION.OPTIONAL_FIELDS.some((opt) => lowerFieldName.includes(opt))) {
      return false;
    }

    if (CONSTANTS.VALIDATION.REQUIRED_FIELDS.some((req) => lowerFieldName.includes(req))) {
      return true;
    }

    return true;
  }

  static shouldHeaderBeRequired(headerName) {
    const lowerHeaderName = String(headerName).toLowerCase();

    if (
      CONSTANTS.VALIDATION.OPTIONAL_HEADERS.some(
        (opt) => lowerHeaderName === opt || lowerHeaderName.includes(opt)
      )
    ) {
      return false;
    }

    if (
      CONSTANTS.VALIDATION.REQUIRED_HEADERS.some(
        (req) => lowerHeaderName === req || lowerHeaderName.includes(req)
      )
    ) {
      return true;
    }

    if (lowerHeaderName.startsWith('x-')) {
      return true;
    }

    return false;
  }

  static shouldQueryParamBeRequired(paramName) {
    const lowerParamName = String(paramName).toLowerCase();

    if (
      CONSTANTS.VALIDATION.OPTIONAL_PARAMS.some(
        (opt) => lowerParamName === opt || lowerParamName.includes(opt)
      )
    ) {
      return false;
    }

    if (
      CONSTANTS.VALIDATION.REQUIRED_PARAMS.some(
        (req) => lowerParamName === req || lowerParamName.includes(req)
      )
    ) {
      return true;
    }

    return false;
  }

  static validateCurlCommand(curlCommand) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!curlCommand || !curlCommand.trim()) {
      result.errors.push('El comando CURL no puede estar vacío.');
      result.isValid = false;
      return result;
    }

    if (!curlCommand.trim().toLowerCase().startsWith('curl')) {
      result.errors.push('El comando debe comenzar con "curl".');
    }

    // 1. Esquema obligatorio y URL válida
    const urlMatch = curlCommand.match(/https?:\/\/[^\s"']+/i);
    if (!urlMatch) {
      result.errors.push('La URL no es válida o no tiene esquema (http/https). Ej.: https://api.ejemplo.com/recurso.');
    } else {
      const urlStr = urlMatch[0];
      // Espacios y caracteres reservados
      if (urlStr.match(/\s/)) {
        const espacios = urlStr.match(/\s/g);
        result.errors.push(`La URL contiene ${espacios.length} espacio(s). Ejemplo: "${urlStr}"`);
      }
      // Caracteres reservados en query deben ir percent-encoded
      const queryPart = urlStr.split('?')[1];
      if (queryPart) {
        const reserved = queryPart.match(/[ #?&=;%+]/g);
        if (reserved) {
          result.warnings.push('La query contiene caracteres reservados. Considera percent-encoding para datos: ' + reserved.map(c => `"${c}"`).join(', '));
        }
      }
      // Fragmentos #
      if (urlStr.includes('#')) {
        result.warnings.push('La URL contiene fragmento (#). Todo lo que sigue no se envía por HTTP.');
      }
      // Caracteres extraños
      const extraños = urlStr.match(/[^a-zA-Z0-9\-\.\/\:\?\=\&\%]/g);
      if (extraños) {
        const lista = [...new Set(extraños)].map(c => `"${c}"`).join(', ');
        result.errors.push(`La URL contiene caracter(es) no permitido(s): ${lista}. Ejemplo: "${urlStr}"`);
      }
      try {
        new URL(urlStr);
      } catch (error) {
        result.errors.push('La URL detectada no es válida.');
      }
    }

    // 2. Método HTTP y flags
    const methodMatch = curlCommand.match(/-X\s+([A-Z]+)/i);
    const hasData = /-d|--data|--data-raw|--data-binary/.test(curlCommand);
    const hasForm = /-F|--form/.test(curlCommand);
    const hasGetFlag = /-G|--get/.test(curlCommand);
    let method = 'GET';
    if (methodMatch) {
      method = methodMatch[1].toUpperCase();
      if (!CONSTANTS.HTTP_METHODS.includes(method)) {
        result.errors.push(`Método HTTP no soportado: ${method}.`);
      }
    } else if (hasData) {
      method = 'POST';
      result.warnings.push('No se especificó método HTTP; se asumirá POST por presencia de datos.');
    } else {
      result.warnings.push('No se especificó método HTTP; se asumirá GET.');
    }
    // GET con body sin -G
    if (method === 'GET' && hasData && !hasGetFlag) {
      result.errors.push('Detectamos -d con método GET. Si querés query, usá -G/--get o mové los parámetros a la URL.');
    }
    // -F y -G juntos
    if (hasForm && hasGetFlag) {
      result.errors.push('No combines -G con --form. Para uploads usá --form sin -G.');
    }
    // DELETE con body
    if (method === 'DELETE' && hasData) {
      result.warnings.push('DELETE con body: algunos servidores lo ignoran; revisa la documentación de tu API.');
    }

    // 3. Headers
    const headerMatches = curlCommand.match(/-H\s+"([^"]+)"/g);
    if (headerMatches) {
      headerMatches.forEach(h => {
        const header = h.match(/-H\s+"([^"]+)"/)[1];
        if (!header.includes(':')) {
          result.errors.push(`El encabezado debe tener Nombre: valor. Verificá este header: "${header}".`);
        } else {
          const [name, value] = header.split(':');
          if (!name.trim()) {
            result.errors.push(`El nombre del header está vacío. Header: "${header}".`);
          }
          if (!value.trim()) {
            result.errors.push(`El valor del header está vacío. Header: "${header}".`);
          }
        }
      });
    }

    // 4. Body JSON y flags múltiples -d
    const dataMatches = curlCommand.match(/-d\s+'([^']+)'|-d\s+"([^"]+)"/g);
    if (dataMatches && dataMatches.length > 1) {
      // Si parece JSON, advertir o bloquear
      const jsons = dataMatches.filter(d => /\{.*\}/.test(d));
      if (jsons.length > 1) {
        result.errors.push('No concatenar múltiples JSON con &. Unifica en un solo JSON: -d \'{"a":1,"b":2}\'.');
      }
    }
    if (dataMatches) {
      dataMatches.forEach(d => {
        const body = d.match(/-d\s+'([^']+)'|-d\s+"([^"]+)"/);
        const jsonBody = body[1] || body[2];
        if (/\{.*\}/.test(jsonBody)) {
          try {
            JSON.parse(jsonBody);
          } catch (e) {
            result.errors.push('El body parece JSON pero no parsea. En Linux/macOS usá comillas simples \'…\'. En Windows escapá " como \\".');
          }
        }
      });
    }

    // 5. Continuaciones de línea
    if (curlCommand.match(/\\\s*$/m)) {
      result.warnings.push('Detectamos continuaciones de línea estilo bash/zsh (\\). Une líneas y depura espacios.');
    }
    if (curlCommand.match(/\^\s*$/m)) {
      result.warnings.push('Detectamos continuaciones de línea estilo CMD (^). Une líneas y depura espacios.');
    }
    if (curlCommand.match(/`\s*$/m)) {
      result.warnings.push('Detectamos continuaciones de línea estilo PowerShell (`). Une líneas y depura espacios.');
    }

    // 6. Tamaño máximo
    if (curlCommand.length > CONSTANTS.LIMITS.MAX_CURL_LENGTH) {
      result.warnings.push('El comando CURL es muy largo; considera simplificarlo.');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  static validateResponseJSON(jsonString) {
    try {
      if (!jsonString || !jsonString.trim()) {
        return { isValid: true, parsed: {} };
      }

      if (jsonString.length > CONSTANTS.LIMITS.MAX_JSON_SIZE) {
        return {
          isValid: false,
          error: `JSON demasiado grande (máximo ${
            CONSTANTS.LIMITS.MAX_JSON_SIZE / 1000
          }KB).`
        };
      }

      const parsed = JSON.parse(jsonString);

      if (this.getObjectDepth(parsed) > CONSTANTS.LIMITS.MAX_OBJECT_DEPTH) {
        return {
          isValid: false,
          error: `JSON con demasiada profundidad (máximo ${
            CONSTANTS.LIMITS.MAX_OBJECT_DEPTH
          }).`
        };
      }

      return { isValid: true, parsed };
    } catch (error) {
      return { isValid: false, error: `JSON inválido: ${error.message}` };
    }
  }

  static getObjectDepth(obj, depth = 1) {
    if (obj === null || typeof obj !== 'object') return depth;

    let maxDepth = depth;
    for (const key of Object.keys(obj)) {
      const currentDepth = this.getObjectDepth(obj[key], depth + 1);
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }
    }
    return maxDepth;
  }

  static isValidHttpMethod(method) {
    return CONSTANTS.HTTP_METHODS.includes(String(method).toUpperCase());
  }

  static isValidStatusCode(statusCode) {
    const code = parseInt(statusCode, 10);
    return Number.isInteger(code) && code >= 100 && code <= 599;
  }
}

export default ValidationUtils;

