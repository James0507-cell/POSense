


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."employee_status" AS ENUM (
    'Active',
    'Inactive'
);


ALTER TYPE "public"."employee_status" OWNER TO "postgres";


CREATE TYPE "public"."sale_status" AS ENUM (
    'confirmed',
    'voided'
);


ALTER TYPE "public"."sale_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."products_set_vat"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.vat := ROUND( (COALESCE(NEW.selling_price, 0) * 0.12)::numeric, 2);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."products_set_vat"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refund_items_calc_subtotal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.subtotal := (NEW.quantity_refunded * NEW.price_per_unit)::numeric(12,2);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."refund_items_calc_subtotal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refund_items_inventory_increment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_product_id integer;
BEGIN
  -- Find product_id from referenced sale item
  SELECT product_id INTO v_product_id FROM public.sales_items WHERE sales_item_id = NEW.sale_item_id;

  IF v_product_id IS NULL THEN
    -- No matching sales_item found; nothing to do
    RETURN NEW;
  END IF;

  -- Add refunded quantity back to all inventory records for the product
  UPDATE public.inventory
  SET quantity = quantity + COALESCE(NEW.quantity_refunded, 0),
      last_updated = NOW()
  WHERE product_id = v_product_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."refund_items_inventory_increment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sales_items_inventory_decrement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Subtract sold quantity from all inventory records for the product
  UPDATE public.inventory
  SET quantity = quantity - NEW.quantity,
      last_updated = NOW()
  WHERE product_id = NEW.product_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sales_items_inventory_decrement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sales_items_status_trigger_fn"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Treat NULL refunded_quantity as 0
  IF NEW.refunded_quantity IS NULL THEN
    NEW.refunded_quantity := 0;
  END IF;

  -- Prevent negative refunded_quantity
  IF NEW.refunded_quantity < 0 THEN
    RAISE EXCEPTION 'refunded_quantity cannot be negative';
  END IF;

  -- Prevent refunded_quantity exceeding quantity
  IF NEW.quantity IS NOT NULL AND NEW.refunded_quantity > NEW.quantity THEN
    RAISE EXCEPTION 'refunded_quantity cannot exceed quantity';
  END IF;

  -- Set status based on refunded_quantity
  IF NEW.quantity IS NOT NULL AND NEW.refunded_quantity >= NEW.quantity THEN
    NEW.status := 'refunded';
  ELSIF NEW.refunded_quantity > 0 THEN
    NEW.status := 'partially_refunded';
  ELSE
    NEW.status := 'confirmed';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sales_items_status_trigger_fn"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sales_items_sync_inventory"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_net integer;
  old_net integer;
  qty_diff integer;
  remaining integer;
  inv_rec record;
BEGIN
  -- compute net quantities (sold minus refunded)
  new_net := COALESCE(NEW.quantity,0) - COALESCE(NEW.refunded_quantity,0);

  IF TG_OP = 'INSERT' THEN
    old_net := 0;
  ELSE
    old_net := COALESCE(OLD.quantity,0) - COALESCE(OLD.refunded_quantity,0);
  END IF;

  qty_diff := new_net - old_net; -- positive -> need to deduct; negative -> need to return stock

  IF qty_diff = 0 THEN
    RETURN NEW;
  END IF;

  IF qty_diff > 0 THEN
    -- Deduct stock (same as before)
    remaining := qty_diff;

    FOR inv_rec IN
      SELECT inventory_id, quantity
      FROM public.inventory
      WHERE product_id = NEW.product_id AND quantity > 0
      ORDER BY quantity DESC
      FOR UPDATE
    LOOP
      IF remaining <= 0 THEN
        EXIT;
      END IF;

      IF inv_rec.quantity >= remaining THEN
        UPDATE public.inventory
        SET quantity = inv_rec.quantity - remaining,
            last_updated = CURRENT_TIMESTAMP
        WHERE inventory_id = inv_rec.inventory_id;

        remaining := 0;
        EXIT;
      ELSE
        UPDATE public.inventory
        SET quantity = 0,
            last_updated = CURRENT_TIMESTAMP
        WHERE inventory_id = inv_rec.inventory_id;

        remaining := remaining - inv_rec.quantity;
      END IF;
    END LOOP;

    IF remaining > 0 THEN
      RAISE NOTICE 'Not enough inventory for product_id % — short by % units', NEW.product_id, remaining;
    END IF;

  ELSE
    -- qty_diff < 0 -> return stock to inventory
    remaining := -qty_diff; -- amount to return

    -- Add back starting with oldest inventory rows (by inventory_id). If none exist, create a new inventory row.
    FOR inv_rec IN
      SELECT inventory_id, quantity
      FROM public.inventory
      WHERE product_id = NEW.product_id
      ORDER BY inventory_id ASC
      FOR UPDATE
    LOOP
      IF remaining <= 0 THEN
        EXIT;
      END IF;

      -- Here we simply add to existing inventory rows up to their maximum (if maximum is defined)
      UPDATE public.inventory
      SET quantity = quantity + LEAST(remaining, COALESCE(NULLIF(maximum,0), remaining)),
          last_updated = CURRENT_TIMESTAMP
      WHERE inventory_id = inv_rec.inventory_id;

      -- Subtract how much we added. We can't easily know previous maximum; assume we can add all to this row
      remaining := remaining - LEAST(remaining, COALESCE(NULLIF(inv_rec.quantity,0), remaining));
    END LOOP;

    -- If still remaining, insert a new inventory row to hold returned stock
    IF remaining > 0 THEN
      INSERT INTO public.inventory(product_id, quantity, created_at, last_updated)
      VALUES (NEW.product_id, remaining, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      remaining := 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sales_items_sync_inventory"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sales_refund_after_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Cast NEW.status to text before using ILIKE to avoid enum casting errors with empty strings
  -- Check transition to refunded (case-insensitive), and previous status not already refunded
  IF NEW.status::text ILIKE 'refunded'
     AND (OLD.status IS NULL OR OLD.status::text NOT ILIKE 'refunded') THEN

    -- Update related sales_items (plural) rows for this sale
    UPDATE public.sales_items
    SET status = 'refunded',
        refunded_quantity = quantity
    WHERE sale_id = NEW.sale_id; -- Use sale_id instead of id
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sales_refund_after_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sales_refund_cascade_trigger_fn"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Case-insensitive check: cast status to text and lower it
  IF lower(NEW.status::text) = 'refunded' AND (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Update matching sales_items records
    UPDATE public.sales_items
    SET status = 'refunded', refunded_quantity = quantity
    WHERE sales_id = NEW.id
      AND (status IS DISTINCT FROM 'refunded' OR refunded_quantity IS DISTINCT FROM quantity);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sales_refund_cascade_trigger_fn"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sales_refund_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only act when status changed to 'Refunded'
  IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status = 'Refunded') THEN
    UPDATE public.sales_items
    SET
      status = 'refunded',
      refunded_quantity = quantity
    WHERE sale_id = NEW.sale_id
      AND (
        refunded_quantity IS DISTINCT FROM quantity
        OR lower(coalesce(status, '')) <> 'refunded'
      );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sales_refund_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "brand_id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" integer,
    "updated_by" integer
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."brands_brand_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."brands_brand_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."brands_brand_id_seq" OWNED BY "public"."brands"."brand_id";



CREATE TABLE IF NOT EXISTS "public"."cashiers" (
    "cashier_id" integer NOT NULL,
    "employee_id" integer NOT NULL,
    "is_active" smallint DEFAULT 1,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" integer,
    "updated_by" integer
);


ALTER TABLE "public"."cashiers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cashiers_cashier_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cashiers_cashier_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cashiers_cashier_id_seq" OWNED BY "public"."cashiers"."cashier_id";



CREATE TABLE IF NOT EXISTS "public"."refunds" (
    "refund_id" integer NOT NULL,
    "sale_id" integer NOT NULL,
    "refund_type" "text",
    "total_refund_amount" numeric(12,2),
    "processed_by" integer,
    "approved_by" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."refunds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "sale_id" integer NOT NULL,
    "sale_date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "employee_id" integer NOT NULL,
    "payment_type_id" integer NOT NULL,
    "total_amount" numeric DEFAULT 0.00,
    "total_tax" numeric DEFAULT 0.00,
    "updated_by" integer,
    "status" "public"."sale_status" DEFAULT 'confirmed'::"public"."sale_status"
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."confirmed_sales" AS
 SELECT "s"."sale_id",
    "s"."sale_date",
    (COALESCE("s"."total_amount", (0)::numeric) - COALESCE("r"."total_refunded", (0)::numeric)) AS "amount_paid"
   FROM ("public"."sales" "s"
     LEFT JOIN ( SELECT "refunds"."sale_id",
            "sum"(COALESCE("refunds"."total_refund_amount", (0)::numeric)) AS "total_refunded"
           FROM "public"."refunds"
          GROUP BY "refunds"."sale_id") "r" ON (("r"."sale_id" = "s"."sale_id")))
  WHERE ("s"."status" = 'confirmed'::"public"."sale_status");


ALTER VIEW "public"."confirmed_sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_credentials" (
    "credential_id" integer NOT NULL,
    "employee_id" integer NOT NULL,
    "username" character varying(100) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "last_login" timestamp without time zone,
    "created_by" integer,
    "updated_by" integer
);


ALTER TABLE "public"."employee_credentials" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."employee_credentials_credential_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."employee_credentials_credential_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."employee_credentials_credential_id_seq" OWNED BY "public"."employee_credentials"."credential_id";



CREATE TABLE IF NOT EXISTS "public"."employee_log" (
    "log_id" integer NOT NULL,
    "employee_id" integer NOT NULL,
    "action_type" character varying(50) NOT NULL,
    "action_description" "text",
    "log_time" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reference_id" integer
);


ALTER TABLE "public"."employee_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."employee_log_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."employee_log_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."employee_log_log_id_seq" OWNED BY "public"."employee_log"."log_id";



CREATE TABLE IF NOT EXISTS "public"."employees" (
    "employee_id" integer NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "contact_number" character varying(20) DEFAULT NULL::character varying,
    "email" character varying(255) DEFAULT NULL::character varying,
    "hire_date" "date",
    "status" "public"."employee_status" DEFAULT 'Active'::"public"."employee_status",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" integer,
    "updated_by" integer
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."employees_employee_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."employees_employee_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."employees_employee_id_seq" OWNED BY "public"."employees"."employee_id";



CREATE TABLE IF NOT EXISTS "public"."expense_categories" (
    "category_id" integer NOT NULL,
    "category_name" character varying(100) NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" integer,
    "updated_by" integer
);


ALTER TABLE "public"."expense_categories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."expense_categories_category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."expense_categories_category_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."expense_categories_category_id_seq" OWNED BY "public"."expense_categories"."category_id";



CREATE TABLE IF NOT EXISTS "public"."expense_items" (
    "expense_items_id" integer NOT NULL,
    "expense_id" integer NOT NULL,
    "item_name" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(12,2) DEFAULT 0.00 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expense_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."expense_items_expense_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."expense_items_expense_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."expense_items_expense_items_id_seq" OWNED BY "public"."expense_items"."expense_items_id";



CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "expense_id" integer NOT NULL,
    "category_id" integer NOT NULL,
    "created_by" integer,
    "description" character varying,
    "amount" numeric NOT NULL,
    "expense_date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_by" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."expenses_expense_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."expenses_expense_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."expenses_expense_id_seq" OWNED BY "public"."expenses"."expense_id";



CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "inventory_id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "location" character varying(255) NOT NULL,
    "minimum" integer NOT NULL,
    "maximum" integer NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "reorder_level" integer DEFAULT 10,
    "last_updated" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" integer,
    "updated_by" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."inventory_inventory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."inventory_inventory_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."inventory_inventory_id_seq" OWNED BY "public"."inventory"."inventory_id";



CREATE TABLE IF NOT EXISTS "public"."paymenttypes" (
    "payment_type_id" integer NOT NULL,
    "payment_name" character varying(50) NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."paymenttypes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."paymenttypes_payment_type_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."paymenttypes_payment_type_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."paymenttypes_payment_type_id_seq" OWNED BY "public"."paymenttypes"."payment_type_id";



CREATE TABLE IF NOT EXISTS "public"."products" (
    "product_id" integer NOT NULL,
    "brand_id" integer,
    "name" character varying(255) NOT NULL,
    "barcode" character varying(50) NOT NULL,
    "description" "text",
    "category" character varying(100) DEFAULT NULL::character varying,
    "cost_price" numeric(10,2) NOT NULL,
    "selling_price" numeric(10,2) NOT NULL,
    "vat" numeric(5,2) DEFAULT 0.00,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" integer,
    "updated_by" integer,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."products_product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."products_product_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."products_product_id_seq" OWNED BY "public"."products"."product_id";



CREATE TABLE IF NOT EXISTS "public"."refund_items" (
    "refund_item_id" integer NOT NULL,
    "refund_id" integer NOT NULL,
    "sale_item_id" integer NOT NULL,
    "quantity_refunded" integer,
    "price_per_unit" numeric(12,2),
    "subtotal" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."refund_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."refund_items_refund_item_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."refund_items_refund_item_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."refund_items_refund_item_id_seq" OWNED BY "public"."refund_items"."refund_item_id";



CREATE SEQUENCE IF NOT EXISTS "public"."refunds_refund_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."refunds_refund_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."refunds_refund_id_seq" OWNED BY "public"."refunds"."refund_id";



CREATE TABLE IF NOT EXISTS "public"."sales_items" (
    "sales_item_id" integer NOT NULL,
    "sale_id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric NOT NULL,
    "tax_amount" numeric DEFAULT 0.00
);


ALTER TABLE "public"."sales_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_items_sales_item_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sales_items_sales_item_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_items_sales_item_id_seq" OWNED BY "public"."sales_items"."sales_item_id";



CREATE SEQUENCE IF NOT EXISTS "public"."sales_sale_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sales_sale_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_sale_id_seq" OWNED BY "public"."sales"."sale_id";



CREATE TABLE IF NOT EXISTS "public"."stockclerks" (
    "stockclerk_id" integer NOT NULL,
    "employee_id" integer NOT NULL,
    "is_active" smallint DEFAULT 1,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" integer,
    "updated_by" integer
);


ALTER TABLE "public"."stockclerks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."stockclerks_stockclerk_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."stockclerks_stockclerk_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."stockclerks_stockclerk_id_seq" OWNED BY "public"."stockclerks"."stockclerk_id";



CREATE TABLE IF NOT EXISTS "public"."storemanagers" (
    "storemanager_id" integer NOT NULL,
    "employee_id" integer NOT NULL,
    "is_active" smallint DEFAULT 1,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_by" integer,
    "updated_by" integer
);


ALTER TABLE "public"."storemanagers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."storemanagers_storemanager_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."storemanagers_storemanager_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."storemanagers_storemanager_id_seq" OWNED BY "public"."storemanagers"."storemanager_id";



CREATE OR REPLACE VIEW "public"."top_selling_categories" AS
 SELECT COALESCE("p"."category", 'Unspecified'::character varying) AS "category",
    "sum"(((("si"."quantity" - COALESCE("ri"."qty_refunded", (0)::bigint)))::numeric * "si"."unit_price")) AS "total_amount_sold",
    "sum"(("si"."quantity" - COALESCE("ri"."qty_refunded", (0)::bigint))) AS "total_quantity_sold"
   FROM ((("public"."products" "p"
     JOIN "public"."sales_items" "si" ON (("si"."product_id" = "p"."product_id")))
     JOIN "public"."sales" "s" ON (("s"."sale_id" = "si"."sale_id")))
     LEFT JOIN ( SELECT "ri_1"."sale_item_id",
            "sum"("ri_1"."quantity_refunded") AS "qty_refunded"
           FROM "public"."refund_items" "ri_1"
          GROUP BY "ri_1"."sale_item_id") "ri" ON (("ri"."sale_item_id" = "si"."sales_item_id")))
  WHERE (("s"."status" IS NULL) OR ("s"."status" <> 'voided'::"public"."sale_status"))
  GROUP BY COALESCE("p"."category", 'Unspecified'::character varying)
 HAVING ("sum"(("si"."quantity" - COALESCE("ri"."qty_refunded", (0)::bigint))) <> (0)::numeric)
  ORDER BY ("sum"(((("si"."quantity" - COALESCE("ri"."qty_refunded", (0)::bigint)))::numeric * "si"."unit_price"))) DESC;


ALTER VIEW "public"."top_selling_categories" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."top_selling_products" AS
 SELECT "p"."product_id",
    "p"."name",
    "sum"(((("si"."quantity" - COALESCE("ri"."qty_refunded", (0)::bigint)))::numeric * "si"."unit_price")) AS "total_amount_sold"
   FROM ((("public"."products" "p"
     JOIN "public"."sales_items" "si" ON (("si"."product_id" = "p"."product_id")))
     JOIN "public"."sales" "s" ON (("s"."sale_id" = "si"."sale_id")))
     LEFT JOIN ( SELECT "si_1"."sales_item_id",
            "sum"("ri_1"."quantity_refunded") AS "qty_refunded"
           FROM ("public"."refund_items" "ri_1"
             JOIN "public"."sales_items" "si_1" ON (("si_1"."sales_item_id" = "ri_1"."sale_item_id")))
          GROUP BY "si_1"."sales_item_id") "ri" ON (("ri"."sales_item_id" = "si"."sales_item_id")))
  WHERE (("s"."status" IS NULL) OR ("s"."status" <> 'voided'::"public"."sale_status"))
  GROUP BY "p"."product_id", "p"."name"
 HAVING ("sum"(("si"."quantity" - COALESCE("ri"."qty_refunded", (0)::bigint))) > (0)::numeric)
  ORDER BY ("sum"(((("si"."quantity" - COALESCE("ri"."qty_refunded", (0)::bigint)))::numeric * "si"."unit_price"))) DESC;


ALTER VIEW "public"."top_selling_products" OWNER TO "postgres";


ALTER TABLE ONLY "public"."brands" ALTER COLUMN "brand_id" SET DEFAULT "nextval"('"public"."brands_brand_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cashiers" ALTER COLUMN "cashier_id" SET DEFAULT "nextval"('"public"."cashiers_cashier_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."employee_credentials" ALTER COLUMN "credential_id" SET DEFAULT "nextval"('"public"."employee_credentials_credential_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."employee_log" ALTER COLUMN "log_id" SET DEFAULT "nextval"('"public"."employee_log_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."employees" ALTER COLUMN "employee_id" SET DEFAULT "nextval"('"public"."employees_employee_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expense_categories" ALTER COLUMN "category_id" SET DEFAULT "nextval"('"public"."expense_categories_category_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expense_items" ALTER COLUMN "expense_items_id" SET DEFAULT "nextval"('"public"."expense_items_expense_items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expenses" ALTER COLUMN "expense_id" SET DEFAULT "nextval"('"public"."expenses_expense_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."inventory" ALTER COLUMN "inventory_id" SET DEFAULT "nextval"('"public"."inventory_inventory_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."paymenttypes" ALTER COLUMN "payment_type_id" SET DEFAULT "nextval"('"public"."paymenttypes_payment_type_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."products" ALTER COLUMN "product_id" SET DEFAULT "nextval"('"public"."products_product_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."refund_items" ALTER COLUMN "refund_item_id" SET DEFAULT "nextval"('"public"."refund_items_refund_item_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."refunds" ALTER COLUMN "refund_id" SET DEFAULT "nextval"('"public"."refunds_refund_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales" ALTER COLUMN "sale_id" SET DEFAULT "nextval"('"public"."sales_sale_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales_items" ALTER COLUMN "sales_item_id" SET DEFAULT "nextval"('"public"."sales_items_sales_item_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."stockclerks" ALTER COLUMN "stockclerk_id" SET DEFAULT "nextval"('"public"."stockclerks_stockclerk_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."storemanagers" ALTER COLUMN "storemanager_id" SET DEFAULT "nextval"('"public"."storemanagers_storemanager_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("brand_id");



ALTER TABLE ONLY "public"."cashiers"
    ADD CONSTRAINT "cashiers_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."cashiers"
    ADD CONSTRAINT "cashiers_pkey" PRIMARY KEY ("cashier_id");



ALTER TABLE ONLY "public"."employee_credentials"
    ADD CONSTRAINT "employee_credentials_pkey" PRIMARY KEY ("credential_id");



ALTER TABLE ONLY "public"."employee_credentials"
    ADD CONSTRAINT "employee_credentials_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."employee_log"
    ADD CONSTRAINT "employee_log_pkey" PRIMARY KEY ("log_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."expense_categories"
    ADD CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."expense_items"
    ADD CONSTRAINT "expense_items_pkey" PRIMARY KEY ("expense_items_id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id");



ALTER TABLE ONLY "public"."paymenttypes"
    ADD CONSTRAINT "paymenttypes_pkey" PRIMARY KEY ("payment_type_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_barcode_key" UNIQUE ("barcode");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."refund_items"
    ADD CONSTRAINT "refund_items_pkey" PRIMARY KEY ("refund_item_id");



ALTER TABLE ONLY "public"."refunds"
    ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("refund_id");



ALTER TABLE ONLY "public"."sales_items"
    ADD CONSTRAINT "sales_items_pkey" PRIMARY KEY ("sales_item_id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("sale_id");



ALTER TABLE ONLY "public"."stockclerks"
    ADD CONSTRAINT "stockclerks_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."stockclerks"
    ADD CONSTRAINT "stockclerks_pkey" PRIMARY KEY ("stockclerk_id");



ALTER TABLE ONLY "public"."storemanagers"
    ADD CONSTRAINT "storemanagers_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."storemanagers"
    ADD CONSTRAINT "storemanagers_pkey" PRIMARY KEY ("storemanager_id");



CREATE OR REPLACE TRIGGER "sales_after_update_refund" AFTER UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION "public"."sales_refund_after_update"();



CREATE OR REPLACE TRIGGER "set_updated_at_trigger" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_products_set_vat" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."products_set_vat"();



CREATE OR REPLACE TRIGGER "trg_refund_items_increment" AFTER INSERT ON "public"."refund_items" FOR EACH ROW EXECUTE FUNCTION "public"."refund_items_inventory_increment"();



CREATE OR REPLACE TRIGGER "trg_sales_items_decrement" AFTER INSERT ON "public"."sales_items" FOR EACH ROW EXECUTE FUNCTION "public"."sales_items_inventory_decrement"();



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cashiers"
    ADD CONSTRAINT "cashiers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cashiers"
    ADD CONSTRAINT "cashiers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cashiers"
    ADD CONSTRAINT "cashiers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_credentials"
    ADD CONSTRAINT "employee_credentials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_credentials"
    ADD CONSTRAINT "employee_credentials_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_credentials"
    ADD CONSTRAINT "employee_credentials_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_log"
    ADD CONSTRAINT "employee_log_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expense_categories"
    ADD CONSTRAINT "expense_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expense_categories"
    ADD CONSTRAINT "expense_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expense_items"
    ADD CONSTRAINT "expense_items_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("expense_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("category_id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_employee_id_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "fk_employees_created_by" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "fk_employees_updated_by" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."refund_items"
    ADD CONSTRAINT "fk_refund" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("refund_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refund_items"
    ADD CONSTRAINT "fk_sale_item" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sales_items"("sales_item_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("brand_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."sales_items"
    ADD CONSTRAINT "sales_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."sales_items"
    ADD CONSTRAINT "sales_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("sale_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "public"."paymenttypes"("payment_type_id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id");



ALTER TABLE ONLY "public"."stockclerks"
    ADD CONSTRAINT "stockclerks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stockclerks"
    ADD CONSTRAINT "stockclerks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stockclerks"
    ADD CONSTRAINT "stockclerks_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."storemanagers"
    ADD CONSTRAINT "storemanagers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."storemanagers"
    ADD CONSTRAINT "storemanagers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."storemanagers"
    ADD CONSTRAINT "storemanagers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."employees"("employee_id") ON DELETE SET NULL;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."products_set_vat"() TO "anon";
GRANT ALL ON FUNCTION "public"."products_set_vat"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."products_set_vat"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refund_items_calc_subtotal"() TO "anon";
GRANT ALL ON FUNCTION "public"."refund_items_calc_subtotal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_items_calc_subtotal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refund_items_inventory_increment"() TO "anon";
GRANT ALL ON FUNCTION "public"."refund_items_inventory_increment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_items_inventory_increment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sales_items_inventory_decrement"() TO "anon";
GRANT ALL ON FUNCTION "public"."sales_items_inventory_decrement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sales_items_inventory_decrement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sales_items_status_trigger_fn"() TO "anon";
GRANT ALL ON FUNCTION "public"."sales_items_status_trigger_fn"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sales_items_status_trigger_fn"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sales_items_sync_inventory"() TO "anon";
GRANT ALL ON FUNCTION "public"."sales_items_sync_inventory"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sales_items_sync_inventory"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sales_refund_after_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."sales_refund_after_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sales_refund_after_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sales_refund_cascade_trigger_fn"() TO "anon";
GRANT ALL ON FUNCTION "public"."sales_refund_cascade_trigger_fn"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sales_refund_cascade_trigger_fn"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sales_refund_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."sales_refund_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sales_refund_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."brands_brand_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cashiers" TO "anon";
GRANT ALL ON TABLE "public"."cashiers" TO "authenticated";
GRANT ALL ON TABLE "public"."cashiers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cashiers_cashier_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cashiers_cashier_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cashiers_cashier_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."refunds" TO "anon";
GRANT ALL ON TABLE "public"."refunds" TO "authenticated";
GRANT ALL ON TABLE "public"."refunds" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON TABLE "public"."confirmed_sales" TO "anon";
GRANT ALL ON TABLE "public"."confirmed_sales" TO "authenticated";
GRANT ALL ON TABLE "public"."confirmed_sales" TO "service_role";



GRANT ALL ON TABLE "public"."employee_credentials" TO "anon";
GRANT ALL ON TABLE "public"."employee_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_credentials" TO "service_role";



GRANT ALL ON SEQUENCE "public"."employee_credentials_credential_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."employee_credentials_credential_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."employee_credentials_credential_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."employee_log" TO "anon";
GRANT ALL ON TABLE "public"."employee_log" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."employee_log_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."employee_log_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."employee_log_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON SEQUENCE "public"."employees_employee_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."employees_employee_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."employees_employee_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expense_categories" TO "anon";
GRANT ALL ON TABLE "public"."expense_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."expense_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expense_categories_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expense_categories_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expense_categories_category_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expense_items" TO "anon";
GRANT ALL ON TABLE "public"."expense_items" TO "authenticated";
GRANT ALL ON TABLE "public"."expense_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expense_items_expense_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expense_items_expense_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expense_items_expense_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expenses_expense_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expenses_expense_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expenses_expense_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inventory_inventory_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inventory_inventory_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inventory_inventory_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."paymenttypes" TO "anon";
GRANT ALL ON TABLE "public"."paymenttypes" TO "authenticated";
GRANT ALL ON TABLE "public"."paymenttypes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."paymenttypes_payment_type_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."paymenttypes_payment_type_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."paymenttypes_payment_type_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."refund_items" TO "anon";
GRANT ALL ON TABLE "public"."refund_items" TO "authenticated";
GRANT ALL ON TABLE "public"."refund_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."refund_items_refund_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."refund_items_refund_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."refund_items_refund_item_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."refunds_refund_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."refunds_refund_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."refunds_refund_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_items" TO "anon";
GRANT ALL ON TABLE "public"."sales_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_items_sales_item_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_items_sales_item_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_items_sales_item_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_sale_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_sale_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_sale_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stockclerks" TO "anon";
GRANT ALL ON TABLE "public"."stockclerks" TO "authenticated";
GRANT ALL ON TABLE "public"."stockclerks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stockclerks_stockclerk_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stockclerks_stockclerk_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stockclerks_stockclerk_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."storemanagers" TO "anon";
GRANT ALL ON TABLE "public"."storemanagers" TO "authenticated";
GRANT ALL ON TABLE "public"."storemanagers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."storemanagers_storemanager_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."storemanagers_storemanager_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."storemanagers_storemanager_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."top_selling_categories" TO "anon";
GRANT ALL ON TABLE "public"."top_selling_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."top_selling_categories" TO "service_role";



GRANT ALL ON TABLE "public"."top_selling_products" TO "anon";
GRANT ALL ON TABLE "public"."top_selling_products" TO "authenticated";
GRANT ALL ON TABLE "public"."top_selling_products" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


