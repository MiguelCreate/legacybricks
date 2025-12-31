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
      checklists: {
        Row: {
          created_at: string
          datum: string
          foto_link: string | null
          handtekening: string | null
          huurder_naam: string
          id: string
          items: Json | null
          property_id: string
          type: Database["public"]["Enums"]["checklist_type"]
          voltooid: boolean
        }
        Insert: {
          created_at?: string
          datum: string
          foto_link?: string | null
          handtekening?: string | null
          huurder_naam: string
          id?: string
          items?: Json | null
          property_id: string
          type: Database["public"]["Enums"]["checklist_type"]
          voltooid?: boolean
        }
        Update: {
          created_at?: string
          datum?: string
          foto_link?: string | null
          handtekening?: string | null
          huurder_naam?: string
          id?: string
          items?: Json | null
          property_id?: string
          type?: Database["public"]["Enums"]["checklist_type"]
          voltooid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "checklists_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          einddatum: string
          herinnering_ingesteld: boolean
          id: string
          property_id: string
          startdatum: string
          tenant_id: string | null
          type: Database["public"]["Enums"]["contract_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          einddatum: string
          herinnering_ingesteld?: boolean
          id?: string
          property_id: string
          startdatum: string
          tenant_id?: string | null
          type: Database["public"]["Enums"]["contract_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          einddatum?: string
          herinnering_ingesteld?: boolean
          id?: string
          property_id?: string
          startdatum?: string
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["contract_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          bedrag: number
          beschrijving: string | null
          categorie: Database["public"]["Enums"]["expense_category"]
          created_at: string
          datum: string
          herhalend: boolean
          id: string
          property_id: string
        }
        Insert: {
          bedrag: number
          beschrijving?: string | null
          categorie: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          datum: string
          herhalend?: boolean
          id?: string
          property_id: string
        }
        Update: {
          bedrag?: number
          beschrijving?: string | null
          categorie?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          datum?: string
          herhalend?: boolean
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          bereikt: boolean
          bron_property_id: string | null
          created_at: string
          doelbedrag: number
          huidig_bedrag: number
          id: string
          naam: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bereikt?: boolean
          bron_property_id?: string | null
          created_at?: string
          doelbedrag: number
          huidig_bedrag?: number
          id?: string
          naam: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bereikt?: boolean
          bron_property_id?: string | null
          created_at?: string
          doelbedrag?: number
          huidig_bedrag?: number
          id?: string
          naam?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_bron_property_id_fkey"
            columns: ["bron_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string
          hoofdsom: number | null
          hypotheek_type: Database["public"]["Enums"]["loan_type"]
          id: string
          looptijd_jaren: number | null
          maandlast: number
          property_id: string
          rente_percentage: number | null
          startdatum: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hoofdsom?: number | null
          hypotheek_type?: Database["public"]["Enums"]["loan_type"]
          id?: string
          looptijd_jaren?: number | null
          maandlast: number
          property_id: string
          rente_percentage?: number | null
          startdatum?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hoofdsom?: number | null
          hypotheek_type?: Database["public"]["Enums"]["loan_type"]
          id?: string
          looptijd_jaren?: number | null
          maandlast?: number
          property_id?: string
          rente_percentage?: number | null
          startdatum?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          categorie: Database["public"]["Enums"]["note_category"]
          created_at: string
          id: string
          prive: boolean
          property_id: string
          tekst: string
        }
        Insert: {
          categorie?: Database["public"]["Enums"]["note_category"]
          created_at?: string
          id?: string
          prive?: boolean
          property_id: string
          tekst: string
        }
        Update: {
          categorie?: Database["public"]["Enums"]["note_category"]
          created_at?: string
          id?: string
          prive?: boolean
          property_id?: string
          tekst?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          bedrag: number
          created_at: string
          datum: string
          id: string
          property_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          bedrag: number
          created_at?: string
          datum: string
          id?: string
          property_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          bedrag?: number
          created_at?: string
          datum?: string
          id?: string
          property_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          begeleiding_aan: boolean | null
          created_at: string
          email: string
          erfgoed_mantra: string | null
          gewenst_maandinkomen: number | null
          gewenste_pensioenleeftijd: number | null
          huidige_leeftijd: number | null
          id: string
          naam: string
          spaargeld: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          begeleiding_aan?: boolean | null
          created_at?: string
          email: string
          erfgoed_mantra?: string | null
          gewenst_maandinkomen?: number | null
          gewenste_pensioenleeftijd?: number | null
          huidige_leeftijd?: number | null
          id?: string
          naam: string
          spaargeld?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          begeleiding_aan?: boolean | null
          created_at?: string
          email?: string
          erfgoed_mantra?: string | null
          gewenst_maandinkomen?: number | null
          gewenste_pensioenleeftijd?: number | null
          huidige_leeftijd?: number | null
          id?: string
          naam?: string
          spaargeld?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          aankoopprijs: number
          created_at: string
          energie_vervaldatum: string | null
          energielabel: Database["public"]["Enums"]["energy_label"] | null
          familie_handleiding: string | null
          gearchiveerd: boolean | null
          gezondheidsscore: number | null
          google_drive_link: string | null
          id: string
          is_pinned: boolean | null
          locatie: string
          naam: string
          oppervlakte_m2: number | null
          status: Database["public"]["Enums"]["property_status"]
          updated_at: string
          user_id: string
          waardering: number | null
          waarom_gekocht: string | null
        }
        Insert: {
          aankoopprijs: number
          created_at?: string
          energie_vervaldatum?: string | null
          energielabel?: Database["public"]["Enums"]["energy_label"] | null
          familie_handleiding?: string | null
          gearchiveerd?: boolean | null
          gezondheidsscore?: number | null
          google_drive_link?: string | null
          id?: string
          is_pinned?: boolean | null
          locatie: string
          naam: string
          oppervlakte_m2?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
          user_id: string
          waardering?: number | null
          waarom_gekocht?: string | null
        }
        Update: {
          aankoopprijs?: number
          created_at?: string
          energie_vervaldatum?: string | null
          energielabel?: Database["public"]["Enums"]["energy_label"] | null
          familie_handleiding?: string | null
          gearchiveerd?: boolean | null
          gezondheidsscore?: number | null
          google_drive_link?: string | null
          id?: string
          is_pinned?: boolean | null
          locatie?: string
          naam?: string
          oppervlakte_m2?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
          user_id?: string
          waardering?: number | null
          waarom_gekocht?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          actief: boolean
          beoordeling_betrouwbaarheid: number | null
          betaaldag: number
          created_at: string
          email: string | null
          huurbedrag: number
          id: string
          naam: string
          notities: string | null
          property_id: string
          telefoon: string | null
          updated_at: string
        }
        Insert: {
          actief?: boolean
          beoordeling_betrouwbaarheid?: number | null
          betaaldag: number
          created_at?: string
          email?: string | null
          huurbedrag: number
          id?: string
          naam: string
          notities?: string | null
          property_id: string
          telefoon?: string | null
          updated_at?: string
        }
        Update: {
          actief?: boolean
          beoordeling_betrouwbaarheid?: number | null
          betaaldag?: number
          created_at?: string
          email?: string | null
          huurbedrag?: number
          id?: string
          naam?: string
          notities?: string | null
          property_id?: string
          telefoon?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      checklist_type: "incheck" | "retour"
      contract_type: "langdurig" | "kort" | "airbnb" | "koop"
      energy_label: "A_plus" | "A" | "B" | "C" | "D" | "E" | "F"
      expense_category:
        | "onderhoud"
        | "leegstand"
        | "verzekering"
        | "belasting"
        | "administratie"
        | "energie"
        | "overig"
      loan_type: "eenvoudig" | "gevorderd"
      note_category: "onderhoud" | "energie" | "noodgeval" | "overig"
      property_status: "aankoop" | "renovatie" | "verhuur" | "te_koop"
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
      checklist_type: ["incheck", "retour"],
      contract_type: ["langdurig", "kort", "airbnb", "koop"],
      energy_label: ["A_plus", "A", "B", "C", "D", "E", "F"],
      expense_category: [
        "onderhoud",
        "leegstand",
        "verzekering",
        "belasting",
        "administratie",
        "energie",
        "overig",
      ],
      loan_type: ["eenvoudig", "gevorderd"],
      note_category: ["onderhoud", "energie", "noodgeval", "overig"],
      property_status: ["aankoop", "renovatie", "verhuur", "te_koop"],
    },
  },
} as const
