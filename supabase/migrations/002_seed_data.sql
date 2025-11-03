-- Insert sample users
INSERT INTO public.users (email, full_name, department, role, is_active) VALUES
('admin@tamer.com', 'Admin User', 'IT Department', 'admin', true),
('john.doe@tamer.com', 'John Doe', 'Sales', 'user', true),
('jane.smith@tamer.com', 'Jane Smith', 'Marketing', 'user', true),
('mike.wilson@tamer.com', 'Mike Wilson', 'Engineering', 'user', true),
('sarah.jones@tamer.com', 'Sarah Jones', 'HR', 'user', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample devices
INSERT INTO public.devices (name, type, serial_number, status, purchase_date, warranty_expiry, specifications) VALUES
('Dell Latitude 5520', 'Laptop', 'DL5520-001', 'available', '2023-01-15', '2026-01-15', 'Intel i7, 16GB RAM, 512GB SSD'),
('HP EliteBook 840', 'Laptop', 'HP840-002', 'assigned', '2023-02-20', '2026-02-20', 'Intel i5, 8GB RAM, 256GB SSD'),
('MacBook Pro 14"', 'Laptop', 'MBP14-003', 'assigned', '2023-03-10', '2026-03-10', 'M2 Pro, 16GB RAM, 512GB SSD'),
('Dell UltraSharp U2720Q', 'Monitor', 'DU2720-004', 'available', '2023-01-20', '2026-01-20', '27" 4K IPS Display'),
('LG 27UK850', 'Monitor', 'LG27UK-005', 'assigned', '2023-02-15', '2026-02-15', '27" 4K HDR10 Display'),
('iPhone 13 Pro', 'Mobile', 'IP13P-006', 'assigned', '2023-04-01', '2024-04-01', '256GB, 5G'),
('Samsung Galaxy S23', 'Mobile', 'SGS23-007', 'available', '2023-04-15', '2024-04-15', '128GB, 5G'),
('Dell OptiPlex 7090', 'Desktop', 'DO7090-008', 'maintenance', '2023-01-30', '2026-01-30', 'Intel i7, 32GB RAM, 1TB SSD'),
('HP LaserJet Pro M404n', 'Printer', 'HPLJ404-009', 'available', '2023-02-25', '2025-02-25', 'Monochrome Laser Printer'),
('Logitech MX Keys', 'Keyboard', 'LMXK-010', 'assigned', '2023-03-05', '2025-03-05', 'Wireless Keyboard')
ON CONFLICT (serial_number) DO NOTHING;

-- Update some devices to be assigned to users
UPDATE public.devices 
SET assigned_to = (SELECT id FROM public.users WHERE email = 'john.doe@tamer.com'), 
    assigned_date = NOW() - INTERVAL '30 days'
WHERE serial_number IN ('HP840-002');

UPDATE public.devices 
SET assigned_to = (SELECT id FROM public.users WHERE email = 'jane.smith@tamer.com'), 
    assigned_date = NOW() - INTERVAL '45 days'
WHERE serial_number IN ('MBP14-003', 'LG27UK-005');

UPDATE public.devices 
SET assigned_to = (SELECT id FROM public.users WHERE email = 'mike.wilson@tamer.com'), 
    assigned_date = NOW() - INTERVAL '20 days'
WHERE serial_number IN ('IP13P-006', 'LMXK-010');

-- Insert assignment history
INSERT INTO public.assignments (device_id, user_id, assigned_date, notes)
SELECT 
    d.id,
    u.id,
    NOW() - INTERVAL '30 days',
    'Initial assignment'
FROM public.devices d
JOIN public.users u ON u.email = 'john.doe@tamer.com'
WHERE d.serial_number = 'HP840-002';

INSERT INTO public.assignments (device_id, user_id, assigned_date, notes)
SELECT 
    d.id,
    u.id,
    NOW() - INTERVAL '45 days',
    'Initial assignment'
FROM public.devices d
JOIN public.users u ON u.email = 'jane.smith@tamer.com'
WHERE d.serial_number IN ('MBP14-003', 'LG27UK-005');

INSERT INTO public.assignments (device_id, user_id, assigned_date, notes)
SELECT 
    d.id,
    u.id,
    NOW() - INTERVAL '20 days',
    'Initial assignment'
FROM public.devices d
JOIN public.users u ON u.email = 'mike.wilson@tamer.com'
WHERE d.serial_number IN ('IP13P-006', 'LMXK-010');

