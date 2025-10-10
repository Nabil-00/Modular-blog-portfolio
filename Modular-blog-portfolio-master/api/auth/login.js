import { applyCors } from '../_lib/cors.js';
import { supabase } from '../_lib/supabaseClient.js';

export default async function handler(req, res) {
  if (!applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('email')
    .eq('email', data.user.email)
    .single();

  if (adminError || !adminData) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  return res.status(200).json({
    access_token: data.session.access_token,
    user: {
      email: data.user.email,
      id: data.user.id
    }
  });
}
