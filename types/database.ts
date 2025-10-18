export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          make: string;
          model: string;
          year: number;
          license_plate: string;
          vin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          make: string;
          model: string;
          year: number;
          license_plate: string;
          vin?: string | null;
        };
        Update: {
          make?: string;
          model?: string;
          year?: number;
          license_plate?: string;
          vin?: string | null;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
        };
        Update: {
          // No updates needed for group membership
        };
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          email: string;
          invited_by: string;
          status: "pending" | "accepted" | "declined" | "expired";
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          email: string;
          invited_by: string;
          status?: "pending";
          expires_at: string;
        };
        Update: {
          status?: "pending" | "accepted" | "declined" | "expired";
        };
      };
      mileage_logs: {
        Row: {
          id: string;
          vehicle_id: string;
          user_id: string;
          odometer_reading: number;
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          user_id: string;
          odometer_reading: number;
          date: string;
          notes?: string | null;
        };
        Update: {
          odometer_reading?: number;
          date?: string;
          notes?: string | null;
        };
      };
      fuel_logs: {
        Row: {
          id: string;
          vehicle_id: string;
          user_id: string;
          liters_filled: number;
          cost: number | null;
          date: string;
          odometer_reading: number;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          user_id: string;
          liters_filled: number;
          cost?: number | null;
          date: string;
          odometer_reading: number;
          location?: string | null;
        };
        Update: {
          liters_filled?: number;
          cost?: number | null;
          date?: string;
          odometer_reading?: number;
          location?: string | null;
        };
      };
      service_logs: {
        Row: {
          id: string;
          vehicle_id: string;
          user_id: string;
          service_type: string;
          description: string;
          cost: number | null;
          date: string;
          odometer_reading: number;
          next_service_due: string | null;
          receipt_image_url: string | null;
          ocr_extracted_data: any | null;
          auto_filled: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          user_id: string;
          service_type: string;
          description: string;
          cost?: number | null;
          date: string;
          odometer_reading: number;
          next_service_due?: string | null;
          receipt_image_url?: string | null;
          ocr_extracted_data?: any | null;
          auto_filled?: boolean | null;
        };
        Update: {
          service_type?: string;
          description?: string;
          cost?: number | null;
          date?: string;
          odometer_reading?: number;
          next_service_due?: string | null;
          receipt_image_url?: string | null;
          ocr_extracted_data?: any | null;
          auto_filled?: boolean | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      invitation_status: "pending" | "accepted" | "declined" | "expired";
      service_type:
        | "oil_change"
        | "tire_rotation"
        | "brake_service"
        | "general_maintenance"
        | "repair"
        | "inspection"
        | "other";
    };
  };
}
