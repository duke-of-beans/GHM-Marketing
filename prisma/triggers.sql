-- GHM Marketing Dashboard - Database Triggers
-- Run after Prisma migrations: npx prisma db execute --file prisma/triggers.sql

-- TRIGGER 1: Auto-assign territory on lead insert
CREATE OR REPLACE FUNCTION assign_territory()
RETURNS TRIGGER AS $$
DECLARE
    matched_territory_id INTEGER;
BEGIN
    SELECT id INTO matched_territory_id
    FROM territories
    WHERE LOWER(NEW.city) = ANY(
        SELECT LOWER(unnest(cities)) FROM territories WHERE is_active = TRUE
    )
    AND is_active = TRUE
    LIMIT 1;

    IF matched_territory_id IS NULL THEN
        SELECT id INTO matched_territory_id
        FROM territories
        WHERE NEW.zip_code = ANY(zip_codes) AND is_active = TRUE
        LIMIT 1;
    END IF;

    NEW.territory_id := matched_territory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_territory ON leads;
CREATE TRIGGER trigger_assign_territory
BEFORE INSERT ON leads
FOR EACH ROW
WHEN (NEW.territory_id IS NULL)
EXECUTE FUNCTION assign_territory();

-- TRIGGER 2: Log status changes to lead_history
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
DECLARE
    time_in_stage INTEGER;
BEGIN
    IF OLD.status_changed_at IS NOT NULL THEN
        time_in_stage := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - OLD.status_changed_at))::INTEGER;
    ELSE
        time_in_stage := NULL;
    END IF;

    INSERT INTO lead_history (lead_id, user_id, old_status, new_status, time_in_previous_stage, changed_at)
    VALUES (NEW.id, NEW.assigned_to, OLD.status, NEW.status, time_in_stage, CURRENT_TIMESTAMP);

    NEW.status_changed_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_status_change ON leads;
CREATE TRIGGER trigger_log_status_change
BEFORE UPDATE OF status ON leads
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_status_change();

-- TRIGGER 3: Calculate deal value when products change
CREATE OR REPLACE FUNCTION calculate_deal_value()
RETURNS TRIGGER AS $$
DECLARE
    target_lead_id INTEGER;
    one_time_total DECIMAL(10,2);
    monthly_total DECIMAL(10,2);
    annual_total DECIMAL(10,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_lead_id := OLD.lead_id;
    ELSE
        target_lead_id := NEW.lead_id;
    END IF;

    SELECT
        COALESCE(SUM(CASE WHEN p.pricing_model = 'one_time' THEN dp.final_price ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN p.pricing_model = 'monthly' THEN dp.final_price ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN p.pricing_model = 'annual' THEN dp.final_price ELSE 0 END), 0)
    INTO one_time_total, monthly_total, annual_total
    FROM deal_products dp
    JOIN products p ON dp.product_id = p.id
    WHERE dp.lead_id = target_lead_id;

    UPDATE leads SET
        deal_value_one_time = one_time_total,
        deal_value_monthly = monthly_total,
        deal_value_annual = annual_total,
        deal_value_total = one_time_total + monthly_total + annual_total,
        mrr = monthly_total,
        arr = annual_total,
        ltv_estimated = one_time_total + (monthly_total * 12) + annual_total,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = target_lead_id;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_deal_value ON deal_products;
CREATE TRIGGER trigger_calculate_deal_value
AFTER INSERT OR UPDATE OR DELETE ON deal_products
FOR EACH ROW
EXECUTE FUNCTION calculate_deal_value();

-- TRIGGER 4: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_timestamp ON users;
CREATE TRIGGER trigger_update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_territories_timestamp ON territories;
CREATE TRIGGER trigger_update_territories_timestamp BEFORE UPDATE ON territories FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_leads_timestamp ON leads;
CREATE TRIGGER trigger_update_leads_timestamp BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_products_timestamp ON products;
CREATE TRIGGER trigger_update_products_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_notes_timestamp ON notes;
CREATE TRIGGER trigger_update_notes_timestamp BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
