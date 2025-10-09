import { applyCors } from '../../api/_lib/cors.js';
import { supabase } from '../../api/_lib/supabaseClient.js';

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

  const {
    query: { id },
    method,
  } = req;

  if (!id) {
    return res.status(400).json({ error: 'Missing product id' });
  }

  switch (method) {
    case 'GET': {
      const { data, error } = await supabase
        .from('products')
        .select('id,title,content,image_url,category,created_at,updated_at')
        .eq('id', id)
        .single();

      if (error) {
        const status = error.code === 'PGRST116' ? 404 : 500;
        return res.status(status).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    case 'PUT': {
      const user = await requireAdmin(req, res);
      if (!user) return;

      const { title, content, image_url, category } = req.body;

      const { data, error } = await supabase
        .from('products')
        .update({ title, content, image_url, category, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        const status = error.code === 'PGRST116' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    case 'DELETE': {
      const user = await requireAdmin(req, res);
      if (!user) return;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        const status = error.code === 'PGRST116' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }

      return res.status(204).end();
    }

    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
