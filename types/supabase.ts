export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          email: string | null
          hours_of_operation: string | null
          social_media: Json | null
          category: string
          city: string
          state: string
          rating: string | null
          reviews: Json | null
          created_at: string
          updated_at: string
          description: string | null
          images: string[] | null
          rating_score: number | null
          review_count: number | null
          is_pinned: boolean
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          email?: string | null
          hours_of_operation?: string | null
          social_media?: Json | null
          category: string
          city: string
          state: string
          rating?: string | null
          reviews?: Json | null
          created_at?: string
          updated_at?: string
          description?: string | null
          images?: string[] | null
          rating_score?: number | null
          review_count?: number | null
          is_pinned?: boolean
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          email?: string | null
          hours_of_operation?: string | null
          social_media?: Json | null
          category?: string
          city?: string
          state?: string
          rating?: string | null
          reviews?: Json | null
          created_at?: string
          updated_at?: string
          description?: string | null
          images?: string[] | null
          rating_score?: number | null
          review_count?: number | null
          is_pinned?: boolean
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          images: string[] | null
          city: string
          state: string
          category: string | null
          likes: number
          comments: Json | null
          shares: number
          created_at: string
          updated_at: string
          is_pinned: boolean
          is_business_promotion: boolean
          business_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          images?: string[] | null
          city: string
          state: string
          category?: string | null
          likes?: number
          comments?: Json | null
          shares?: number
          created_at?: string
          updated_at?: string
          is_pinned?: boolean
          is_business_promotion?: boolean
          business_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          images?: string[] | null
          city?: string
          state?: string
          category?: string | null
          likes?: number
          comments?: Json | null
          shares?: number
          created_at?: string
          updated_at?: string
          is_pinned?: boolean
          is_business_promotion?: boolean
          business_id?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          city: string | null
          state: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}

export type Business = Database['public']['Tables']['businesses']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export type BusinessInsert = Database['public']['Tables']['businesses']['Insert']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']