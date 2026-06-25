export function setCorsHeaders(req, res) {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Set matching origin or fallback to FRONTEND_URL configuration
  const requestOrigin = req.headers.origin;
  if (requestOrigin === allowedOrigin || requestOrigin?.startsWith('http://localhost:')) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-secret');
}
