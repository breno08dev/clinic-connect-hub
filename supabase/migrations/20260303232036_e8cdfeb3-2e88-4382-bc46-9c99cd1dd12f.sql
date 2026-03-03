
-- Clinics table
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  primary_color TEXT NOT NULL DEFAULT '#0EA5E9',
  phone TEXT,
  whatsapp TEXT,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Clinics RLS: public can read by slug, owners can manage
CREATE POLICY "Anyone can view clinics" ON public.clinics
  FOR SELECT USING (true);

CREATE POLICY "Owners can insert clinics" ON public.clinics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their clinics" ON public.clinics
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their clinics" ON public.clinics
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Appointments RLS: anyone can insert (public booking), owners can view/manage
CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Clinic owners can view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic owners can update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic owners can delete appointments" ON public.appointments
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.clinics
      WHERE clinics.id = appointments.clinic_id
      AND clinics.user_id = auth.uid()
    )
  );
