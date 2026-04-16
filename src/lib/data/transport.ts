import type { TransportOption } from '@/types'

export const TRANSPORT_OPTIONS: TransportOption[] = [
  // Milwaukee → Chicago
  {
    id: 'tr-mke-chi-amtrak',
    from_city: 'Milwaukee',
    to_city: 'Chicago',
    mode: 'train',
    operator: 'Amtrak',
    departure_time: '08:05',
    arrival_time: '09:34',
    duration: '1h 29m',
    price: 25,
    stops: 0,
    label: 'Budget Pick',
    destination_id: 'dest-chicago',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tr-mke-chi-united',
    from_city: 'Milwaukee',
    to_city: 'Chicago',
    mode: 'flight',
    operator: 'United',
    departure_time: '10:45',
    arrival_time: '11:40',
    duration: '0h 55m',
    price: 142,
    stops: 0,
    label: 'Standard',
    destination_id: 'dest-chicago',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tr-mke-chi-megabus',
    from_city: 'Milwaukee',
    to_city: 'Chicago',
    mode: 'bus',
    operator: 'Megabus',
    departure_time: '13:15',
    arrival_time: '15:25',
    duration: '2h 10m',
    price: 18,
    stops: 1,
    label: 'Fast Selling',
    destination_id: 'dest-chicago',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tr-mke-chi-greyhound',
    from_city: 'Milwaukee',
    to_city: 'Chicago',
    mode: 'bus',
    operator: 'Greyhound',
    departure_time: '07:00',
    arrival_time: '09:30',
    duration: '2h 30m',
    price: 15,
    stops: 1,
    label: null,
    destination_id: 'dest-chicago',
    created_at: new Date().toISOString(),
  },
  // New York → Paris
  {
    id: 'tr-nyc-par-airfrance',
    from_city: 'New York',
    to_city: 'Paris',
    mode: 'flight',
    operator: 'Air France',
    departure_time: '10:45',
    arrival_time: '23:30',
    duration: '7h 45m',
    price: 520,
    stops: 0,
    label: 'Best Value',
    destination_id: 'dest-paris',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tr-nyc-par-delta',
    from_city: 'New York',
    to_city: 'Paris',
    mode: 'flight',
    operator: 'Delta',
    departure_time: '18:30',
    arrival_time: '08:45',
    duration: '7h 15m',
    price: 680,
    stops: 0,
    label: 'Fast Selling',
    destination_id: 'dest-paris',
    created_at: new Date().toISOString(),
  },
  // Los Angeles → Tokyo
  {
    id: 'tr-lax-tyo-aa',
    from_city: 'Los Angeles',
    to_city: 'Tokyo',
    mode: 'flight',
    operator: 'American Airlines',
    departure_time: '10:30',
    arrival_time: '14:15',
    duration: '11h 45m',
    price: 720,
    stops: 0,
    label: 'Budget Pick',
    destination_id: 'dest-tokyo',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tr-lax-tyo-ana',
    from_city: 'Los Angeles',
    to_city: 'Tokyo',
    mode: 'flight',
    operator: 'ANA',
    departure_time: '23:55',
    arrival_time: '06:00',
    duration: '11h 05m',
    price: 890,
    stops: 0,
    label: 'Fastest',
    destination_id: 'dest-tokyo',
    created_at: new Date().toISOString(),
  },
]

export function getTransportByDestination(destinationId: string): TransportOption[] {
  return TRANSPORT_OPTIONS.filter((t) => t.destination_id === destinationId)
}

export function getTransportById(id: string): TransportOption | undefined {
  return TRANSPORT_OPTIONS.find((t) => t.id === id)
}

export function searchTransport(from: string, to: string): TransportOption[] {
  const fromLower = from.toLowerCase()
  const toLower = to.toLowerCase()
  return TRANSPORT_OPTIONS.filter(
    (t) =>
      t.from_city.toLowerCase().includes(fromLower) ||
      t.to_city.toLowerCase().includes(toLower) ||
      t.destination_id === toLower
  )
}
