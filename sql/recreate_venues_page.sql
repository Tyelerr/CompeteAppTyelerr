-- SQL to recreate the venues table with columns only, no data
-- Updated to use id_auto integers for tournament directors instead of UUIDs

DROP TABLE IF EXISTS venues;

CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    td_id INT, -- Tournament Director ID (references profiles.id_auto)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    venue TEXT NOT NULL,
    address TEXT,
    venue_lat FLOAT8,
    venue_lng FLOAT8,
    point_location TEXT,
    barowner_id INT, -- Bar Owner ID (references profiles.id_auto)
    phone TEXT,
    
    -- Foreign key constraints
    CONSTRAINT fk_venues_td_id 
        FOREIGN KEY (td_id) 
        REFERENCES profiles(id_auto) 
        ON DELETE SET NULL,
        
    CONSTRAINT fk_venues_barowner_id 
        FOREIGN KEY (barowner_id) 
        REFERENCES profiles(id_auto) 
        ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venues_td_id ON venues(td_id);
CREATE INDEX IF NOT EXISTS idx_venues_barowner_id ON venues(barowner_id);
