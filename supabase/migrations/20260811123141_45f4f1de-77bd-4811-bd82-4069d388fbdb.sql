CREATE TABLE public.order_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Accessories',
  unit TEXT NOT NULL DEFAULT 'Piece',
  quantity NUMERIC NOT NULL DEFAULT 1,
  supplier TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_list TO authenticated;
GRANT ALL ON public.order_list TO service_role;

ALTER TABLE public.order_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view order list" ON public.order_list
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can insert order list" ON public.order_list
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can update order list" ON public.order_list
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can delete order list" ON public.order_list
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_order_list_updated_at
  BEFORE UPDATE ON public.order_list
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();