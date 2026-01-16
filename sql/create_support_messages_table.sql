-- Create support_messages table for storing FAQ contact messages
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User information
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    
    -- Message details
    message_type TEXT NOT NULL CHECK (message_type IN (
        'General Question',
        'Tournament Inquiry', 
        'Technical Support',
        'Account Issue',
        'Feedback / Suggestion'
    )),
    message_content TEXT NOT NULL,
    tournament_id TEXT, -- Optional tournament ID for Tournament Inquiry type
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    is_read BOOLEAN DEFAULT FALSE,
    
    -- Admin response
    admin_response TEXT,
    admin_user_id UUID REFERENCES auth.users(id),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_is_read ON support_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_support_messages_message_type ON support_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_support_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_support_messages_updated_at
    BEFORE UPDATE ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_support_messages_updated_at();

-- Enable Row Level Security
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages" ON support_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own messages
CREATE POLICY "Users can view their own messages" ON support_messages
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('compete-admin', 'master-administrator')
        )
    );

-- Admins can update all messages
CREATE POLICY "Admins can update all messages" ON support_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('compete-admin', 'master-administrator')
        )
    );

-- Grant permissions
GRANT ALL ON support_messages TO authenticated;
GRANT USAGE ON SEQUENCE support_messages_id_seq TO authenticated;
