import { applyCors } from './_lib/cors.js';
import { supabase } from './_lib/supabaseClient.js';

// Configure body parser to handle larger files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    // Parse the multipart form data
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    // For Vercel, we need to handle the raw body
    // This is a simplified approach - in production, you'd use a library like 'formidable' or 'busboy'
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'Invalid multipart form data' });
    }

    // Get the raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse the multipart data to extract the file
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = [];
    let start = 0;
    
    while (true) {
      const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
      if (boundaryIndex === -1) break;
      
      const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
      if (nextBoundaryIndex === -1) break;
      
      parts.push(buffer.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex));
      start = nextBoundaryIndex;
    }

    // Find the file part
    let fileBuffer = null;
    let fileName = 'upload';
    let contentTypeFile = 'application/octet-stream';

    for (const part of parts) {
      const partStr = part.toString('utf8', 0, Math.min(500, part.length));
      
      if (partStr.includes('Content-Disposition') && partStr.includes('filename')) {
        // Extract filename
        const filenameMatch = partStr.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          fileName = filenameMatch[1];
        }

        // Extract content type
        const contentTypeMatch = partStr.match(/Content-Type:\s*([^\r\n]+)/i);
        if (contentTypeMatch) {
          contentTypeFile = contentTypeMatch[1].trim();
        }

        // Find where the actual file data starts (after the headers)
        const headerEndIndex = part.indexOf('\r\n\r\n');
        if (headerEndIndex !== -1) {
          // Extract file data, removing trailing \r\n
          fileBuffer = part.slice(headerEndIndex + 4, part.length - 2);
        }
        break;
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No file found in request' });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}-${randomStr}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(uniqueFileName, fileBuffer, {
        contentType: contentTypeFile,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return res.status(500).json({ error: `Upload failed: ${error.message}` });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(uniqueFileName);

    return res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
