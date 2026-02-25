-- Add non-negative check constraints to products
ALTER TABLE public.products
ADD CONSTRAINT products_cost_price_check CHECK (cost_price >= 0),
ADD CONSTRAINT products_selling_price_check CHECK (selling_price >= 0);

-- Add non-negative check constraints to inventory
-- Mapping: "minimum" -> minimum, "threshold" -> reorder_level, "quantity" -> quantity
ALTER TABLE public.inventory
ADD CONSTRAINT inventory_quantity_check CHECK (quantity >= 0),
ADD CONSTRAINT inventory_minimum_check CHECK (minimum >= 0),
ADD CONSTRAINT inventory_reorder_level_check CHECK (reorder_level >= 0);

-- Add non-negative check constraint to sales
ALTER TABLE public.sales
ADD CONSTRAINT sales_total_amount_check CHECK (total_amount >= 0);

-- Add non-negative check constraint to expenses
ALTER TABLE public.expenses
ADD CONSTRAINT expenses_amount_check CHECK (amount >= 0);
;
