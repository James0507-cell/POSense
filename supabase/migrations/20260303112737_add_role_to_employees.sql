CREATE TYPE public.employee_role AS ENUM (
  'Admin',
  'Store Manager',
  'Products and Inventory Manager',
  'Sales & Expense Analyst',
  'Inventory Clerk',
  'Cashier'
);

ALTER TABLE public.employees 
ADD COLUMN role public.employee_role;;
