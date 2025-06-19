import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          user_type: 'customer' | 'owner' | 'admin';
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          user_type?: 'customer' | 'owner' | 'admin';
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          user_type?: 'customer' | 'owner' | 'admin';
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      parking_spots: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          address: string;
          latitude: number;
          longitude: number;
          total_slots: number;
          available_slots: number;
          price: number;
          price_type: 'hour' | 'day' | 'month';
          phone: string | null;
          opening_hours: string;
          amenities: string[];
          images: string[];
          features: Record<string, any>;
          status: 'active' | 'inactive' | 'maintenance';
          rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          address: string;
          latitude: number;
          longitude: number;
          total_slots?: number;
          available_slots?: number;
          price: number;
          price_type: 'hour' | 'day' | 'month';
          phone?: string | null;
          opening_hours?: string;
          amenities?: string[];
          images?: string[];
          features?: Record<string, any>;
          status?: 'active' | 'inactive' | 'maintenance';
          rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          address?: string;
          latitude?: number;
          longitude?: number;
          total_slots?: number;
          available_slots?: number;
          price?: number;
          price_type?: 'hour' | 'day' | 'month';
          phone?: string | null;
          opening_hours?: string;
          amenities?: string[];
          images?: string[];
          features?: Record<string, any>;
          status?: 'active' | 'inactive' | 'maintenance';
          rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          spot_id: string;
          user_id: string;
          vehicle_id: string | null;
          start_time: string;
          end_time: string;
          total_cost: number;
          status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
          payment_method: 'card' | 'qr' | 'bank_transfer' | 'wallet' | null;
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          qr_code: string;
          pin: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          spot_id: string;
          user_id: string;
          vehicle_id?: string | null;
          start_time: string;
          end_time: string;
          total_cost: number;
          status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
          payment_method?: 'card' | 'qr' | 'bank_transfer' | 'wallet' | null;
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          qr_code: string;
          pin: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          spot_id?: string;
          user_id?: string;
          vehicle_id?: string | null;
          start_time?: string;
          end_time?: string;
          total_cost?: number;
          status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
          payment_method?: 'card' | 'qr' | 'bank_transfer' | 'wallet' | null;
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          qr_code?: string;
          pin?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_slips: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          file_url: string;
          file_name: string;
          file_size: number | null;
          upload_status: 'pending' | 'verified' | 'rejected';
          verification_notes: string | null;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          user_id: string;
          file_url: string;
          file_name: string;
          file_size?: number | null;
          upload_status?: 'pending' | 'verified' | 'rejected';
          verification_notes?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          user_id?: string;
          file_url?: string;
          file_name?: string;
          file_size?: number | null;
          upload_status?: 'pending' | 'verified' | 'rejected';
          verification_notes?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      owner_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string | null;
          business_address: string | null;
          business_phone: string | null;
          tax_id: string | null;
          bank_account_number: string | null;
          bank_routing_number: string | null;
          payment_qr_code_url: string | null;
          verification_status: 'pending' | 'verified' | 'rejected';
          verification_documents: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          tax_id?: string | null;
          bank_account_number?: string | null;
          bank_routing_number?: string | null;
          payment_qr_code_url?: string | null;
          verification_status?: 'pending' | 'verified' | 'rejected';
          verification_documents?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          tax_id?: string | null;
          bank_account_number?: string | null;
          bank_routing_number?: string | null;
          payment_qr_code_url?: string | null;
          verification_status?: 'pending' | 'verified' | 'rejected';
          verification_documents?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}