import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string;
          name: string;
          type: string;
          barcode: string | null;
          asset_number: string | null;
          serial_number: string;
          status: string;
          assigned_to: string | null;
          assigned_date: string | null;
          purchase_date: string;
          warranty_expiry: string | null;
          specifications: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['devices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['devices']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          employee_id: string | null;
          email: string;
          full_name: string;
          department: string;
          role: string;
          is_active: boolean;
          initial_password: string | null;
          password_changed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      assignments: {
        Row: {
          id: string;
          device_id: string;
          user_id: string;
          assigned_date: string;
          return_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>;
      };
      requests: {
        Row: {
          id: string;
          user_id: string;
          request_type: string;
          title: string;
          description: string;
          priority: string;
          status: string;
          device_type: string | null;
          assigned_to: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['requests']['Insert']>;
      };
    };
  };
};

