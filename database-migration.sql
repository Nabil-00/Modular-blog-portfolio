-- Migration SQL for Products and Portfolio tables
-- Run this in your Supabase SQL Editor

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
DROP POLICY IF EXISTS "Allow public read access on products" ON products;
CREATE POLICY "Allow public read access on products"
  ON products
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert (you can restrict this further if needed)
DROP POLICY IF EXISTS "Allow authenticated insert on products" ON products;
CREATE POLICY "Allow authenticated insert on products"
  ON products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated update on products" ON products;
CREATE POLICY "Allow authenticated update on products"
  ON products
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Allow authenticated delete on products" ON products;
CREATE POLICY "Allow authenticated delete on products"
  ON products
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for portfolio table
-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access on portfolio" ON portfolio;
CREATE POLICY "Allow public read access on portfolio"
  ON portfolio
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert
DROP POLICY IF EXISTS "Allow authenticated insert on portfolio" ON portfolio;
CREATE POLICY "Allow authenticated insert on portfolio"
  ON portfolio
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated update on portfolio" ON portfolio;
CREATE POLICY "Allow authenticated update on portfolio"
  ON portfolio
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Allow authenticated delete on portfolio" ON portfolio;
CREATE POLICY "Allow authenticated delete on portfolio"
  ON portfolio
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for images bucket
-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access on images" ON storage.objects;
CREATE POLICY "Allow public read access on images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Allow authenticated upload on images" ON storage.objects;
CREATE POLICY "Allow authenticated upload on images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their uploads
DROP POLICY IF EXISTS "Allow authenticated update on images" ON storage.objects;
CREATE POLICY "Allow authenticated update on images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their uploads
DROP POLICY IF EXISTS "Allow authenticated delete on images" ON storage.objects;
CREATE POLICY "Allow authenticated delete on images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_created_at ON portfolio(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE products IS 'Stores product information for the e-commerce section';
COMMENT ON COLUMN products.category IS 'Product category for filtering';
COMMENT ON TABLE portfolio IS 'Stores portfolio gallery images with captions';

-- Create contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role insert on contact_messages" ON contact_messages;
CREATE POLICY "Allow service role insert on contact_messages"
  ON contact_messages
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role select on contact_messages" ON contact_messages;
CREATE POLICY "Allow service role select on contact_messages"
  ON contact_messages
  FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role update on contact_messages" ON contact_messages;
CREATE POLICY "Allow service role update on contact_messages"
  ON contact_messages
  FOR UPDATE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role delete on contact_messages" ON contact_messages;
CREATE POLICY "Allow service role delete on contact_messages"
  ON contact_messages
  FOR DELETE
  USING (auth.role() = 'service_role');

COMMENT ON TABLE contact_messages IS 'Stores contact form submissions from the marketing site';

-- Create newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role insert on newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Allow service role insert on newsletter_subscribers"
  ON newsletter_subscribers
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role select on newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Allow service role select on newsletter_subscribers"
  ON newsletter_subscribers
  FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role update on newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Allow service role update on newsletter_subscribers"
  ON newsletter_subscribers
  FOR UPDATE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role delete on newsletter_subscribers" ON newsletter_subscribers;
CREATE POLICY "Allow service role delete on newsletter_subscribers"
  ON newsletter_subscribers
  FOR DELETE
  USING (auth.role() = 'service_role');

COMMENT ON TABLE newsletter_subscribers IS 'Stores newsletter emails collected from the marketing site';
