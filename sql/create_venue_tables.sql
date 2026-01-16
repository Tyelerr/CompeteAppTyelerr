-- SQL to create venue_tables table for storing table information per venue

CREATE TABLE IF NOT EXISTS venue_tables (
    id SERIAL PRIMARY KEY,
    venue_id INT NOT NULL,
    table_size VARCHAR(10) NOT NULL,
    table_brand VARCHAR(100),
    count INT NOT NULL DEFAULT 1 CHECK (count > 0 AND count <= 99),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraint to venues table
    CONSTRAINT fk_venue_tables_venue_id 
        FOREIGN KEY (venue_id) 
        REFERENCES venues(id) 
        ON DELETE CASCADE,
    
    -- Check constraint for valid table sizes
    CONSTRAINT chk_table_size 
        CHECK (table_size IN ('7ft', '8ft', '9ft', '10ft', '12x6'))
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_venue_tables_venue_id ON venue_tables(venue_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_venue_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_venue_tables_updated_at
    BEFORE UPDATE ON venue_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_tables_updated_at();
