-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by INTEGER REFERENCES public.employees(employee_id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance when searching by table or record
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs(changed_at);

-- Create the trigger function
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
            v_old_data->>'id'
        );
        -- For deletes, the 'updated_by' info is in the OLD record if it existed
        BEGIN
            v_changed_by := (v_old_data->>'updated_by')::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            v_changed_by := NULL;
        END;
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
