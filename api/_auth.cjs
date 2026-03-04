const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function authMiddleware(handler) {
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).cjson({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).cjson({ error: 'Invalid token' });
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    return handler(req, res);
  };
}

function optionalAuthMiddleware(handler) {
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
      }
    }
    
    return handler(req, res);
  };
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware,
  JWT_SECRET
};
