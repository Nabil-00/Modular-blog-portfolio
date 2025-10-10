# Admin Dashboard Setup Guide

## Overview
The admin dashboard now features a modern, intuitive interface with:
- **Side panel navigation** for switching between Blog Posts, Products, and Portfolio
- **Image upload functionality** - upload images directly instead of using URLs
- **Multi-content type support** - manage blogs, products, and portfolio projects from one dashboard

## Database Setup

### 1. Run the Migration SQL

Open your Supabase project dashboard and navigate to the SQL Editor. Run the SQL commands from `database-migration.sql` to create:

- `products` table
- `portfolio` table  
- `images` storage bucket
- Appropriate Row Level Security (RLS) policies

### 2. Create the Images Storage Bucket (if needed)

If the SQL migration didn't create the storage bucket automatically:

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it `images`
4. Make it **Public**
5. Click **Create bucket**

### 3. Verify Tables

Check that these tables exist in your database:
- `posts` (should already exist)
- `products` (new)
- `portfolio` (new)
- `admins` (should already exist)

## Features

### Blog Posts Section
- Create and manage blog posts
- Upload featured images
- Rich text content

### Products Section
- Add product listings
- Set prices and categories
- Upload product images
- Product descriptions

### Portfolio Section
- Showcase projects
- Add project URLs
- List technologies used
- Upload project screenshots

## Image Upload

The new image upload system:
1. **Select a file** using the file input
2. **Preview** the image before uploading
3. **Automatic upload** to Supabase Storage when saving
4. **Public URLs** generated automatically
5. **Remove/replace** images easily

## API Endpoints

### Blog Posts
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create post (auth required)
- `GET /api/posts/[id]` - Get single post
- `PUT /api/posts/[id]` - Update post (auth required)
- `DELETE /api/posts/[id]` - Delete post (auth required)

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product (auth required)
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product (auth required)
- `DELETE /api/products/[id]` - Delete product (auth required)

### Portfolio
- `GET /api/portfolio` - List all portfolio items
- `POST /api/portfolio` - Create portfolio item (auth required)
- `GET /api/portfolio/[id]` - Get single portfolio item
- `PUT /api/portfolio/[id]` - Update portfolio item (auth required)
- `DELETE /api/portfolio/[id]` - Delete portfolio item (auth required)

### Image Upload
- `POST /api/upload` - Upload image (auth required)
  - Accepts multipart/form-data
  - Returns public URL

## Usage

1. **Login** with your admin credentials
2. **Select a section** from the side panel (Blog, Products, or Portfolio)
3. **Click the "New" button** to create an item
4. **Fill in the form**:
   - Title (required)
   - Image (optional - upload a file)
   - Section-specific fields (price, category, project URL, etc.)
   - Content/Description (required)
5. **Save** to create or update

## Responsive Design

The dashboard is fully responsive:
- **Desktop**: Side panel + content area
- **Mobile**: Horizontal scrolling navigation tabs

## Dark Mode

The dashboard automatically adapts to your system's dark mode preference.

## Security

- All write operations require authentication
- Admin verification through the `admins` table
- Row Level Security (RLS) policies protect data
- Image uploads restricted to authenticated users

## Troubleshooting

### Images not uploading
1. Check that the `images` bucket exists in Supabase Storage
2. Verify the bucket is set to **Public**
3. Check storage policies are correctly set
4. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in environment variables

### Products/Portfolio not showing
1. Run the migration SQL to create the tables
2. Check RLS policies are enabled
3. Verify API endpoints are deployed

### Authentication issues
1. Ensure you're in the `admins` table
2. Check your session hasn't expired (stored in sessionStorage)
3. Try logging out and back in

## Environment Variables

Required in your `.env` or Vercel environment:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Next Steps

- Customize the form fields for your needs
- Add more content types by following the same pattern
- Integrate the public-facing pages to display products and portfolio
- Add image optimization/resizing
- Implement drag-and-drop file upload
