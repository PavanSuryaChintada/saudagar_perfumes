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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          landmark: string | null
          line1: string
          line2: string | null
          phone: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          line1: string
          line2?: string | null
          phone: string
          pincode: string
          state: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          line1?: string
          line2?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          link: Json | null
          position: number
          starts_at: string | null
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link?: Json | null
          position?: number
          starts_at?: string | null
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link?: Json | null
          position?: number
          starts_at?: string | null
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      attribute_options: {
        Row: {
          badge: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          kind: string
          label: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind: string
          label: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          label?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      carts: {
        Row: {
          coupon_code: string | null
          items: Json
          note: string | null
          samples: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          items?: Json
          note?: string | null
          samples?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          coupon_code?: string | null
          items?: Json
          note?: string | null
          samples?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          position: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          aliases: string[]
          created_at: string
          descriptor: string | null
          headline: string | null
          hero_accent_tag: string | null
          hero_badge: string | null
          hero_poster_url: string | null
          hero_subtext: string | null
          hero_tagline: string | null
          hero_title: string | null
          hero_video_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          notes_subtitle: string | null
          position: number
          seo_description: string | null
          seo_title: string | null
          short_name: string | null
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          descriptor?: string | null
          headline?: string | null
          hero_accent_tag?: string | null
          hero_badge?: string | null
          hero_poster_url?: string | null
          hero_subtext?: string | null
          hero_tagline?: string | null
          hero_title?: string | null
          hero_video_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          notes_subtitle?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          short_name?: string | null
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          descriptor?: string | null
          headline?: string | null
          hero_accent_tag?: string | null
          hero_badge?: string | null
          hero_poster_url?: string | null
          hero_subtext?: string | null
          hero_tagline?: string | null
          hero_title?: string | null
          hero_video_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          notes_subtitle?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          short_name?: string | null
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          group_name: string | null
          id: string
          is_active: boolean
          position: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          group_name?: string | null
          id?: string
          is_active?: boolean
          position?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          group_name?: string | null
          id?: string
          is_active?: boolean
          position?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          actor: string | null
          created_at: string
          delta: number
          id: number
          note: string | null
          order_id: string | null
          reason: string
          stock_after: number
          variant_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          delta: number
          id?: never
          note?: string | null
          order_id?: string | null
          reason: string
          stock_after: number
          variant_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          delta?: number
          id?: never
          note?: string | null
          order_id?: string | null
          reason?: string
          stock_after?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt: string | null
          bucket: string
          bytes: number | null
          created_at: string
          height: number | null
          id: string
          kind: string
          mime: string | null
          original_name: string | null
          path: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          bucket?: string
          bytes?: number | null
          created_at?: string
          height?: number | null
          id?: string
          kind: string
          mime?: string | null
          original_name?: string | null
          path: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          bucket?: string
          bytes?: number | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          mime?: string | null
          original_name?: string | null
          path?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      newsletter_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          family_option_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          position: number
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_option_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          position?: number
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_option_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          position?: number
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_family_option_id_fkey"
            columns: ["family_option_id"]
            isOneToOne: false
            referencedRelation: "attribute_options"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor: string | null
          actor_role: string | null
          created_at: string
          from_status: string | null
          id: number
          kind: string
          message: string | null
          order_id: string
          to_status: string | null
        }
        Insert: {
          actor?: string | null
          actor_role?: string | null
          created_at?: string
          from_status?: string | null
          id?: never
          kind: string
          message?: string | null
          order_id: string
          to_status?: string | null
        }
        Update: {
          actor?: string | null
          actor_role?: string | null
          created_at?: string
          from_status?: string | null
          id?: never
          kind?: string
          message?: string | null
          order_id?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          compare_at_price: number | null
          gst_rate: number | null
          hsn_code: string | null
          id: string
          image_url: string | null
          line_total: number
          line_type: string
          order_id: string
          position: number
          product_id: string | null
          product_name: string
          product_slug: string | null
          qty: number
          sample_auto: boolean
          size_ml: number | null
          sku: string | null
          unit_price: number
          variant_id: string | null
          variant_label: string | null
        }
        Insert: {
          compare_at_price?: number | null
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          line_total?: number
          line_type?: string
          order_id: string
          position?: number
          product_id?: string | null
          product_name: string
          product_slug?: string | null
          qty: number
          sample_auto?: boolean
          size_ml?: number | null
          sku?: string | null
          unit_price?: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Update: {
          compare_at_price?: number | null
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          line_total?: number
          line_type?: string
          order_id?: string
          position?: number
          product_id?: string | null
          product_name?: string
          product_slug?: string | null
          qty?: number
          sample_auto?: boolean
          size_ml?: number | null
          sku?: string | null
          unit_price?: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_note: string | null
          amount_refunded: number
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_ref: string | null
          coupon_code: string | null
          coupon_id: string | null
          courier_name: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          discount: number
          id: string
          note: string | null
          order_number: string
          out_for_delivery_at: string | null
          packed_at: string | null
          paid_at: string | null
          payment_method: string
          payment_status: string
          rto_at: string | null
          samples_entitled: number
          samples_short: number
          ship_city: string | null
          ship_pincode: string
          ship_state: string
          shipped_at: string | null
          shipping_address: Json
          shipping_fee: number
          status: string
          stock_restored_at: string | null
          subtotal: number
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          amount_refunded?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_ref?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount?: number
          id?: string
          note?: string | null
          order_number: string
          out_for_delivery_at?: string | null
          packed_at?: string | null
          paid_at?: string | null
          payment_method: string
          payment_status?: string
          rto_at?: string | null
          samples_entitled?: number
          samples_short?: number
          ship_city?: string | null
          ship_pincode: string
          ship_state: string
          shipped_at?: string | null
          shipping_address: Json
          shipping_fee?: number
          status?: string
          stock_restored_at?: string | null
          subtotal: number
          total: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          amount_refunded?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_ref?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount?: number
          id?: string
          note?: string | null
          order_number?: string
          out_for_delivery_at?: string | null
          packed_at?: string | null
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          rto_at?: string | null
          samples_entitled?: number
          samples_short?: number
          ship_city?: string | null
          ship_pincode?: string
          ship_state?: string
          shipped_at?: string | null
          shipping_address?: Json
          shipping_fee?: number
          status?: string
          stock_restored_at?: string | null
          subtotal?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_published: boolean
          is_system: boolean
          layout: string
          og_image: string | null
          position: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_system?: boolean
          layout?: string
          og_image?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_system?: boolean
          layout?: string
          og_image?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          is_primary: boolean
          option_id: string
          product_id: string
          strength: number | null
        }
        Insert: {
          is_primary?: boolean
          option_id: string
          product_id: string
          strength?: number | null
        }
        Update: {
          is_primary?: boolean
          option_id?: string
          product_id?: string
          strength?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "attribute_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_collections: {
        Row: {
          collection_id: string
          position: number
          product_id: string
        }
        Insert: {
          collection_id: string
          position?: number
          product_id: string
        }
        Update: {
          collection_id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt: string | null
          id: string
          kind: string
          position: number
          product_id: string
          url: string
          variant_id: string | null
        }
        Insert: {
          alt?: string | null
          id?: string
          kind?: string
          position?: number
          product_id: string
          url: string
          variant_id?: string | null
        }
        Update: {
          alt?: string | null
          id?: string
          kind?: string
          position?: number
          product_id?: string
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_notes: {
        Row: {
          note_id: string
          position: number
          product_id: string
          tier: string
        }
        Insert: {
          note_id: string
          position?: number
          product_id: string
          tier: string
        }
        Update: {
          note_id?: string
          position?: number
          product_id?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_notes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          concentration_option_id: string | null
          created_at: string
          height_mm: number | null
          id: string
          in_sample_pool: boolean
          is_active: boolean
          is_hidden: boolean
          kind: string
          label: string
          length_mm: number | null
          position: number
          price: number | null
          product_id: string
          size_ml: number | null
          sku: string
          stock: number
          units_sold: number
          updated_at: string
          weight_g: number | null
          width_mm: number | null
        }
        Insert: {
          compare_at_price?: number | null
          concentration_option_id?: string | null
          created_at?: string
          height_mm?: number | null
          id?: string
          in_sample_pool?: boolean
          is_active?: boolean
          is_hidden?: boolean
          kind?: string
          label: string
          length_mm?: number | null
          position?: number
          price?: number | null
          product_id: string
          size_ml?: number | null
          sku: string
          stock?: number
          units_sold?: number
          updated_at?: string
          weight_g?: number | null
          width_mm?: number | null
        }
        Update: {
          compare_at_price?: number | null
          concentration_option_id?: string | null
          created_at?: string
          height_mm?: number | null
          id?: string
          in_sample_pool?: boolean
          is_active?: boolean
          is_hidden?: boolean
          kind?: string
          label?: string
          length_mm?: number | null
          position?: number
          price?: number | null
          product_id?: string
          size_ml?: number | null
          sku?: string
          stock?: number
          units_sold?: number
          updated_at?: string
          weight_g?: number | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_concentration_option_id_fkey"
            columns: ["concentration_option_id"]
            isOneToOne: false
            referencedRelation: "attribute_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_note: string | null
          allergens: string | null
          archived_at: string | null
          available_sizes: number[]
          badge: string | null
          base_price: number
          caution_text: string | null
          compare_at_price: number | null
          concentration_note: string | null
          consumer_care: string | null
          country_of_origin: string | null
          counts_toward_samples: boolean
          created_at: string
          description: string | null
          gst_rate: number | null
          how_to_wear: string | null
          hsn_code: string | null
          id: string
          importer_address: string | null
          importer_name: string | null
          ingredients: string | null
          inspiration: string | null
          is_active: boolean
          is_featured: boolean
          launch_year: number | null
          manufacturer_address: string | null
          manufacturer_name: string | null
          max_price: number | null
          min_price: number | null
          name: string
          packer_address: string | null
          packer_name: string | null
          page_sections: Json
          perfumer: string | null
          primary_category_id: string | null
          rating_avg: number
          rating_count: number
          search_text: string | null
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          shelf_life: string | null
          ships_surface_only: boolean
          short_description: string | null
          slug: string
          total_stock: number
          units_sold: number
          updated_at: string
          use_default_sections: boolean
        }
        Insert: {
          admin_note?: string | null
          allergens?: string | null
          archived_at?: string | null
          available_sizes?: number[]
          badge?: string | null
          base_price: number
          caution_text?: string | null
          compare_at_price?: number | null
          concentration_note?: string | null
          consumer_care?: string | null
          country_of_origin?: string | null
          counts_toward_samples?: boolean
          created_at?: string
          description?: string | null
          gst_rate?: number | null
          how_to_wear?: string | null
          hsn_code?: string | null
          id?: string
          importer_address?: string | null
          importer_name?: string | null
          ingredients?: string | null
          inspiration?: string | null
          is_active?: boolean
          is_featured?: boolean
          launch_year?: number | null
          manufacturer_address?: string | null
          manufacturer_name?: string | null
          max_price?: number | null
          min_price?: number | null
          name: string
          packer_address?: string | null
          packer_name?: string | null
          page_sections?: Json
          perfumer?: string | null
          primary_category_id?: string | null
          rating_avg?: number
          rating_count?: number
          search_text?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          shelf_life?: string | null
          ships_surface_only?: boolean
          short_description?: string | null
          slug: string
          total_stock?: number
          units_sold?: number
          updated_at?: string
          use_default_sections?: boolean
        }
        Update: {
          admin_note?: string | null
          allergens?: string | null
          archived_at?: string | null
          available_sizes?: number[]
          badge?: string | null
          base_price?: number
          caution_text?: string | null
          compare_at_price?: number | null
          concentration_note?: string | null
          consumer_care?: string | null
          country_of_origin?: string | null
          counts_toward_samples?: boolean
          created_at?: string
          description?: string | null
          gst_rate?: number | null
          how_to_wear?: string | null
          hsn_code?: string | null
          id?: string
          importer_address?: string | null
          importer_name?: string | null
          ingredients?: string | null
          inspiration?: string | null
          is_active?: boolean
          is_featured?: boolean
          launch_year?: number | null
          manufacturer_address?: string | null
          manufacturer_name?: string | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          packer_address?: string | null
          packer_name?: string | null
          page_sections?: Json
          perfumer?: string | null
          primary_category_id?: string | null
          rating_avg?: number
          rating_count?: number
          search_text?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          shelf_life?: string | null
          ships_surface_only?: boolean
          short_description?: string | null
          slug?: string
          total_stock?: number
          units_sold?: number
          updated_at?: string
          use_default_sections?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          dob_locked: boolean
          email: string | null
          full_name: string | null
          id: string
          marketing_opt_in: boolean
          phone: string | null
          updated_at: string
          whatsapp_opt_in: boolean
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          dob_locked?: boolean
          email?: string | null
          full_name?: string | null
          id: string
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
          whatsapp_opt_in?: boolean
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          dob_locked?: boolean
          email?: string | null
          full_name?: string | null
          id?: string
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
          whatsapp_opt_in?: boolean
        }
        Relationships: []
      }
      reel_products: {
        Row: {
          position: number
          product_id: string
          reel_id: string
        }
        Insert: {
          position?: number
          product_id: string
          reel_id: string
        }
        Update: {
          position?: number
          product_id?: string
          reel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_products_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          caption: string | null
          created_at: string
          external_url: string | null
          id: string
          is_active: boolean
          position: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          is_active?: boolean
          position?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          is_active?: boolean
          position?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      site_blocks: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      stockists: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          hours: string | null
          id: string
          image_url: string | null
          is_active: boolean
          map_url: string | null
          name: string
          phone: string | null
          position: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          map_url?: string | null
          name: string
          phone?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          map_url?: string | null
          name?: string
          phone?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          image_url: string | null
          is_active: boolean
          position: number
          product_id: string | null
          subtitle: string | null
          tag: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          product_id?: string | null
          subtitle?: string | null
          tag?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          product_id?: string | null
          subtitle?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          name: string
          position: number
          product_id: string | null
          quote: string
          rating: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          position?: number
          product_id?: string | null
          quote: string
          rating?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          position?: number
          product_id?: string | null
          quote?: string
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_visible: boolean
          label: string | null
          page_id: string
          position: number
          section_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          label?: string | null
          page_id: string
          position?: number
          section_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          label?: string | null
          page_id?: string
          position?: number
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: {
          p_delta: number
          p_note?: string
          p_reason: string
          p_variant: string
        }
        Returns: number
      }
      archive_product: {
        Args: { p_archived?: boolean; p_id: string }
        Returns: undefined
      }
      cancel_order: {
        Args: { p_order: string; p_reason?: string }
        Returns: undefined
      }
      catalog_filters: { Args: never; Returns: Json }
      category_with_children: { Args: { p_slug: string }; Returns: string[] }
      create_order: {
        Args: {
          p_address_id: string
          p_client_ref?: string
          p_coupon_code?: string
          p_items: Json
          p_note?: string
          p_payment_method?: string
          p_samples?: Json
        }
        Returns: Json
      }
      create_sample_variant: {
        Args: { p_product: string; p_size_ml?: number; p_stock?: number }
        Returns: string
      }
      delete_product: { Args: { p_id: string }; Returns: undefined }
      duplicate_product: { Args: { p_id: string }; Returns: string }
      duplicate_section: { Args: { p_id: string }; Returns: string }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _uid: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      jsonb_text_array: { Args: { j: Json }; Returns: string[] }
      normalize_indian_phone: { Args: { input: string }; Returns: string }
      order_transition_allowed: {
        Args: {
          p_from: string
          p_payment_method: string
          p_payment_status: string
          p_to: string
        }
        Returns: boolean
      }
      page_content: { Args: { p_slug: string }; Returns: Json }
      page_is_published: { Args: { pid: string }; Returns: boolean }
      product_card: { Args: { pid: string }; Returns: Json }
      product_detail: { Args: { p_slug: string }; Returns: Json }
      product_is_visible: { Args: { pid: string }; Returns: boolean }
      quote_order: {
        Args: {
          p_coupon_code?: string
          p_items: Json
          p_payment_method?: string
          p_samples?: Json
        }
        Returns: Json
      }
      reorder_collection_products: {
        Args: { p_collection: string; p_product_ids: string[] }
        Returns: undefined
      }
      reorder_rows: {
        Args: { p_ids: string[]; p_table: string }
        Returns: undefined
      }
      resolve_category: { Args: { p_slug: string }; Returns: Json }
      resolve_collection: { Args: { p_slug: string }; Returns: Json }
      resolve_note: { Args: { p_slug: string }; Returns: Json }
      safe_birthday: { Args: { input: string }; Returns: string }
      sample_pool: {
        Args: never
        Returns: {
          family: string
          image: string
          label: string
          name: string
          product_id: string
          slug: string
          variant_id: string
        }[]
      }
      save_product: { Args: { payload: Json }; Returns: string }
      search_products: { Args: { p?: Json }; Returns: Json }
      search_suggest: { Args: { q: string }; Returns: Json }
      set_order_status: {
        Args: { p_note?: string; p_order: string; p_status: string }
        Returns: undefined
      }
      similar_products: {
        Args: { p_limit?: number; p_slug: string }
        Returns: Json
      }
      site_bootstrap: { Args: never; Returns: Json }
      subscribe_newsletter: {
        Args: { p_email: string; p_source?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "customer"
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
  public: {
    Enums: {
      app_role: ["admin", "customer"],
    },
  },
} as const
