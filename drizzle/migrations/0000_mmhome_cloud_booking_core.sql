CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests int NOT NULL DEFAULT 2,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  rate text NOT NULL DEFAULT 'flexible',
  total int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  stripe_session_id text,
  refund int,
  source text NOT NULL DEFAULT 'web',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_dates_ok CHECK (check_out > check_in),
  CONSTRAINT no_overlap EXCLUDE USING gist (daterange(check_in, check_out) WITH &&) WHERE (status IN ('pending','confirmed'))
);
GRANT SELECT (check_in, check_out, status, expires_at) ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public sees dates only" ON public.bookings FOR SELECT TO anon USING (true);
CREATE POLICY "Admins full access" ON public.bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT block_dates_ok CHECK (end_date > start_date)
);
GRANT SELECT (start_date, end_date) ON public.blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public sees block dates" ON public.blocks FOR SELECT TO anon USING (true);
CREATE POLICY "Admins manage blocks" ON public.blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.price_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  price int,
  min_nights int,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT override_dates_ok CHECK (end_date >= start_date)
);
GRANT SELECT (start_date, end_date, price, min_nights) ON public.price_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_overrides TO authenticated;
GRANT ALL ON public.price_overrides TO service_role;
ALTER TABLE public.price_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads pricing" ON public.price_overrides FOR SELECT TO anon USING (true);
CREATE POLICY "Admins manage pricing" ON public.price_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));