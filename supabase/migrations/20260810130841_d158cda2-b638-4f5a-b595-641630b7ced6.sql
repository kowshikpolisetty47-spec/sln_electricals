ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimate_time text;