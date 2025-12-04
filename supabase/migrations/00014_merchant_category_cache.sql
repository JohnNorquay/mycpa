-- Create merchant_category_cache table for storing AI categorization results
-- This improves performance by caching frequently categorized merchants

CREATE TABLE IF NOT EXISTS public.merchant_category_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_tax_deductible BOOLEAN NOT NULL DEFAULT false,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, merchant_name)
);

-- Add indexes for performance
CREATE INDEX idx_merchant_cache_user_merchant ON public.merchant_category_cache(user_id, merchant_name);
CREATE INDEX idx_merchant_cache_updated ON public.merchant_category_cache(updated_at DESC);

-- Enable RLS
ALTER TABLE public.merchant_category_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own merchant cache"
  ON public.merchant_category_cache
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchant cache"
  ON public.merchant_category_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant cache"
  ON public.merchant_category_cache
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merchant cache"
  ON public.merchant_category_cache
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.merchant_category_cache IS 'Caches AI-categorized merchant data to improve performance and reduce API calls';
