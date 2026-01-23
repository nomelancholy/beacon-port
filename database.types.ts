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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      certifications: {
        Row: {
          acquisition_date: string | null
          display_order: number
          id: string
          issuer: string | null
          name: string
          resume_id: string | null
        }
        Insert: {
          acquisition_date?: string | null
          display_order?: number
          id?: string
          issuer?: string | null
          name: string
          resume_id?: string | null
        }
        Update: {
          acquisition_date?: string | null
          display_order?: number
          id?: string
          issuer?: string | null
          name?: string
          resume_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_resume_id_resumes_id_fk"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      educations: {
        Row: {
          description: string | null
          display_order: number
          end_date: string | null
          id: string
          institution: string
          major: string | null
          resume_id: string | null
          start_date: string | null
        }
        Insert: {
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          institution: string
          major?: string | null
          resume_id?: string | null
          start_date?: string | null
        }
        Update: {
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          institution?: string
          major?: string | null
          resume_id?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "educations_resume_id_resumes_id_fk"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      etcs: {
        Row: {
          description: string | null
          display_order: number
          id: string
          link: string | null
          name: string
          resume_id: string | null
        }
        Insert: {
          description?: string | null
          display_order?: number
          id?: string
          link?: string | null
          name: string
          resume_id?: string | null
        }
        Update: {
          description?: string | null
          display_order?: number
          id?: string
          link?: string | null
          name?: string
          resume_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etcs_resume_id_resumes_id_fk"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_skills: {
        Row: {
          experience_id: string
          skill_id: string
        }
        Insert: {
          experience_id: string
          skill_id: string
        }
        Update: {
          experience_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_skills_experience_id_experiences_id_fk"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_skills_skill_id_skills_id_fk"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          company: string
          description: string | null
          display_order: number
          end_date: string | null
          id: string
          resume_id: string | null
          role: string | null
          start_date: string | null
        }
        Insert: {
          company: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          resume_id?: string | null
          role?: string | null
          start_date?: string | null
        }
        Update: {
          company?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          resume_id?: string | null
          role?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_resume_id_resumes_id_fk"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      language_tests: {
        Row: {
          display_order: number
          id: string
          name: string
          resume_id: string | null
          score: string | null
          test_date: string | null
        }
        Insert: {
          display_order?: number
          id?: string
          name: string
          resume_id?: string | null
          score?: string | null
          test_date?: string | null
        }
        Update: {
          display_order?: number
          id?: string
          name?: string
          resume_id?: string | null
          score?: string | null
          test_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "language_tests_resume_id_resumes_id_fk"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nickname: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nickname: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nickname?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          address: string | null
          blog: string | null
          created_at: string
          email: string | null
          english_level: Database["public"]["Enums"]["english_level"] | null
          facebook: string | null
          github: string | null
          id: string
          instagram: string | null
          introduce: string | null
          is_public: boolean
          linkedin: string | null
          name: string
          phone: string | null
          photo: string | null
          role: string | null
          skill_stack_selected: string | null
          title: string
          updated_at: string
          user_id: string | null
          x: string | null
          youtube: string | null
        }
        Insert: {
          address?: string | null
          blog?: string | null
          created_at?: string
          email?: string | null
          english_level?: Database["public"]["Enums"]["english_level"] | null
          facebook?: string | null
          github?: string | null
          id?: string
          instagram?: string | null
          introduce?: string | null
          is_public?: boolean
          linkedin?: string | null
          name: string
          phone?: string | null
          photo?: string | null
          role?: string | null
          skill_stack_selected?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
          x?: string | null
          youtube?: string | null
        }
        Update: {
          address?: string | null
          blog?: string | null
          created_at?: string
          email?: string | null
          english_level?: Database["public"]["Enums"]["english_level"] | null
          facebook?: string | null
          github?: string | null
          id?: string
          instagram?: string | null
          introduce?: string | null
          is_public?: boolean
          linkedin?: string | null
          name?: string
          phone?: string | null
          photo?: string | null
          role?: string | null
          skill_stack_selected?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          x?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_profiles_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      side_project_skills: {
        Row: {
          side_project_id: string
          skill_id: string
        }
        Insert: {
          side_project_id: string
          skill_id: string
        }
        Update: {
          side_project_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_project_skills_side_project_id_side_projects_id_fk"
            columns: ["side_project_id"]
            isOneToOne: false
            referencedRelation: "side_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "side_project_skills_skill_id_skills_id_fk"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      side_projects: {
        Row: {
          description: string | null
          display_order: number
          end_date: string | null
          id: string
          link: string | null
          name: string
          resume_id: string | null
          start_date: string | null
        }
        Insert: {
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          link?: string | null
          name: string
          resume_id?: string | null
          start_date?: string | null
        }
        Update: {
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          link?: string | null
          name?: string
          resume_id?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "side_projects_resume_id_resumes_id_fk"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_aliases: {
        Row: {
          alias: string
          id: string
          skill_id: string | null
        }
        Insert: {
          alias: string
          id?: string
          skill_id?: string | null
        }
        Update: {
          alias?: string
          id?: string
          skill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_aliases_skill_id_skills_id_fk"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          id: string
          is_verified: boolean
          name: string
        }
        Insert: {
          id?: string
          is_verified?: boolean
          name: string
        }
        Update: {
          id?: string
          is_verified?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      english_level: "Native" | "Advanced" | "Intermediate" | "Basic"
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
      english_level: ["Native", "Advanced", "Intermediate", "Basic"],
    },
  },
} as const
