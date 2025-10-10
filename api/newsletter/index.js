import { applyCors } from '../_lib/cors.js';
import { supabase } from '../_lib/supabaseClient.js';

async function requireAdmin(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return null;
  }

  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email)
    .single();

  if (adminError || !adminData) {
    res.status(403).json({ error: 'Not authorized' });
    return null;
  }

  return user;
}

export default async function handler(req, res) {
  if (!applyCors(req, res)) return;

  const { method } = req;

  switch (method) {
    case 'GET': {
      const user = await requireAdmin(req, res);
      if (!user) return;

      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id,email,status,subscribed_at')
        .order('subscribed_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data ?? []);
    }

    case 'POST': {
      const { email } = req.body || {};

      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const sanitizedEmail = String(email).trim().toLowerCase();

      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert({ email: sanitizedEmail, status: 'active' }, { onConflict: 'email' })
        .select('id,status,subscribed_at')
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
