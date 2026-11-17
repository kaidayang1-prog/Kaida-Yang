
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admin_actions": {
                  Row: {
                    "action": string,"admin_id": string | null,"created_at": string,"id": number,"note": string | null,"target_id": string,"target_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"admin_id"?: string | null,"created_at"?: string,"id"?: never,"note"?: string | null,"target_id": string,"target_type": string
                  }
                  Update: {
                    "action"?: string,"admin_id"?: string | null,"created_at"?: string,"id"?: never,"note"?: string | null,"target_id"?: string,"target_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_actions_admin_id_fkey"
      columns: ["admin_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"app_settings": {
                  Row: {
                    "key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"badges": {
                  Row: {
                    "code": string,"is_active": boolean,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"is_active"?: boolean,"sort"?: number
                  }
                  Update: {
                    "code"?: string,"is_active"?: boolean,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"booking_pins": {
                  Row: {
                    "booking_id": string,"created_at": string,"pin": string
                  }
                  ComputedFields: never
                  Insert: {
                    "booking_id": string,"created_at"?: string,"pin": string
                  }
                  Update: {
                    "booking_id"?: string,"created_at"?: string,"pin"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "booking_pins_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"bookings": {
                  Row: {
                    "boarded_at": string | null,"cancelled_at": string | null,"created_at": string,"decided_at": string | null,"dropoff_tmp_id": string,"id": string,"message": string | null,"no_show_at": string | null,"party_size": number,"pickup_tmp_id": string,"rider_id": string,"status": Database["public"]['Enums']["booking_status"],"trip_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "boarded_at"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"decided_at"?: string | null,"dropoff_tmp_id": string,"id"?: string,"message"?: string | null,"no_show_at"?: string | null,"party_size"?: number,"pickup_tmp_id": string,"rider_id": string,"status"?: Database["public"]['Enums']["booking_status"],"trip_id": string,"updated_at"?: string
                  }
                  Update: {
                    "boarded_at"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"decided_at"?: string | null,"dropoff_tmp_id"?: string,"id"?: string,"message"?: string | null,"no_show_at"?: string | null,"party_size"?: number,"pickup_tmp_id"?: string,"rider_id"?: string,"status"?: Database["public"]['Enums']["booking_status"],"trip_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_rider_id_fkey"
      columns: ["rider_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_trip_id_dropoff_tmp_id_fkey"
      columns: ["trip_id","dropoff_tmp_id"]
isOneToOne: false
      referencedRelation: "trip_meeting_points"
      referencedColumns: ["trip_id","id"]
    },{
      foreignKeyName: "bookings_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_trip_id_pickup_tmp_id_fkey"
      columns: ["trip_id","pickup_tmp_id"]
isOneToOne: false
      referencedRelation: "trip_meeting_points"
      referencedColumns: ["trip_id","id"]
    }
                  ]
                },"cleanliness_ratings": {
                  Row: {
                    "created_at": string,"id": string,"rater_id": string,"score": number,"tags": (string)[],"trip_id": string,"vehicle_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"rater_id": string,"score": number,"tags"?: (string)[],"trip_id": string,"vehicle_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"rater_id"?: string,"score"?: number,"tags"?: (string)[],"trip_id"?: string,"vehicle_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cleanliness_ratings_rater_id_fkey"
      columns: ["rater_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cleanliness_ratings_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cleanliness_ratings_vehicle_id_fkey"
      columns: ["vehicle_id"]
isOneToOne: false
      referencedRelation: "vehicles"
      referencedColumns: ["id"]
    }
                  ]
                },"communities": {
                  Row: {
                    "center_lat": number | null,"center_lng": number | null,"city": string,"created_at": string,"email_domain": string | null,"id": string,"is_active": boolean,"kind": Database["public"]['Enums']["community_kind"],"name_en": string,"name_zh": string,"radius_m": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "center_lat"?: number | null,"center_lng"?: number | null,"city"?: string,"created_at"?: string,"email_domain"?: string | null,"id"?: string,"is_active"?: boolean,"kind": Database["public"]['Enums']["community_kind"],"name_en": string,"name_zh": string,"radius_m"?: number | null
                  }
                  Update: {
                    "center_lat"?: number | null,"center_lng"?: number | null,"city"?: string,"created_at"?: string,"email_domain"?: string | null,"id"?: string,"is_active"?: boolean,"kind"?: Database["public"]['Enums']["community_kind"],"name_en"?: string,"name_zh"?: string,"radius_m"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"community_members": {
                  Row: {
                    "community_id": string,"joined_at": string,"source": Database["public"]['Enums']["membership_source"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "community_id": string,"joined_at"?: string,"source": Database["public"]['Enums']["membership_source"],"user_id": string
                  }
                  Update: {
                    "community_id"?: string,"joined_at"?: string,"source"?: Database["public"]['Enums']["membership_source"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_members_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"community_posts": {
                  Row: {
                    "author_id": string,"body": string | null,"community_id": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["post_kind"],"price_cents": number | null,"status": Database["public"]['Enums']["post_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body"?: string | null,"community_id": string,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["post_kind"],"price_cents"?: number | null,"status"?: Database["public"]['Enums']["post_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string | null,"community_id"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["post_kind"],"price_cents"?: number | null,"status"?: Database["public"]['Enums']["post_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_posts_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    }
                  ]
                },"community_requests": {
                  Row: {
                    "building_or_area": string,"created_at": string,"id": string,"note": string | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "building_or_area": string,"created_at"?: string,"id"?: string,"note"?: string | null,"status"?: string,"user_id": string
                  }
                  Update: {
                    "building_or_area"?: string,"created_at"?: string,"id"?: string,"note"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"coupon_codes": {
                  Row: {
                    "assigned_at": string | null,"code": string,"coupon_id": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_at"?: string | null,"code": string,"coupon_id": string,"id"?: string
                  }
                  Update: {
                    "assigned_at"?: string | null,"code"?: string,"coupon_id"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coupon_codes_coupon_id_fkey"
      columns: ["coupon_id"]
isOneToOne: false
      referencedRelation: "coupons"
      referencedColumns: ["id"]
    }
                  ]
                },"coupon_grants": {
                  Row: {
                    "code": string | null,"coupon_id": string,"granted_at": string,"id": string,"trip_id": string | null,"used_marked_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code"?: string | null,"coupon_id": string,"granted_at"?: string,"id"?: string,"trip_id"?: string | null,"used_marked_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "code"?: string | null,"coupon_id"?: string,"granted_at"?: string,"id"?: string,"trip_id"?: string | null,"used_marked_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coupon_grants_coupon_id_fkey"
      columns: ["coupon_id"]
isOneToOne: false
      referencedRelation: "coupons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_grants_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_grants_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"coupons": {
                  Row: {
                    "award_rule": string,"created_at": string,"created_by": string | null,"details_en": string | null,"details_zh": string | null,"id": string,"image_path": string | null,"is_active": boolean,"merchant": string,"quantity_granted": number,"quantity_total": number | null,"title_en": string,"title_zh": string,"valid_from": string | null,"valid_until": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "award_rule"?: string,"created_at"?: string,"created_by"?: string | null,"details_en"?: string | null,"details_zh"?: string | null,"id"?: string,"image_path"?: string | null,"is_active"?: boolean,"merchant": string,"quantity_granted"?: number,"quantity_total"?: number | null,"title_en": string,"title_zh": string,"valid_from"?: string | null,"valid_until"?: string | null
                  }
                  Update: {
                    "award_rule"?: string,"created_at"?: string,"created_by"?: string | null,"details_en"?: string | null,"details_zh"?: string | null,"id"?: string,"image_path"?: string | null,"is_active"?: boolean,"merchant"?: string,"quantity_granted"?: number,"quantity_total"?: number | null,"title_en"?: string,"title_zh"?: string,"valid_from"?: string | null,"valid_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "coupons_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"credit_events": {
                  Row: {
                    "booking_id": string | null,"created_at": string,"delta": number,"id": number,"note": string | null,"reason": Database["public"]['Enums']["credit_reason"],"trip_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "booking_id"?: string | null,"created_at"?: string,"delta": number,"id"?: never,"note"?: string | null,"reason": Database["public"]['Enums']["credit_reason"],"trip_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "booking_id"?: string | null,"created_at"?: string,"delta"?: number,"id"?: never,"note"?: string | null,"reason"?: Database["public"]['Enums']["credit_reason"],"trip_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "credit_events_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "credit_events_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "credit_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"destinations": {
                  Row: {
                    "address": string,"brand": string,"created_at": string,"id": string,"is_active": boolean,"lat": number,"lng": number,"name_en": string,"name_zh": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"brand": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"lat": number,"lng": number,"name_en": string,"name_zh": string
                  }
                  Update: {
                    "address"?: string,"brand"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"lat"?: number,"lng"?: number,"name_en"?: string,"name_zh"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fare_settlements": {
                  Row: {
                    "finalized_at": string,"fuel_l_per_100km": number,"gas_cents_per_litre": number,"legs": NonNullable<Json>,"route_version": number,"total_cents": number,"trip_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "finalized_at"?: string,"fuel_l_per_100km": number,"gas_cents_per_litre": number,"legs": NonNullable<Json>,"route_version": number,"total_cents": number,"trip_id": string
                  }
                  Update: {
                    "finalized_at"?: string,"fuel_l_per_100km"?: number,"gas_cents_per_litre"?: number,"legs"?: NonNullable<Json>,"route_version"?: number,"total_cents"?: number,"trip_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fare_settlements_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: true
      referencedRelation: "trips"
      referencedColumns: ["id"]
    }
                  ]
                },"fare_shares": {
                  Row: {
                    "amount_cents": number,"booking_id": string | null,"exact_cents": number,"id": number,"is_driver": boolean,"paid_marked_at": string | null,"received_confirmed_at": string | null,"trip_id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"booking_id"?: string | null,"exact_cents": number,"id"?: never,"is_driver"?: boolean,"paid_marked_at"?: string | null,"received_confirmed_at"?: string | null,"trip_id": string,"user_id"?: string | null
                  }
                  Update: {
                    "amount_cents"?: number,"booking_id"?: string | null,"exact_cents"?: number,"id"?: never,"is_driver"?: boolean,"paid_marked_at"?: string | null,"received_confirmed_at"?: string | null,"trip_id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fare_shares_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fare_shares_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "fare_settlements"
      referencedColumns: ["trip_id"]
    },{
      foreignKeyName: "fare_shares_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"follows": {
                  Row: {
                    "created_at": string,"driver_id": string,"follower_id": string,"notify": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"driver_id": string,"follower_id": string,"notify"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"driver_id"?: string,"follower_id"?: string,"notify"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_driver_id_fkey"
      columns: ["driver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"fuel_prices": {
                  Row: {
                    "cents_per_litre": number,"created_at": string,"created_by": string | null,"effective_from": string,"id": number,"region": string,"source_note": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cents_per_litre": number,"created_at"?: string,"created_by"?: string | null,"effective_from": string,"id"?: never,"region"?: string,"source_note"?: string | null
                  }
                  Update: {
                    "cents_per_litre"?: number,"created_at"?: string,"created_by"?: string | null,"effective_from"?: string,"id"?: never,"region"?: string,"source_note"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fuel_prices_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"group_buy_participants": {
                  Row: {
                    "group_buy_id": string,"joined_at": string,"paid_marked_at": string | null,"portions": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "group_buy_id": string,"joined_at"?: string,"paid_marked_at"?: string | null,"portions"?: number,"user_id": string
                  }
                  Update: {
                    "group_buy_id"?: string,"joined_at"?: string,"paid_marked_at"?: string | null,"portions"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_buy_participants_group_buy_id_fkey"
      columns: ["group_buy_id"]
isOneToOne: false
      referencedRelation: "group_buys"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_buy_participants_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"group_buys": {
                  Row: {
                    "created_at": string,"details": string | null,"est_total_cents": number | null,"handoff_tmp_id": string | null,"id": string,"organizer_id": string,"portions_total": number,"receipt_photo_path": string | null,"receipt_total_cents": number | null,"status": Database["public"]['Enums']["group_buy_status"],"title": string,"trip_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"est_total_cents"?: number | null,"handoff_tmp_id"?: string | null,"id"?: string,"organizer_id": string,"portions_total": number,"receipt_photo_path"?: string | null,"receipt_total_cents"?: number | null,"status"?: Database["public"]['Enums']["group_buy_status"],"title": string,"trip_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"est_total_cents"?: number | null,"handoff_tmp_id"?: string | null,"id"?: string,"organizer_id"?: string,"portions_total"?: number,"receipt_photo_path"?: string | null,"receipt_total_cents"?: number | null,"status"?: Database["public"]['Enums']["group_buy_status"],"title"?: string,"trip_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_buys_organizer_id_fkey"
      columns: ["organizer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_buys_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_buys_trip_id_handoff_tmp_id_fkey"
      columns: ["trip_id","handoff_tmp_id"]
isOneToOne: false
      referencedRelation: "trip_meeting_points"
      referencedColumns: ["trip_id","id"]
    }
                  ]
                },"identity_verifications": {
                  Row: {
                    "created_at": string,"id": string,"licence_back_path": string | null,"licence_front_path": string | null,"note": string | null,"real_name": string,"reviewed_at": string | null,"reviewer_id": string | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"licence_back_path"?: string | null,"licence_front_path"?: string | null,"note"?: string | null,"real_name": string,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"status"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"licence_back_path"?: string | null,"licence_front_path"?: string | null,"note"?: string | null,"real_name"?: string,"reviewed_at"?: string | null,"reviewer_id"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "identity_verifications_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "identity_verifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"meeting_points": {
                  Row: {
                    "community_id": string | null,"created_at": string,"created_by": string | null,"description": string | null,"id": string,"is_active": boolean,"is_official": boolean,"kind": Database["public"]['Enums']["meeting_point_kind"],"lat": number,"lng": number,"name_en": string | null,"name_zh": string
                  }
                  ComputedFields: never
                  Insert: {
                    "community_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_official"?: boolean,"kind"?: Database["public"]['Enums']["meeting_point_kind"],"lat": number,"lng": number,"name_en"?: string | null,"name_zh": string
                  }
                  Update: {
                    "community_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_official"?: boolean,"kind"?: Database["public"]['Enums']["meeting_point_kind"],"lat"?: number,"lng"?: number,"name_en"?: string | null,"name_zh"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meeting_points_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meeting_points_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": number,"payload": NonNullable<Json>,"pushed_at": string | null,"read_at": string | null,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"payload"?: NonNullable<Json>,"pushed_at"?: string | null,"read_at"?: string | null,"type": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"payload"?: NonNullable<Json>,"pushed_at"?: string | null,"read_at"?: string | null,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"points_ledger": {
                  Row: {
                    "created_at": string,"delta": number,"id": number,"note": string | null,"reason": Database["public"]['Enums']["points_reason"],"trip_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"delta": number,"id"?: never,"note"?: string | null,"reason": Database["public"]['Enums']["points_reason"],"trip_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"delta"?: number,"id"?: never,"note"?: string | null,"reason"?: Database["public"]['Enums']["points_reason"],"trip_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "points_ledger_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "points_ledger_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"post_comments": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": number,"post_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: never,"post_id": string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: never,"post_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "community_posts"
      referencedColumns: ["id"]
    }
                  ]
                },"post_photos": {
                  Row: {
                    "created_at": string,"id": string,"post_id": string,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"post_id": string,"storage_path": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"post_id"?: string,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_photos_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "community_posts"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "active_role": Database["public"]['Enums']["user_role"],"avatar_path": string | null,"bio": string | null,"created_at": string,"display_name": string,"full_verified_at": string | null,"id": string,"is_admin": boolean,"locale": string,"onboarded_at": string | null,"primary_role": Database["public"]['Enums']["user_role"] | null,"rating_avg": number | null,"rating_count": number,"status": Database["public"]['Enums']["account_status"],"trips_completed": number,"updated_at": string,"verification_level": Database["public"]['Enums']["verification_level"]
                  }
                  ComputedFields: never
                  Insert: {
                    "active_role"?: Database["public"]['Enums']["user_role"],"avatar_path"?: string | null,"bio"?: string | null,"created_at"?: string,"display_name"?: string,"full_verified_at"?: string | null,"id": string,"is_admin"?: boolean,"locale"?: string,"onboarded_at"?: string | null,"primary_role"?: Database["public"]['Enums']["user_role"] | null,"rating_avg"?: number | null,"rating_count"?: number,"status"?: Database["public"]['Enums']["account_status"],"trips_completed"?: number,"updated_at"?: string,"verification_level"?: Database["public"]['Enums']["verification_level"]
                  }
                  Update: {
                    "active_role"?: Database["public"]['Enums']["user_role"],"avatar_path"?: string | null,"bio"?: string | null,"created_at"?: string,"display_name"?: string,"full_verified_at"?: string | null,"id"?: string,"is_admin"?: boolean,"locale"?: string,"onboarded_at"?: string | null,"primary_role"?: Database["public"]['Enums']["user_role"] | null,"rating_avg"?: number | null,"rating_count"?: number,"status"?: Database["public"]['Enums']["account_status"],"trips_completed"?: number,"updated_at"?: string,"verification_level"?: Database["public"]['Enums']["verification_level"]
                  }
                  Relationships: [
                    
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth_secret": string | null,"created_at": string,"device_token": string | null,"endpoint": string | null,"id": string,"last_seen_at": string,"p256dh": string | null,"platform": Database["public"]['Enums']["push_platform"],"user_agent": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth_secret"?: string | null,"created_at"?: string,"device_token"?: string | null,"endpoint"?: string | null,"id"?: string,"last_seen_at"?: string,"p256dh"?: string | null,"platform": Database["public"]['Enums']["push_platform"],"user_agent"?: string | null,"user_id": string
                  }
                  Update: {
                    "auth_secret"?: string | null,"created_at"?: string,"device_token"?: string | null,"endpoint"?: string | null,"id"?: string,"last_seen_at"?: string,"p256dh"?: string | null,"platform"?: Database["public"]['Enums']["push_platform"],"user_agent"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"handled_at": string | null,"handled_by": string | null,"id": string,"reason": Database["public"]['Enums']["report_reason"],"reporter_id": string | null,"resolution_note": string | null,"status": Database["public"]['Enums']["report_status"],"target_id": string,"target_type": Database["public"]['Enums']["report_target"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: string,"reason": Database["public"]['Enums']["report_reason"],"reporter_id"?: string | null,"resolution_note"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_id": string,"target_type": Database["public"]['Enums']["report_target"]
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: string,"reason"?: Database["public"]['Enums']["report_reason"],"reporter_id"?: string | null,"resolution_note"?: string | null,"status"?: Database["public"]['Enums']["report_status"],"target_id"?: string,"target_type"?: Database["public"]['Enums']["report_target"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_handled_by_fkey"
      columns: ["handled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "comment": string | null,"created_at": string,"id": string,"reviewee_id": string,"reviewer_id": string,"stars": number,"tags": (string)[],"trip_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"created_at"?: string,"id"?: string,"reviewee_id": string,"reviewer_id": string,"stars": number,"tags"?: (string)[],"trip_id": string
                  }
                  Update: {
                    "comment"?: string | null,"created_at"?: string,"id"?: string,"reviewee_id"?: string,"reviewer_id"?: string,"stars"?: number,"tags"?: (string)[],"trip_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_reviewee_id_fkey"
      columns: ["reviewee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    }
                  ]
                },"route_legs": {
                  Row: {
                    "computed_at": string,"distance_km": number,"duration_min": number | null,"route_version": number,"seq": number,"source": Database["public"]['Enums']["route_source"],"trip_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "computed_at"?: string,"distance_km": number,"duration_min"?: number | null,"route_version": number,"seq": number,"source": Database["public"]['Enums']["route_source"],"trip_id": string
                  }
                  Update: {
                    "computed_at"?: string,"distance_km"?: number,"duration_min"?: number | null,"route_version"?: number,"seq"?: number,"source"?: Database["public"]['Enums']["route_source"],"trip_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "route_legs_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    }
                  ]
                },"route_stops": {
                  Row: {
                    "kind": string,"lat": number,"lng": number,"route_version": number,"seq": number,"trip_id": string,"trip_meeting_point_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "kind": string,"lat": number,"lng": number,"route_version": number,"seq": number,"trip_id": string,"trip_meeting_point_id"?: string | null
                  }
                  Update: {
                    "kind"?: string,"lat"?: number,"lng"?: number,"route_version"?: number,"seq"?: number,"trip_id"?: string,"trip_meeting_point_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "route_stops_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "route_stops_trip_meeting_point_id_fkey"
      columns: ["trip_meeting_point_id"]
isOneToOne: false
      referencedRelation: "trip_meeting_points"
      referencedColumns: ["id"]
    }
                  ]
                },"trip_meeting_points": {
                  Row: {
                    "created_at": string,"id": string,"meeting_point_id": string,"pass_at": string | null,"proposal_note": string | null,"proposed_by": string | null,"seq": number | null,"status": Database["public"]['Enums']["trip_mp_status"],"trip_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"meeting_point_id": string,"pass_at"?: string | null,"proposal_note"?: string | null,"proposed_by"?: string | null,"seq"?: number | null,"status"?: Database["public"]['Enums']["trip_mp_status"],"trip_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"meeting_point_id"?: string,"pass_at"?: string | null,"proposal_note"?: string | null,"proposed_by"?: string | null,"seq"?: number | null,"status"?: Database["public"]['Enums']["trip_mp_status"],"trip_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trip_meeting_points_meeting_point_id_fkey"
      columns: ["meeting_point_id"]
isOneToOne: false
      referencedRelation: "meeting_points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trip_meeting_points_proposed_by_fkey"
      columns: ["proposed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trip_meeting_points_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    }
                  ]
                },"trip_messages": {
                  Row: {
                    "body": string,"created_at": string,"deleted_at": string | null,"id": number,"phrase_key": string | null,"sender_id": string | null,"trip_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"deleted_at"?: string | null,"id"?: never,"phrase_key"?: string | null,"sender_id"?: string | null,"trip_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"deleted_at"?: string | null,"id"?: never,"phrase_key"?: string | null,"sender_id"?: string | null,"trip_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trip_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trip_messages_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id"]
    }
                  ]
                },"trip_series": {
                  Row: {
                    "community_id": string | null,"created_at": string,"depart_time": string,"destination_id": string,"driver_id": string,"ends_on": string | null,"est_return_minutes": number | null,"id": string,"is_active": boolean,"min_riders": number,"notes": string | null,"seats_offered": number,"signup_close_hours": number,"starts_on": string,"vehicle_id": string,"visibility": Database["public"]['Enums']["trip_visibility"],"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "community_id"?: string | null,"created_at"?: string,"depart_time": string,"destination_id": string,"driver_id": string,"ends_on"?: string | null,"est_return_minutes"?: number | null,"id"?: string,"is_active"?: boolean,"min_riders"?: number,"notes"?: string | null,"seats_offered": number,"signup_close_hours"?: number,"starts_on": string,"vehicle_id": string,"visibility"?: Database["public"]['Enums']["trip_visibility"],"weekday": number
                  }
                  Update: {
                    "community_id"?: string | null,"created_at"?: string,"depart_time"?: string,"destination_id"?: string,"driver_id"?: string,"ends_on"?: string | null,"est_return_minutes"?: number | null,"id"?: string,"is_active"?: boolean,"min_riders"?: number,"notes"?: string | null,"seats_offered"?: number,"signup_close_hours"?: number,"starts_on"?: string,"vehicle_id"?: string,"visibility"?: Database["public"]['Enums']["trip_visibility"],"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "trip_series_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trip_series_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trip_series_driver_id_fkey"
      columns: ["driver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trip_series_vehicle_id_fkey"
      columns: ["vehicle_id"]
isOneToOne: false
      referencedRelation: "vehicles"
      referencedColumns: ["id"]
    }
                  ]
                },"trip_series_meeting_points": {
                  Row: {
                    "meeting_point_id": string,"offset_minutes": number,"seq": number,"series_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "meeting_point_id": string,"offset_minutes"?: number,"seq": number,"series_id": string
                  }
                  Update: {
                    "meeting_point_id"?: string,"offset_minutes"?: number,"seq"?: number,"series_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trip_series_meeting_points_meeting_point_id_fkey"
      columns: ["meeting_point_id"]
isOneToOne: false
      referencedRelation: "meeting_points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trip_series_meeting_points_series_id_fkey"
      columns: ["series_id"]
isOneToOne: false
      referencedRelation: "trip_series"
      referencedColumns: ["id"]
    }
                  ]
                },"trip_series_skips": {
                  Row: {
                    "series_id": string,"skip_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "series_id": string,"skip_date": string
                  }
                  Update: {
                    "series_id"?: string,"skip_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trip_series_skips_series_id_fkey"
      columns: ["series_id"]
isOneToOne: false
      referencedRelation: "trip_series"
      referencedColumns: ["id"]
    }
                  ]
                },"trips": {
                  Row: {
                    "cancel_reason": Database["public"]['Enums']["cancel_reason"] | null,"cancelled_at": string | null,"community_id": string | null,"completed_at": string | null,"created_at": string,"depart_at": string,"destination_id": string,"driver_id": string,"est_return_at": string | null,"fuel_l_per_100km": number,"gas_cents_per_litre": number,"id": string,"min_riders": number,"notes": string | null,"route_version": number,"seats_offered": number,"series_id": string | null,"share_token": string,"signup_deadline": string,"started_at": string | null,"status": Database["public"]['Enums']["trip_status"],"updated_at": string,"vehicle_id": string,"visibility": Database["public"]['Enums']["trip_visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_reason"?: Database["public"]['Enums']["cancel_reason"] | null,"cancelled_at"?: string | null,"community_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"depart_at": string,"destination_id": string,"driver_id": string,"est_return_at"?: string | null,"fuel_l_per_100km": number,"gas_cents_per_litre": number,"id"?: string,"min_riders"?: number,"notes"?: string | null,"route_version"?: number,"seats_offered": number,"series_id"?: string | null,"share_token"?: string,"signup_deadline": string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["trip_status"],"updated_at"?: string,"vehicle_id": string,"visibility"?: Database["public"]['Enums']["trip_visibility"]
                  }
                  Update: {
                    "cancel_reason"?: Database["public"]['Enums']["cancel_reason"] | null,"cancelled_at"?: string | null,"community_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"depart_at"?: string,"destination_id"?: string,"driver_id"?: string,"est_return_at"?: string | null,"fuel_l_per_100km"?: number,"gas_cents_per_litre"?: number,"id"?: string,"min_riders"?: number,"notes"?: string | null,"route_version"?: number,"seats_offered"?: number,"series_id"?: string | null,"share_token"?: string,"signup_deadline"?: string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["trip_status"],"updated_at"?: string,"vehicle_id"?: string,"visibility"?: Database["public"]['Enums']["trip_visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "trips_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trips_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "destinations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trips_driver_id_fkey"
      columns: ["driver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trips_series_id_fkey"
      columns: ["series_id"]
isOneToOne: false
      referencedRelation: "trip_series"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trips_vehicle_id_fkey"
      columns: ["vehicle_id"]
isOneToOne: false
      referencedRelation: "vehicles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_badges": {
                  Row: {
                    "awarded_at": string,"badge_code": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "awarded_at"?: string,"badge_code": string,"user_id": string
                  }
                  Update: {
                    "awarded_at"?: string,"badge_code"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_badges_badge_code_fkey"
      columns: ["badge_code"]
isOneToOne: false
      referencedRelation: "badges"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "user_badges_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_credit": {
                  Row: {
                    "no_shows_60d": number,"restricted_until": string | null,"score": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "no_shows_60d"?: number,"restricted_until"?: string | null,"score"?: number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "no_shows_60d"?: number,"restricted_until"?: string | null,"score"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_credit_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_private": {
                  Row: {
                    "home_address": string | null,"home_lat": number | null,"home_lng": number | null,"phone": string | null,"school_email": string | null,"school_email_verified_at": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "home_address"?: string | null,"home_lat"?: number | null,"home_lng"?: number | null,"phone"?: string | null,"school_email"?: string | null,"school_email_verified_at"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "home_address"?: string | null,"home_lat"?: number | null,"home_lng"?: number | null,"phone"?: string | null,"school_email"?: string | null,"school_email_verified_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_private_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"vehicle_photos": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"storage_path": string,"vehicle_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"storage_path": string,"vehicle_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"storage_path"?: string,"vehicle_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vehicle_photos_vehicle_id_fkey"
      columns: ["vehicle_id"]
isOneToOne: false
      referencedRelation: "vehicles"
      referencedColumns: ["id"]
    }
                  ]
                },"vehicle_plates": {
                  Row: {
                    "plate": string,"vehicle_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "plate": string,"vehicle_id": string
                  }
                  Update: {
                    "plate"?: string,"vehicle_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vehicle_plates_vehicle_id_fkey"
      columns: ["vehicle_id"]
isOneToOne: true
      referencedRelation: "vehicles"
      referencedColumns: ["id"]
    }
                  ]
                },"vehicles": {
                  Row: {
                    "cleanliness_avg": number | null,"cleanliness_count": number,"color": string,"created_at": string,"fuel_l_per_100km": number,"id": string,"is_active": boolean,"listing_paused": boolean,"make_model": string,"owner_id": string,"pets": boolean,"photos_updated_at": string | null,"plate_hint": string | null,"seats_total": number,"smoking": boolean,"trunk_size": Database["public"]['Enums']["trunk_size"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cleanliness_avg"?: number | null,"cleanliness_count"?: number,"color": string,"created_at"?: string,"fuel_l_per_100km": number,"id"?: string,"is_active"?: boolean,"listing_paused"?: boolean,"make_model": string,"owner_id": string,"pets"?: boolean,"photos_updated_at"?: string | null,"plate_hint"?: string | null,"seats_total": number,"smoking"?: boolean,"trunk_size"?: Database["public"]['Enums']["trunk_size"],"updated_at"?: string
                  }
                  Update: {
                    "cleanliness_avg"?: number | null,"cleanliness_count"?: number,"color"?: string,"created_at"?: string,"fuel_l_per_100km"?: number,"id"?: string,"is_active"?: boolean,"listing_paused"?: boolean,"make_model"?: string,"owner_id"?: string,"pets"?: boolean,"photos_updated_at"?: string | null,"plate_hint"?: string | null,"seats_total"?: number,"smoking"?: boolean,"trunk_size"?: Database["public"]['Enums']["trunk_size"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vehicles_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_rate_vehicle":
{ Args: { "p_trip": string,"p_vehicle": string }; Returns: boolean
                           },
"can_review":
{ Args: { "p_reviewee": string,"p_trip": string }; Returns: boolean
                           },
"can_see_plate":
{ Args: { "p_vehicle": string }; Returns: boolean
                           },
"can_view_group_buy":
{ Args: { "p_group_buy": string }; Returns: boolean
                           },
"can_view_post":
{ Args: { "p_post": string }; Returns: boolean
                           },
"can_view_trip":
{ Args: { "p_trip": string }; Returns: boolean
                           },
"can_view_vehicle":
{ Args: { "p_vehicle": string }; Returns: boolean
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"distance_m":
{ Args: { "lat1": number,"lat2": number,"lng1": number,"lng2": number }; Returns: number
                           },
"group_buy_is_open":
{ Args: { "p_group_buy": string }; Returns: boolean
                           },
"has_booking":
{ Args: { "p_trip": string }; Returns: boolean
                           },
"is_active_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_driver_of_rider":
{ Args: { "p_rider": string }; Returns: boolean
                           },
"is_group_buy_organizer":
{ Args: { "p_group_buy": string }; Returns: boolean
                           },
"is_member_of":
{ Args: { "p_community": string }; Returns: boolean
                           },
"is_profile_active":
{ Args: { "p_user": string }; Returns: boolean
                           },
"is_trip_driver":
{ Args: { "p_trip": string }; Returns: boolean
                           },
"is_trip_participant":
{ Args: { "p_trip": string }; Returns: boolean
                           },
"join_community_by_address":
{ Args: { "p_community": string }; Returns: undefined
                           },
"mp_in_visible_trip":
{ Args: { "p_mp": string }; Returns: boolean
                           },
"nearby_communities":
{ Args: Record<PropertyKey, never>; Returns: {
              "distance_m": number,"id": string,"kind": Database["public"]['Enums']["community_kind"],"name_en": string,"name_zh": string
            }[]
                           },
"owns_post":
{ Args: { "p_post": string }; Returns: boolean
                           },
"owns_series":
{ Args: { "p_series": string }; Returns: boolean
                           },
"owns_vehicle":
{ Args: { "p_vehicle": string }; Returns: boolean
                           },
"refresh_verification_level":
{ Args: { "p_user": string }; Returns: undefined
                           },
"setting_int":
{ Args: { "p_default": number,"p_key": string }; Returns: number
                           },
"try_uuid":
{ Args: { "p": string }; Returns: string
                           },
"was_on_trip":
{ Args: { "p_trip": string,"p_user": string }; Returns: boolean
                           }
          }
          Enums: {
            "account_status": "active"|"suspended","booking_status": "pending"|"accepted"|"rejected"|"withdrawn"|"cancelled"|"boarded"|"no_show"|"completed","cancel_reason": "min_riders_not_met"|"driver_cancelled"|"admin","community_kind": "building"|"complex"|"school"|"area","credit_reason": "no_show"|"late_cancel"|"driver_late_cancel"|"trip_completed"|"admin_adjust","group_buy_status": "open"|"full"|"purchased"|"closed"|"cancelled","meeting_point_kind": "lobby"|"gate"|"subway"|"plaza"|"parking"|"other","membership_source": "address"|"school_email"|"admin","points_reason": "full_car"|"admin_adjust","post_kind": "swap"|"giveaway"|"wanted"|"notice","post_status": "open"|"reserved"|"closed","push_platform": "web"|"ios"|"android","report_reason": "safety"|"harassment"|"discrimination"|"spam"|"fraud"|"no_show_dispute"|"inappropriate"|"other","report_status": "open"|"reviewing"|"resolved"|"dismissed","report_target": "user"|"trip"|"message"|"post"|"comment"|"group_buy"|"meeting_point"|"review","route_source": "google"|"mock","trip_mp_status": "active"|"proposed"|"rejected"|"removed","trip_status": "open"|"confirmed"|"in_progress"|"completed"|"cancelled","trip_visibility": "community"|"public","trunk_size": "small"|"medium"|"large","user_role": "driver"|"rider","verification_level": "phone"|"neighbor"|"full"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "account_status": ["active", "suspended"],"booking_status": ["pending", "accepted", "rejected", "withdrawn", "cancelled", "boarded", "no_show", "completed"],"cancel_reason": ["min_riders_not_met", "driver_cancelled", "admin"],"community_kind": ["building", "complex", "school", "area"],"credit_reason": ["no_show", "late_cancel", "driver_late_cancel", "trip_completed", "admin_adjust"],"group_buy_status": ["open", "full", "purchased", "closed", "cancelled"],"meeting_point_kind": ["lobby", "gate", "subway", "plaza", "parking", "other"],"membership_source": ["address", "school_email", "admin"],"points_reason": ["full_car", "admin_adjust"],"post_kind": ["swap", "giveaway", "wanted", "notice"],"post_status": ["open", "reserved", "closed"],"push_platform": ["web", "ios", "android"],"report_reason": ["safety", "harassment", "discrimination", "spam", "fraud", "no_show_dispute", "inappropriate", "other"],"report_status": ["open", "reviewing", "resolved", "dismissed"],"report_target": ["user", "trip", "message", "post", "comment", "group_buy", "meeting_point", "review"],"route_source": ["google", "mock"],"trip_mp_status": ["active", "proposed", "rejected", "removed"],"trip_status": ["open", "confirmed", "in_progress", "completed", "cancelled"],"trip_visibility": ["community", "public"],"trunk_size": ["small", "medium", "large"],"user_role": ["driver", "rider"],"verification_level": ["phone", "neighbor", "full"]
          }
        }
} as const
