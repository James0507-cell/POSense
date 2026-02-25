CREATE OR REPLACE VIEW public.v_audit_activity AS
SELECT 
    a.id,
    a.table_name,
    a.record_id,
    a.action_type,
    COALESCE(e.first_name || ' ' || e.last_name, 'System/Unknown') as actor_name,
    a.changed_at,
    -- For UPDATES, this shows only the fields that actually changed
    -- For INSERTS/DELETES, it shows the full record
    CASE 
        WHEN a.action_type = 'UPDATE' THEN (
            SELECT jsonb_object_agg(key, value)
            FROM jsonb_each(a.new_data)
            WHERE a.old_data->key IS DISTINCT FROM value
        )
        WHEN a.action_type = 'INSERT' THEN a.new_data
        WHEN a.action_type = 'DELETE' THEN a.old_data
    END as change_details,
    a.old_data,
    a.new_data
FROM public.audit_logs a
LEFT JOIN public.employees e ON a.changed_by = e.employee_id;
;
