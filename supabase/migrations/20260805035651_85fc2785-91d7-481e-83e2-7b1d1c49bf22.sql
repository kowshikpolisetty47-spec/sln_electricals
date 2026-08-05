CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Piece',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  electrician_name TEXT,
  gst_enabled BOOLEAN NOT NULL DEFAULT false,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimates TO anon, authenticated;
GRANT ALL ON public.estimates TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage products" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage estimates" ON public.estimates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX products_name_idx ON public.products (lower(name));
CREATE INDEX products_category_idx ON public.products (category);

INSERT INTO public.products (name, category, unit, price) VALUES
('Finolex 1.0 sq mm Wire (90m)', 'Wires', 'Roll', 1450.00),
('Finolex 1.5 sq mm Wire (90m)', 'Wires', 'Roll', 2050.00),
('Finolex 2.5 sq mm Wire (90m)', 'Wires', 'Roll', 3250.00),
('Polycab 4.0 sq mm Wire (90m)', 'Wires', 'Roll', 5100.00),
('3 Core Flexible Copper Cable', 'Wires', 'Meter', 48.00),
('Anchor Roma 6A One Way Switch', 'Switches', 'Piece', 65.00),
('Anchor Roma 16A Switch', 'Switches', 'Piece', 110.00),
('Legrand Modular 2 Way Switch', 'Switches', 'Piece', 145.00),
('Anchor 6A 3 Pin Socket', 'Switches', 'Piece', 85.00),
('Bell Push Switch', 'Switches', 'Piece', 70.00),
('8 Module PVC Switch Box', 'Switches', 'Piece', 190.00),
('Supreme 1/2 inch PVC Pipe (3m)', 'Pipes', 'Piece', 105.00),
('Supreme 3/4 inch PVC Pipe (3m)', 'Pipes', 'Piece', 155.00),
('Astral 1 inch CPVC Pipe (3m)', 'Pipes', 'Piece', 320.00),
('4 inch SWR Drain Pipe (3m)', 'Pipes', 'Piece', 640.00),
('20mm PVC Conduit Pipe', 'Pipes', 'Meter', 28.00),
('1/2 inch PVC Elbow', 'Fittings', 'Piece', 14.00),
('3/4 inch PVC Tee', 'Fittings', 'Piece', 22.00),
('1 inch CPVC Coupler', 'Fittings', 'Piece', 35.00),
('Brass Male Threaded Adapter 1/2 inch', 'Fittings', 'Piece', 95.00),
('PVC Solvent Cement 100ml', 'Fittings', 'Piece', 85.00),
('Teflon Tape', 'Fittings', 'Piece', 12.00),
('Philips 9W LED Bulb', 'Lights', 'Piece', 105.00),
('Philips 12W LED Bulb', 'Lights', 'Piece', 145.00),
('Wipro 20W LED Batten', 'Lights', 'Piece', 340.00),
('12W LED Panel Light Round', 'Lights', 'Piece', 420.00),
('Decorative LED Strip Light (5m)', 'Lights', 'Roll', 650.00),
('Crompton 1200mm Ceiling Fan', 'Fans', 'Piece', 1850.00),
('Havells 1400mm Ceiling Fan', 'Fans', 'Piece', 2450.00),
('Usha 300mm Wall Fan', 'Fans', 'Piece', 1650.00),
('6 inch Exhaust Fan', 'Fans', 'Piece', 1150.00),
('Jaquar Angle Cock', 'Plumbing Accessories', 'Piece', 480.00),
('Health Faucet with Hose', 'Plumbing Accessories', 'Piece', 620.00),
('Stainless Steel Shower Head 6 inch', 'Plumbing Accessories', 'Piece', 540.00),
('PVC Bottle Trap', 'Plumbing Accessories', 'Piece', 310.00),
('Bib Cock Brass', 'Plumbing Accessories', 'Piece', 395.00),
('Havells 16A MCB Single Pole', 'MCB & DB', 'Piece', 235.00),
('4 Way Distribution Board', 'MCB & DB', 'Piece', 890.00),
('40A ELCB Double Pole', 'MCB & DB', 'Piece', 1750.00),
('PVC Insulation Tape', 'Accessories', 'Piece', 15.00),
('Casing Capping 1 inch (Box)', 'Accessories', 'Box', 480.00),
('Wire Nail Clips (Box)', 'Accessories', 'Box', 60.00);