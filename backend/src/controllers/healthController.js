/**
 * GET /api/health
 */
export function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime()
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  });
}

export default { healthCheck };
