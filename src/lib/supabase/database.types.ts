export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          archived: boolean
          company: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_activity_at: string
          last_name: string
          notes: string | null
          phone: string | null
          relationship: Database["public"]["Enums"]["relationship_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          company?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_activity_at?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          relationship: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_activity_at?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          relationship?: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchanges: {
        Row: {
          created_at: string
          id: string
          occurred_at: string
          request_id: string
          summary: string
          type: Database["public"]["Enums"]["exchange_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          occurred_at: string
          request_id: string
          summary: string
          type: Database["public"]["Enums"]["exchange_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          occurred_at?: string
          request_id?: string
          summary?: string
          type?: Database["public"]["Enums"]["exchange_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchanges_request_id_user_id_fkey"
            columns: ["request_id", "user_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          progress: number | null
          request_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          progress?: number | null
          request_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          progress?: number | null
          request_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_request_id_user_id_fkey"
            columns: ["request_id", "user_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      request_actions: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string
          id: string
          label: string
          request_id: string
          type: Database["public"]["Enums"]["request_action_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at: string
          id?: string
          label: string
          request_id: string
          type: Database["public"]["Enums"]["request_action_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string
          id?: string
          label?: string
          request_id?: string
          type?: Database["public"]["Enums"]["request_action_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_actions_request_id_user_id_fkey"
            columns: ["request_id", "user_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      requests: {
        Row: {
          archived: boolean
          contact_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_activity_at: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          contact_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_activity_at?: string
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          contact_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_activity_at?: string
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_contact_id_user_id_fkey"
            columns: ["contact_id", "user_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      exchange_type: "appel" | "email" | "message" | "rencontre" | "note"
      mission_status: "a_demarrer" | "en_cours" | "en_attente" | "terminee"
      relationship_type:
        | "prospect"
        | "client"
        | "client_recurrent"
        | "ancien_client"
      request_action_type:
        | "relance"
        | "proposition"
        | "appel"
        | "devis"
        | "documents"
        | "precision"
        | "echange"
        | "autre"
      request_status:
        | "nouveau"
        | "a_comprendre"
        | "echange_prevu"
        | "solution_proposee"
        | "en_attente"
        | "mission_confirmee"
        | "sans_suite"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      exchange_type: ["appel", "email", "message", "rencontre", "note"],
      mission_status: ["a_demarrer", "en_cours", "en_attente", "terminee"],
      relationship_type: [
        "prospect",
        "client",
        "client_recurrent",
        "ancien_client",
      ],
      request_action_type: [
        "relance",
        "proposition",
        "appel",
        "devis",
        "documents",
        "precision",
        "echange",
        "autre",
      ],
      request_status: [
        "nouveau",
        "a_comprendre",
        "echange_prevu",
        "solution_proposee",
        "en_attente",
        "mission_confirmee",
        "sans_suite",
      ],
    },
  },
} as const