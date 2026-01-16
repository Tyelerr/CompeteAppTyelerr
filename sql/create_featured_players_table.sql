-- Create featured_players table for random player selection
CREATE TABLE IF NOT EXISTS featured_players (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Player information
    name VARCHAR(255) NOT NULL,
    label_about_the_person VARCHAR(500),
    address VARCHAR(500),
    description TEXT,
    phone_number VARCHAR(50),
    
    -- Achievements list (JSON array of strings)
    achievements JSONB DEFAULT '[]'::jsonb,
    
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
CREATE INDEX IF NOT EXISTS idx_featured_players_active ON featured_players(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_players_last_featured ON featured_players(last_featured_date);
CREATE INDEX IF NOT EXISTS idx_featured_players_weight ON featured_players(selection_weight);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_featured_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_featured_players_updated_at
    BEFORE UPDATE ON featured_players
    FOR EACH ROW
    EXECUTE FUNCTION update_featured_players_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE featured_players ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Featured players are viewable by everyone" ON featured_players
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert featured players" ON featured_players
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (auth.uid())::text 
            AND profiles.role IN ('master-administrator', 'compete-admin')
        )
    );

CREATE POLICY "Only admins can update featured players" ON featured_players
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (auth.uid())::text 
            AND profiles.role IN ('master-administrator', 'compete-admin')
        )
    );

CREATE POLICY "Only admins can delete featured players" ON featured_players
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = (auth.uid())::text 
            AND profiles.role IN ('master-administrator', 'compete-admin')
        )
    );

-- Insert sample data
INSERT INTO featured_players (name, label_about_the_person, address, description, achievements, is_active) VALUES
('John "The Shark" Martinez', 'Professional Pool Player', 'Las Vegas, NV', 'A seasoned professional with over 15 years of competitive experience in 9-ball and 8-ball tournaments.', 
 '["2023 Regional 9-Ball Champion", "2022 State 8-Ball Runner-up", "Multiple tournament wins", "Fargo Rating: 720"]'::jsonb, true),
('Sarah "Precision" Chen', 'Rising Star', 'Phoenix, AZ', 'Young talent making waves in the professional circuit with exceptional precision and strategic play.',
 '["2023 Junior National Champion", "Perfect game record in local league", "Youngest player to reach finals", "Fargo Rating: 680"]'::jsonb, true),
('Mike "The Professor" Johnson', 'Veteran Player', 'Chicago, IL', 'Known for his analytical approach and teaching abilities, Mike has been a cornerstone of the billiards community.',
 '["30+ years of competitive play", "Local league champion 5 times", "Mentored 50+ players", "Tournament director"]'::jsonb, true);
