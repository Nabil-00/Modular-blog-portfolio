# Supabase Blog API & Admin Dashboard

A standalone blog API with admin dashboard, built for Vercel deployment with Supabase backend.

## Architecture

- **API Endpoints** (`/api/*`) - RESTful API for blog posts
- **Admin Dashboard** (`/admin/*`) - Web interface for content management
- **Database** - Supabase (PostgreSQL)
- **Deployment** - Vercel serverless functions

## Setup Instructions

### 1. Supabase Setup

Create the following tables in your Supabase project:

#### Posts Table
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT 
  USING (true);
```

#### Admins Table
```sql
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
```

### 2. Environment Variables

Set these in Vercel dashboard (Settings → Environment Variables):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (found in Supabase settings)
- `ALLOWED_ORIGINS` - (Optional) Comma-separated list of allowed origins for CORS

### 3. Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## API Endpoints

### Public Endpoints

- `GET /api/posts` - List all posts
- `GET /api/posts/[id]` - Get single post

### Protected Endpoints (Require Admin Auth)

- `POST /api/posts` - Create new post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `POST /api/auth/login` - Admin login

## Admin Dashboard

Access at `/admin/` after deployment.

### Features
- Login with email/password
- Create, edit, delete posts
- Session persistence
- Responsive design
- Dark mode support

## Connecting to BizLand Frontend

Once deployed, update your BizLand frontend to use the API:

1. Get your deployment URL (e.g., `https://your-blog-api.vercel.app`)
2. Update BizLand's `blog.js` to fetch from your API:

```javascript
// In BizLand's assets/js/blog.js
const API_URL = 'https://your-blog-api.vercel.app/api';

fetch(`${API_URL}/posts`)
  .then(response => response.json())
  .then(posts => {
    // Display posts
  });
```

3. Add your BizLand domain to `ALLOWED_ORIGINS` in Vercel environment variables

## Development

```bash
# Install dependencies
npm install

# Run locally (requires Vercel CLI)
vercel dev
```

## Security Notes

- Never commit `.env` files with real credentials
- Use environment variables in Vercel dashboard
- Keep service role key secret
- Add specific origins to `ALLOWED_ORIGINS` in production
