-- =====================================================
-- ADD SERVICE TEMPLATES FUNCTIONALITY
-- =====================================================
-- This adds tables for user-defined service templates
-- that can be used to quickly create service logs
-- =====================================================

-- Service Templates table
CREATE TABLE IF NOT EXISTS service_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Template Items table
CREATE TABLE IF NOT EXISTS service_template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_templates_user_id ON service_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_service_templates_created_at ON service_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_template_items_template_id ON service_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_service_template_items_order ON service_template_items(template_id, display_order);

-- RLS Policies for service_templates
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;

-- Users can only access their own service templates
CREATE POLICY "Users can view own service templates"
    ON service_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service templates"
    ON service_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service templates"
    ON service_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own service templates"
    ON service_templates FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for service_template_items
ALTER TABLE service_template_items ENABLE ROW LEVEL SECURITY;

-- Users can only access items from their own templates
CREATE POLICY "Users can view own service template items"
    ON service_template_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM service_templates
            WHERE service_templates.id = service_template_items.template_id
            AND service_templates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own service template items"
    ON service_template_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM service_templates
            WHERE service_templates.id = service_template_items.template_id
            AND service_templates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own service template items"
    ON service_template_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM service_templates
            WHERE service_templates.id = service_template_items.template_id
            AND service_templates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own service template items"
    ON service_template_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM service_templates
            WHERE service_templates.id = service_template_items.template_id
            AND service_templates.user_id = auth.uid()
        )
    );

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_service_templates_updated_at
    BEFORE UPDATE ON service_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_template_items_updated_at
    BEFORE UPDATE ON service_template_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update total_cost when items change
CREATE OR REPLACE FUNCTION update_service_template_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the total cost of the template
    UPDATE service_templates
    SET total_cost = (
        SELECT COALESCE(SUM(price), 0)
        FROM service_template_items
        WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    )
    WHERE id = COALESCE(NEW.template_id, OLD.template_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers to automatically update total_cost
CREATE TRIGGER update_template_total_on_item_insert
    AFTER INSERT ON service_template_items
    FOR EACH ROW EXECUTE FUNCTION update_service_template_total_cost();

CREATE TRIGGER update_template_total_on_item_update
    AFTER UPDATE ON service_template_items
    FOR EACH ROW EXECUTE FUNCTION update_service_template_total_cost();

CREATE TRIGGER update_template_total_on_item_delete
    AFTER DELETE ON service_template_items
    FOR EACH ROW EXECUTE FUNCTION update_service_template_total_cost();