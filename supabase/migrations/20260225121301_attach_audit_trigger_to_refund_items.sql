-- Attach audit trigger to refund_items
CREATE TRIGGER audit_refund_items_trigger 
AFTER INSERT OR UPDATE OR DELETE ON public.refund_items 
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
;
