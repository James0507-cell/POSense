CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_record_id TEXT;
    v_changed_by INTEGER;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := COALESCE(
            v_new_data->>'product_id', 
            v_new_data->>'sale_id', 
            v_new_data->>'inventory_id', 
            v_new_data->>'employee_id',
            v_new_data->>'expense_id',
            v_new_data->>'refund_id',
            v_new_data->>'refund_item_id',
            v_new_data->>'sales_item_id',
            v_new_data->>'payment_type_id',
            v_new_data->>'id'
        );
        -- Try to get the employee who performed the update
        BEGIN
            v_changed_by := (v_new_data->>'updated_by')::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            v_changed_by := NULL;
        END;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := COALESCE(
            v_new_data->>'product_id', 
            v_new_data->>'sale_id', 
            v_new_data->>'inventory_id', 
            v_new_data->>'employee_id',
            v_new_data->>'expense_id',
            v_new_data->>'refund_id',
            v_new_data->>'refund_item_id',
            v_new_data->>'sales_item_id',
            v_new_data->>'payment_type_id',
            v_new_data->>'id'
        );
        -- Try to get the employee who performed the insert
        BEGIN
            v_changed_by := (v_new_data->>'created_by')::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            v_changed_by := NULL;
        END;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := COALESCE(
            v_old_data->>'product_id', 
            v_old_data->>'sale_id', 
            v_old_data->>'inventory_id', 
            v_old_data->>'employee_id',
            v_old_data->>'expense_id',
            v_old_data->>'refund_id',
            v_old_data->>'refund_item_id',
            v_old_data->>'sales_item_id',
            v_old_data->>'payment_type_id',
            v_old_data->>'id'
        );
        -- For deletes, the 'updated_by' info is in the OLD record if it existed
        BEGIN
            v_changed_by := (v_old_data->>'updated_by')::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            v_changed_by := NULL;
        END;
    END IF;

    -- If we still don't have a record_id, we MUST provide something to avoid NOT NULL constraint failure
    -- We'll use the first key available or 'unknown'
    IF v_record_id IS NULL THEN
        v_record_id := 'unknown';
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action_type,
        old_data,
        new_data,
        changed_by
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        v_old_data,
        v_new_data,
        v_changed_by
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
;
