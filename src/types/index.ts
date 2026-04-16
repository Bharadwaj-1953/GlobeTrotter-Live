export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  level: number
  countries_visited: number
  cities_visited: number
  miles_traveled: number
  created_at: string
}

export interface Destination {
  id: string
  name: string
  country: string
  city: string
  image_url: string
  description: string
  tags: string[]
  avg_cost_per_day: number
  safety_score: number
  created_at: string
}

export interface TransportOption {
  id: string
  from_city: string
  to_city: string
  mode: 'flight' | 'train' | 'bus' | 'car'
  operator: string
  departure_time: string
  arrival_time: string
  duration: string
  price: number
  stops: number
  label: string | null
  destination_id: string | null
  created_at: string
}

export interface Hotel {
  id: string
  destination_id: string
  name: string
  location: string
  image_url: string
  price_per_night: number
  rating: number
  review_count: number
  amenities: string[]
  created_at: string
}

export interface Activity {
  id: string
  destination_id: string
  name: string
  description: string
  category: string
  price: number
  duration: string
  rating: number
  image_url: string
  created_at: string
}

export interface Trip {
  id: string
  user_id: string
  title: string
  destination_id: string | null
  destination_name: string | null
  destination_country: string | null
  from_city: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  num_travelers: number
  transport_option_id: string | null
  hotel_id: string | null
  status: 'draft' | 'active' | 'completed'
  total_cost: number | null
  image_url: string | null
  notes: string | null
  created_at: string
  updated_at?: string
  destination?: Destination
  transport_option?: TransportOption
  hotel?: Hotel
  activities?: TripActivity[]
}

export interface TripActivity {
  id: string
  trip_id: string
  activity_id: string
  scheduled_date: string | null
  scheduled_time: string | null
  created_at: string
  activity?: Activity
}

export interface GroupTrip {
  id: string
  name: string
  created_by: string
  from_city: string | null
  start_date: string | null
  end_date: string | null
  transport_modes: string[]
  status: 'voting' | 'planning' | 'booked' | 'completed'
  winning_destination_id: string | null
  budget_per_person: number | null
  created_at: string
  destination?: Destination
  members?: GroupMember[]
  votes?: DestinationVote[]
}

export interface GroupMember {
  id: string
  group_trip_id: string
  user_id: string
  personal_budget: number | null
  role: 'organizer' | 'member'
  joined_at: string
  profile?: Profile
}

export interface DestinationVote {
  id: string
  group_trip_id: string
  user_id: string
  destination_id: string
  voted_at: string
  destination?: Destination
  profile?: Profile
}

export interface PlanOption {
  id: string
  group_trip_id: string
  destination_id: string
  transport_option_id: string | null
  hotel_id: string | null
  total_cost_per_person: number
  vote_count: number
  destination?: Destination
  transport_option?: TransportOption
  hotel?: Hotel
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export  type SortOption = 'cheapest' | 'fastest' | 'best_value'
export type TravelMode = 'flight' | 'train' | 'bus' | 'car'
