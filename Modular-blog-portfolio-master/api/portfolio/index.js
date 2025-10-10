import { applyCors } from '../_lib/cors.js';
import { supabase } from '../_lib/supabaseClient.js';

export default async function handler(req, res) {
  if (!applyCors(req, res)) return;

  const { method } = req;

  if (method === 'GET') {
    const { data, error } = await supabase
      .from('portfolio')
      .select('id,title,image_url,content,created_at,updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data ?? []);
  }

  if (method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email)
      .single();

    if (adminError || !adminData) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, image_url, content } = req.body;

    // Build insert object - content defaults to empty string if not provided
    const insertData = { 
      title, 
      image_url,
      content: content || '' // Default to empty string to satisfy NOT NULL constraint
    };

    const { data, error } = await supabase
      .from('portfolio')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
