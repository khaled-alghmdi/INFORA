-- Create activity_logs table for tracking all system activities
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity_id ON public.activity_logs(entity_id);

-- Add comments
COMMENT ON TABLE public.activity_logs IS 'System-wide activity and audit log';
COMMENT ON COLUMN public.activity_logs.action_type IS 'Type of action: create, update, delete, assign, unassign, login, logout, etc.';
COMMENT ON COLUMN public.activity_logs.entity_type IS 'Type of entity affected: device, user, request, etc.';
COMMENT ON COLUMN public.activity_logs.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN public.activity_logs.metadata IS 'Additional JSON data about the action';

