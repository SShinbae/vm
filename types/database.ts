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
          main_image_url: string | null;
          color: string | null;
          current_mileage: number | null;
          shared_with_groups: boolean;
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
          main_image_url?: string | null;
          color?: string | null;
          current_mileage?: number | null;
          shared_with_groups?: boolean;
        };
        Update: {
          make?: string;
          model?: string;
          year?: number;
          license_plate?: string;
          vin?: string | null;
          main_image_url?: string | null;
          color?: string | null;
          current_mileage?: number | null;
          shared_with_groups?: boolean;
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
          groups?: Database["public"]["Tables"]["groups"]["Row"];
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
        };
        Update: {
          // No updates needed for group membership
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
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
          groups?: Database["public"]["Tables"]["groups"]["Row"];
          profiles?: Database["public"]["Tables"]["profiles"]["Row"];
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
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey";
            columns: ["group_id"];
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_invitations_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "mileage_logs_vehicle_id_fkey";
            columns: ["vehicle_id"];
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey";
            columns: ["vehicle_id"];
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "service_logs_vehicle_id_fkey";
            columns: ["vehicle_id"];
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_images: {
        Row: {
          id: string;
          vehicle_id: string;
          image_url: string;
          image_type: "profile_avatar" | "vehicle_main" | "vehicle_gallery";
          caption: string | null;
          display_order: number;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          image_url: string;
          image_type?: "profile_avatar" | "vehicle_main" | "vehicle_gallery";
          caption?: string | null;
          display_order?: number;
          uploaded_by?: string;
        };
        Update: {
          image_url?: string;
          image_type?: "profile_avatar" | "vehicle_main" | "vehicle_gallery";
          caption?: string | null;
          display_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey";
            columns: ["vehicle_id"];
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_group_shares: {
        Row: {
          id: string;
          vehicle_id: string;
          group_id: string;
          shared_by: string;
          created_at: string;
          groups?: Database["public"]["Tables"]["groups"]["Row"];
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          group_id: string;
          shared_by: string;
        };
        Update: {
          // No updates needed
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_group_shares_group_id_fkey";
            columns: ["group_id"];
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicle_group_shares_vehicle_id_fkey";
            columns: ["vehicle_id"];
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: "ios" | "android" | "web" | "windows" | "macos";
          device_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: "ios" | "android" | "web" | "windows" | "macos";
          device_name: string;
        };
        Update: {
          token?: string;
          device_name?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          notification_type:
            | "mileage_log"
            | "fuel_log"
            | "service_log"
            | "group_member"
            | "group_invite";
          title: string;
          body: string;
          data: any | null;
          read: boolean;
          related_vehicle_id: string | null;
          related_group_id: string | null;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type:
            | "mileage_log"
            | "fuel_log"
            | "service_log"
            | "group_member"
            | "group_invite";
          title: string;
          body: string;
          data?: any | null;
          read?: boolean;
          related_vehicle_id?: string | null;
          related_group_id?: string | null;
          action_url?: string | null;
        };
        Update: {
          read?: boolean;
          data?: any | null;
        };
      };
      service_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          total_cost: number;
          created_at: string;
          updated_at: string;
          service_template_items?: Database["public"]["Tables"]["service_template_items"]["Row"][];
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          total_cost?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      service_template_items: {
        Row: {
          id: string;
          template_id: string;
          description: string;
          price: number;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          description: string;
          price: number;
          display_order?: number;
        };
        Update: {
          description?: string;
          price?: number;
          display_order?: number;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_accessible_vehicles: {
        Args: { user_uuid: string };
        Returns: (Database["public"]["Tables"]["vehicles"]["Row"] & {
          group_id: string | null;
        })[];
      };
      share_vehicle_with_groups: {
        Args: { vehicle_uuid: string; group_uuids: string[] };
        Returns: void;
      };
      get_vehicle_share_groups: {
        Args: { vehicle_uuid: string };
        Returns: {
          vehicle_id: string;
          group_id: string;
          shared_by: string;
          created_at: string;
        }[];
      };
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
