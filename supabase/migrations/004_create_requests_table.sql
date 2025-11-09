-- Create requests table for device requests and IT support tickets
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('device_request', 'it_support')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'completed', 'closed')),
    device_type VARCHAR(100),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_requests_user_id ON public.requests(user_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_type ON public.requests(request_type);
CREATE INDEX idx_requests_assigned_to ON public.requests(assigned_to);
CREATE INDEX idx_requests_created_at ON public.requests(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.requests IS 'Employee requests for new devices and IT support tickets';
COMMENT ON COLUMN public.requests.request_type IS 'Type of request: device_request or it_support';
COMMENT ON COLUMN public.requests.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN public.requests.status IS 'Current status of the request';
COMMENT ON COLUMN public.requests.device_type IS 'Type of device requested (for device_request type)';

