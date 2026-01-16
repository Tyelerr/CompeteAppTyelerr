-- Create featured_bars table for random bar selection
CREATE TABLE IF NOT EXISTS featured_bars (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Bar information
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    description TEXT,
    phone_number VARCHAR(50),
    
    -- Highlights/features (JSON array of strings)
    highlights JSONB DEFAULT '[]'::jsonb,
    
    -- Additional bar details
    website VARCHAR(500),
    hours_of_operation VARCHAR(500),
    special_features TEXT,
    
    -- Random selection tracking
    is_active BOOLEAN DEFAULT true,
    last_featured_date TIMESTAMP WITH TIME ZONE,
    featured_count INTEGER DEFAULT 0,
    
    -- Weight for random selection (higher = more likely to be selected)
    selection_weight INTEGER DEFAULT 1,
    
    -- Admin who created/modified
    created_by TEXT,
    updated_by TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_featured_bars_active ON featured_bars(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_bars_last_featured ON featured_bars(last_featured_date);
CREATE INDEX IF NOT EXISTS idx_featured_bars_weight ON featured_bars(selection_weight);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_featured_bars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_featured_bars_updated_at
    BEFORE UPDATE ON featured_bars
    FOR EACH ROW
    EXECUTE FUNCTION update_featured_bars_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE featured_bars ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Featured bars are viewable by everyone" ON featured_bars
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert featured bars" ON featured_bars
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (auth.uid())::text 
            AND profiles.role IN ('master-administrator', 'compete-admin')
        )
    );

CREATE POLICY "Only admins can update featured bars" ON featured_bars
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (auth.uid())::text 
            AND profiles.role IN ('master-administrator', 'compete-admin')
        )
    );

CREATE POLICY "Only admins can delete featured bars" ON featured_bars
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (auth.uid())::text 
            AND profiles.role IN ('master-administrator', 'compete-admin')
        )
    );

-- Insert sample data
INSERT INTO featured_bars (name, address, description, highlights, phone_number, is_active) VALUES
('The Corner Pocket', '123 Main St, Downtown', 'A classic billiards hall with vintage charm and modern amenities. Home to weekly tournaments and leagues.',
 '["12 Diamond tables", "Full bar & kitchen", "Weekly tournaments", "League play", "Private event space"]'::jsonb, '(555) 123-4567', true),
('Rack ''Em Up Sports Bar', '456 Sports Ave, Midtown', 'Modern sports bar featuring top-quality pool tables and a vibrant atmosphere for players of all skill levels.',
 '["8 Brunswick Gold Crown tables", "Live sports on big screens", "Happy hour specials", "Pool lessons available", "Tournament hosting"]'::jsonb, '(555) 987-6543', true),
('Billiards Palace', '789 Pool Blvd, Uptown', 'Premier billiards destination with professional-grade equipment and a welcoming community atmosphere.',
 '["16 professional tables", "Snooker tables available", "Pro shop on-site", "Coaching services", "Corporate events"]'::jsonb, '(555) 456-7890', true);
