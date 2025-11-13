// Shim re-export to legacy implementation (fixed and moved to js/legacy)
import { validateJSON, jsonToOpenAPI } from './legacy/jsonConverter.js';

export { validateJSON, jsonToOpenAPI };

export default { validateJSON, jsonToOpenAPI };