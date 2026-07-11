import { supabase } from '../config/supabase.js';

export const requireAuth = async (request, response, next) => {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return response.status(401).json({ error: 'Authentication required.' });
  }

  // Dev bypass
  if (token === 'dev-token' && process.env.NODE_ENV !== 'production') {
    request.user = { id: '00000000-0000-0000-0000-000000000000', email: 'dev@example.com' };
    return next();
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return response.status(401).json({ error: 'Invalid or expired session.' });
    }

    request.user = { id: user.id, email: user.email };
    return next();
  } catch (err) {
    return response.status(401).json({ error: 'Authentication failed.' });
  }
};
