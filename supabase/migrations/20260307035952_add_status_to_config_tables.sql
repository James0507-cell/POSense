-- Add status to brands
ALTER TABLE public.brands ADD COLUMN status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'));

-- Add status to expense_categories
ALTER TABLE public.expense_categories ADD COLUMN status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'));

-- Add status to paymenttypes
ALTER TABLE public.paymenttypes ADD COLUMN status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'));
;
