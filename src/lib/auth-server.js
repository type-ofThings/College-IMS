import jwt from 'jsonwebtoken';

export function verifyToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Access denied. No token provided.', status: 401 };
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user: decoded };
  } catch (error) {
    return { error: 'Invalid or expired token.', status: 401 };
  }
}

export function requireRole(user, ...roles) {
  if (!user || !roles.includes(user.role)) {
    return { error: 'Access denied. Insufficient permissions.', status: 403 };
  }
  return null;
}
