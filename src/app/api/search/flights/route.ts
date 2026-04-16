import { NextRequest, NextResponse } from 'next/server'

// Realistic flight price engine based on distance + route
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const AIRLINES = [
  { code: 'AA', name: 'American Airlines', logo: '🇺🇸' },
  { code: 'UA', name: 'United Airlines', logo: '🇺🇸' },
  { code: 'DL', name: 'Delta Air Lines', logo: '🇺🇸' },
  { code: 'BA', name: 'British Airways', logo: '🇬🇧' },
  { code: 'LH', name: 'Lufthansa', logo: '🇩🇪' },
  { code: 'EK', name: 'Emirates', logo: '🇦🇪' },
  { code: 'SQ', name: 'Singapore Airlines', logo: '🇸🇬' },
  { code: 'QR', name: 'Qatar Airways', logo: '🇶🇦' },
  { code: 'AF', name: 'Air France', logo: '🇫🇷' },
  { code: 'NH', name: 'ANA', logo: '🇯🇵' },
]

function seedRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function formatTime(hour: number, min: number) {
  const h = hour % 24
  const period = h < 12 ? 'AM' : 'PM'
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${displayH}:${min.toString().padStart(2,'0')} ${period}`
}

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from') || ''
  const to = req.nextUrl.searchParams.get('to') || ''
  const date = req.nextUrl.searchParams.get('date') || ''
  const travelers = parseInt(req.nextUrl.searchParams.get('travelers') || '1')

  const fromLat = parseFloat(req.nextUrl.searchParams.get('fromLat') || '40.7128')
  const fromLon = parseFloat(req.nextUrl.searchParams.get('fromLon') || '-74.0060')
  const toLat = parseFloat(req.nextUrl.searchParams.get('toLat') || '35.6762')
  const toLon = parseFloat(req.nextUrl.searchParams.get('toLon') || '139.6503')

  const distanceKm = haversineKm(fromLat, fromLon, toLat, toLon)
  const durationHours = distanceKm / 800 + 0.5 // ~800 km/h cruise + 30 min ground
  const durationMins = Math.round(durationHours * 60)

  // Base price: $0.09-0.15 per km, with minimums
  const basePrice = Math.max(150, Math.round(distanceKm * (0.09 + seedRandom(fromLat * toLat) * 0.06)))
  
  const seed = (from + to + date).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  
  const flights = []
  const usedAirlines = new Set()
  
  for (let i = 0; i < 5; i++) {
    const airlineIdx = Math.floor(seedRandom(seed + i * 7) * AIRLINES.length)
    const airline = AIRLINES[airlineIdx]
    if (usedAirlines.has(airline.code)) continue
    usedAirlines.add(airline.code)

    const priceVariance = 0.8 + seedRandom(seed + i * 13) * 0.6
    const price = Math.round(basePrice * priceVariance / 10) * 10
    
    const depHour = 6 + Math.floor(seedRandom(seed + i * 3) * 15)
    const depMin = [0, 15, 30, 45][Math.floor(seedRandom(seed + i * 5) * 4)]
    const arrTotalMins = depHour * 60 + depMin + durationMins
    const arrHour = Math.floor(arrTotalMins / 60)
    const arrMin = arrTotalMins % 60

    const stops = distanceKm < 1000 ? 0 : distanceKm < 4000 ? Math.floor(seedRandom(seed + i) * 2) : Math.floor(1 + seedRandom(seed + i) * 1.5)
    const durationStr = `${Math.floor(durationMins/60)}h ${durationMins%60}m`
    const flightNum = `${airline.code}${100 + Math.floor(seedRandom(seed + i * 11) * 900)}`

    flights.push({
      id: `flight-${airline.code}-${i}`,
      airline: airline.name,
      airlineCode: airline.code,
      airlineLogo: airline.logo,
      flightNumber: flightNum,
      from,
      to,
      departureTime: formatTime(depHour, depMin),
      arrivalTime: formatTime(arrHour, arrMin),
      duration: durationStr,
      durationMins,
      stops,
      stopsLabel: stops === 0 ? 'Nonstop' : stops === 1 ? '1 stop' : `${stops} stops`,
      price,
      totalPrice: price * travelers,
      distanceKm: Math.round(distanceKm),
      class: 'Economy',
      seatsLeft: 2 + Math.floor(seedRandom(seed + i * 17) * 8),
    })
  }

  flights.sort((a, b) => a.price - b.price)
  return NextResponse.json({ flights, distanceKm: Math.round(distanceKm) })
}
