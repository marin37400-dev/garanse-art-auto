INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on invoices" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'invoices');

CREATE POLICY "Service role insert on invoices" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'invoices');