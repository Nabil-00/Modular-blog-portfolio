-- Migration SQL for Products and Portfolio tables
-- Run this in your Supabase SQL Editor

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10, 2),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  project_url TEXT,
  technologies TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
-- Allow public read access
CREATE POLICY "Allow public read access on products"
  ON products
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert (you can restrict this further if needed)
CREATE POLICY "Allow authenticated insert on products"
  ON products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update on products"
  ON products
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete on products"
  ON products
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for portfolio table
-- Allow public read access
CREATE POLICY "Allow public read access on portfolio"
  ON portfolio
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert on portfolio"
  ON portfolio
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update on portfolio"
  ON portfolio
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
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
CREATE POLICY "Allow public read access on images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload on images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated update on images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their uploads
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
COMMENT ON TABLE portfolio IS 'Stores portfolio project information';
COMMENT ON COLUMN products.price IS 'Product price in decimal format';
COMMENT ON COLUMN products.category IS 'Product category for filtering';
COMMENT ON COLUMN portfolio.project_url IS 'URL to the live project or repository';
COMMENT ON COLUMN portfolio.technologies IS 'Comma-separated list of technologies used';
