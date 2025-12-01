export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Simple test function works!',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
