import { defaultCurlExample, defaultResponses } from '../data/examples.js';

/**
 * GET /api/examples/defaults
 */
export function getDefaultExamples(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      curl: defaultCurlExample,
      responses: defaultResponses
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}

export default { getDefaultExamples };
