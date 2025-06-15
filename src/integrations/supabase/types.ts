export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          country_code: string | null
          country_name: string
          created_at: string | null
          id: number
          region: string | null
          sub_region: string | null
        }
        Insert: {
          country_code?: string | null
          country_name: string
          created_at?: string | null
          id?: number
          region?: string | null
          sub_region?: string | null
        }
        Update: {
          country_code?: string | null
          country_name?: string
          created_at?: string | null
          id?: number
          region?: string | null
          sub_region?: string | null
        }
        Relationships: []
      }
      interventions: {
        Row: {
          country_id: number | null
          created_at: string | null
          id: number
          intervention_text: string | null
          session_id: string | null
          speaker_name: string | null
        }
        Insert: {
          country_id?: number | null
          created_at?: string | null
          id?: number
          intervention_text?: string | null
          session_id?: string | null
          speaker_name?: string | null
        }
        Update: {
          country_id?: number | null
          created_at?: string | null
          id?: number
          intervention_text?: string | null
          session_id?: string | null
          speaker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interventions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      ngram_statistics: {
        Row: {
          country_name: string | null
          created_at: string | null
          id: number
          mention_count: number | null
          ngram_term: string | null
          session_id: string | null
          x_coord: number | null
          y_coord: number | null
          z_coord: number | null
        }
        Insert: {
          country_name?: string | null
          created_at?: string | null
          id?: number
          mention_count?: number | null
          ngram_term?: string | null
          session_id?: string | null
          x_coord?: number | null
          y_coord?: number | null
          z_coord?: number | null
        }
        Update: {
          country_name?: string | null
          created_at?: string | null
          id?: number
          mention_count?: number | null
          ngram_term?: string | null
          session_id?: string | null
          x_coord?: number | null
          y_coord?: number | null
          z_coord?: number | null
        }
        Relationships: []
      }
      speech_sentences: {
        Row: {
          created_at: string | null
          id: number
          intervention_id: number | null
          relevance_score: number | null
          sentence_order: number | null
          sentence_text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          intervention_id?: number | null
          relevance_score?: number | null
          sentence_order?: number | null
          sentence_text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          intervention_id?: number | null
          relevance_score?: number | null
          sentence_order?: number | null
          sentence_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speech_sentences_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
