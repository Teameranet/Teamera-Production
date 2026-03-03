import jwt from 'jsonwebtoken';

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Logger middleware - logs all incoming requests
 */
export const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Track response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${method} ${url} - Status: ${res.statusCode} - ${duration}ms`);
  });

  next();
};

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing',
        message: 'Please provide a valid authentication token'
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token missing',
        message: 'Please provide a valid authentication token'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Optional authentication - attaches user if token exists, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Token invalid, but we continue without user
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Generate JWT token
 * @param {object} payload - Data to encode in token
 * @param {string} expiresIn - Token expiration time (default: '24h')
 */
export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - Token to verify
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export default {
  logger,
  authenticate,
  optionalAuth,
  authorize,
  generateToken,
  verifyToken
};
