export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          created_at: string
          district_id: string
          id: string
          is_pouroshova: boolean
          name: string
          name_bn: string | null
        }
        Insert: {
          created_at?: string
          district_id: string
          id?: string
          is_pouroshova?: boolean
          name: string
          name_bn?: string | null
        }
        Update: {
          created_at?: string
          district_id?: string
          id?: string
          is_pouroshova?: boolean
          name?: string
          name_bn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          created_at: string
          division: string | null
          id: string
          name: string
          name_bn: string | null
        }
        Insert: {
          created_at?: string
          division?: string | null
          id?: string
          name: string
          name_bn?: string | null
        }
        Update: {
          created_at?: string
          division?: string | null
          id?: string
          name?: string
          name_bn?: string | null
        }
        Relationships: []
      }
      scraped_pending: {
        Row: {
          address: string | null
          city_name: string | null
          created_at: string
          district_name: string | null
          id: string
          name: string
          phone: string | null
          raw: Json | null
          source_url: string | null
          status: string
          type: Database["public"]["Enums"]["service_type"]
        }
        Insert: {
          address?: string | null
          city_name?: string | null
          created_at?: string
          district_name?: string | null
          id?: string
          name: string
          phone?: string | null
          raw?: Json | null
          source_url?: string | null
          status?: string
          type: Database["public"]["Enums"]["service_type"]
        }
        Update: {
          address?: string | null
          city_name?: string | null
          created_at?: string
          district_name?: string | null
          id?: string
          name?: string
          phone?: string | null
          raw?: Json | null
          source_url?: string | null
          status?: string
          type?: Database["public"]["Enums"]["service_type"]
        }
        Relationships: []
      }
      service_reports: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          reason: string
          service_id: string
          status: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          reason: string
          service_id: string
          status?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          reason?: string
          service_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reports_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          address: string | null
          city_id: string
          created_at: string
          details: string | null
          email: string | null
          id: string
          is_published: boolean
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city_id: string
          created_at?: string
          details?: string | null
          email?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city_id?: string
          created_at?: string
          details?: string | null
          email?: string | null
          id?: string
          is_published?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      service_type:
        | "hospital"
        | "police"
        | "fire"
        | "rab"
        | "army"
        | "pouroshova"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      service_type: ["hospital", "police", "fire", "rab", "army", "pouroshova"],
    },
  },
} as const
