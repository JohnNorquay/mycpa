-- Migration: Tax Planning Tables
-- Description: Creates tax_documents and tax_projections tables

-- Tax Documents
CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_year INTEGER NOT NULL,
  document_type TEXT,
  file_path TEXT NOT NULL,
  extracted_data JSONB,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Tax Projections
CREATE TABLE IF NOT EXISTS tax_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_year INTEGER NOT NULL,
  projection_date DATE DEFAULT CURRENT_DATE,
  estimated_income DECIMAL(12,2),
  estimated_deductions DECIMAL(12,2),
  estimated_tax_liability DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_projections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_documents
CREATE POLICY "Users can view own tax documents" ON tax_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax documents" ON tax_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax documents" ON tax_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax documents" ON tax_documents
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tax_projections
CREATE POLICY "Users can view own tax projections" ON tax_projections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax projections" ON tax_projections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax projections" ON tax_projections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax projections" ON tax_projections
  FOR DELETE USING (auth.uid() = user_id);
