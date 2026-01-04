export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          openai_api_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string;
          openai_api_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          openai_api_key?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          intent: string | null;
          budget: string | null;
          timeline: string | null;
          lead_score: number | null;
          summary: string | null;
          stage: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          intent?: string | null;
          budget?: string | null;
          timeline?: string | null;
          lead_score?: number | null;
          summary?: string | null;
          stage?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string | null;
          phone?: string | null;
          intent?: string | null;
          budget?: string | null;
          timeline?: string | null;
          lead_score?: number | null;
          summary?: string | null;
          stage?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_content: {
        Row: {
          id: string;
          user_id: string | null;
          listing_details: string;
          content_type: string;
          generated_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          listing_details: string;
          content_type: string;
          generated_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          listing_details?: string;
          content_type?: string;
          generated_text?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_content_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          id: string;
          user_id: string | null;
          file_url: string | null;
          buyer: string | null;
          seller: string | null;
          price: number | null;
          address: string | null;
          missing_signatures: string[] | null;
          summary: string | null;
          next_tasks: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          file_url?: string | null;
          buyer?: string | null;
          seller?: string | null;
          price?: number | null;
          address?: string | null;
          missing_signatures?: string[] | null;
          summary?: string | null;
          next_tasks?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          file_url?: string | null;
          buyer?: string | null;
          seller?: string | null;
          price?: number | null;
          address?: string | null;
          missing_signatures?: string[] | null;
          summary?: string | null;
          next_tasks?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          deal_id: string | null;
          stage: string | null;
          last_message: string | null;
          next_action: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          deal_id?: string | null;
          stage?: string | null;
          last_message?: string | null;
          next_action?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          deal_id?: string | null;
          stage?: string | null;
          last_message?: string | null;
          next_action?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_deal_id_fkey";
            columns: ["deal_id"];
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          user_id: string | null;
          client_id: string | null;
          sender: "agent" | "ai";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          client_id?: string | null;
          sender: "agent" | "ai";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          client_id?: string | null;
          sender?: "agent" | "ai";
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}


