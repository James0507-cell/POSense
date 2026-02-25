-- 1. First, let's fix the existing sales_items_inventory_decrement to check status
-- This ensures that when a sale item is inserted, it only decrements if the sale is confirmed
CREATE OR REPLACE FUNCTION public.sales_items_inventory_decrement()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
BEGIN
    -- Get current status of the sale
    SELECT status::text INTO v_status FROM public.sales WHERE sale_id = NEW.sale_id;

    -- Only decrement if the sale is confirmed (not voided)
    IF v_status = 'confirmed' THEN
        UPDATE public.inventory
        SET quantity = quantity - NEW.quantity,
            last_updated = NOW()
        WHERE product_id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the new function to handle status transitions on the sales table
CREATE OR REPLACE FUNCTION public.sales_status_inventory_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act if the status has actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        
        -- Transition: confirmed -> voided (Return items to inventory)
        IF OLD.status = 'confirmed' AND NEW.status = 'voided' THEN
            UPDATE public.inventory i
            SET quantity = i.quantity + si.quantity,
                last_updated = NOW()
            FROM public.sales_items si
            WHERE si.sale_id = NEW.sale_id
              AND i.product_id = si.product_id;
        
        -- Transition: voided -> confirmed (Deduct items from inventory)
        ELSIF OLD.status = 'voided' AND NEW.status = 'confirmed' THEN
            UPDATE public.inventory i
            SET quantity = i.quantity - si.quantity,
                last_updated = NOW()
            FROM public.sales_items si
            WHERE si.sale_id = NEW.sale_id
              AND i.product_id = si.product_id;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the sync trigger to the sales table
DROP TRIGGER IF EXISTS trg_sales_status_inventory_sync ON public.sales;
CREATE TRIGGER trg_sales_status_inventory_sync
AFTER UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.sales_status_inventory_sync();

-- 4. Remove approved_by from refunds table as requested
ALTER TABLE public.refunds DROP COLUMN IF EXISTS approved_by;
;
