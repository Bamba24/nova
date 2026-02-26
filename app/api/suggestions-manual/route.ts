import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { getCitiesFromPostalCode } from '@/lib/geocoding';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

interface SlotCoordinates {
  latitude: number;
  longitude: number;
}

interface ExistingSlot {
  day: string;
  hour: string;
  city: string;
  postalCode: string;
  coordinates: SlotCoordinates;
}

interface Suggestion {
  day: string;
  hour: string;
  score: number;
  averageDistance: number;
  nearestDistance: number;
  nearestLocation: string;
  nearestDuration: {
    hours: number;
    minutes: number;
    text: string;
  };
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  compatibility: number;
  distance: number;
  duration: string;
}

async function calculateOSRMDistance(coord1: SlotCoordinates, coord2: SlotCoordinates) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${coord1.longitude},${coord1.latitude};${coord2.longitude},${coord2.latitude}?overview=false`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distance = route.distance / 1000;
      const duration = route.duration;
      
      const hours = Math.floor(duration / 3600);
      const minutes = Math.round((duration % 3600) / 60);
      
      return {
        distance,
        duration: {
          hours,
          minutes,
          text: hours > 0 ? `${hours}h${minutes}min` : `${minutes}min`
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur OSRM:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const body = await request.json();
    const { postalCode, countryCode = 'FR', planningId, cityName, latitude, longitude } = body;

    if (!postalCode) {
      return NextResponse.json({ error: 'Code postal requis' }, { status: 400 });
    }

    if (!planningId) {
      return NextResponse.json({ error: 'Planning ID requis' }, { status: 400 });
    }

    // ✅ Si pas de ville spécifiée, retourner la liste des villes disponibles
    if (!cityName || !latitude || !longitude) {
      const cities = await getCitiesFromPostalCode(postalCode, 10);
      
      if (cities.length === 0) {
        return NextResponse.json({ error: 'Code postal invalide' }, { status: 400 });
      }

      // Si une seule ville, continuer automatiquement
      if (cities.length === 1) {
        // Utiliser la ville unique
        const singleCity = cities[0];
        return calculateSuggestions(
          user.userId,
          planningId,
          postalCode,
          singleCity.city,
          singleCity.latitude,
          singleCity.longitude
        );
      }

      // Plusieurs villes : retourner la liste pour sélection
      return NextResponse.json({
        requiresCitySelection: true,
        cities: cities.map(c => ({
          name: c.city,
          postalCode: c.postalCode,
          latitude: c.latitude,
          longitude: c.longitude,
        })),
      });
    }

    // ✅ Ville spécifiée : calculer les suggestions
    return calculateSuggestions(
      user.userId,
      planningId,
      postalCode,
      cityName,
      latitude,
      longitude
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors du calcul' },
      { status: 500 }
    );
  }
}

// ✅ Fonction séparée pour le calcul des suggestions
async function calculateSuggestions(
  userId: string,
  planningId: string,
  postalCode: string,
  cityName: string,
  latitude: number,
  longitude: number
) {

  const planning = await prisma.planning.findUnique({
    where: { id: planningId, userId },
    include: { slots: true }
  });

  if (!planning) {
    return NextResponse.json({ error: 'Planning introuvable' }, { status: 404 });
  }

  const hours = planning.hours as string[];
  
  const daySchedules: Record<string, {
    occupiedSlots: ExistingSlot[];
    freeHours: string[];
  }> = {};

  for (const day of DAYS) {
    daySchedules[day] = {
      occupiedSlots: [],
      freeHours: [...hours]
    };

    const occupiedSlots = planning.slots.filter(s => s.day === day);
    
    occupiedSlots.forEach(slot => {
      daySchedules[day].occupiedSlots.push({
        day: slot.day,
        hour: slot.hour,
        city: slot.city,
        postalCode: slot.postalCode,
        coordinates: {
          latitude: slot.latitude,
          longitude: slot.longitude
        }
      });

      const hourIndex = daySchedules[day].freeHours.indexOf(slot.hour);
      if (hourIndex > -1) {
        daySchedules[day].freeHours.splice(hourIndex, 1);
      }
    });
  }


  const allSuggestions: Suggestion[] = [];

  for (const day of DAYS) {
    const { occupiedSlots, freeHours } = daySchedules[day];

    if (freeHours.length === 0) continue;

    for (const freeHour of freeHours) {
      let score = 0;
      let totalDistance = 0;
      let countDistances = 0;
      let nearestDistance = Infinity;
      let nearestLocation = '';
      let nearestDuration = { hours: 0, minutes: 0, text: '0min' };

      for (const occupied of occupiedSlots) {
        const result = await calculateOSRMDistance(
          occupied.coordinates,
          { latitude, longitude }
        );

        if (result) {
          totalDistance += result.distance;
          countDistances++;

          if (result.distance < nearestDistance) {
            nearestDistance = result.distance;
            nearestLocation = `${occupied.postalCode} - ${occupied.city}`;
            nearestDuration = result.duration;
          }

          const hourDiff = Math.abs(hours.indexOf(freeHour) - hours.indexOf(occupied.hour));
          if (hourDiff === 1) score += 5;
          else if (hourDiff === 2) score += 3;
        }
      }

      if (countDistances > 0) {
        const averageDistance = totalDistance / countDistances;
        const finalScore = score - averageDistance;
        const compatibility = Math.round(Math.max(0, Math.min(100, (finalScore + 100) / 2)));

        allSuggestions.push({
          day,
          hour: freeHour,
          score: finalScore,
          averageDistance,
          nearestDistance,
          nearestLocation,
          nearestDuration,
          city: cityName,
          postalCode,
          latitude,
          longitude,
          compatibility,
          distance: Math.round(nearestDistance * 10) / 10,
          duration: nearestDuration.text,
        });
      }
    }
  }


  if (allSuggestions.length === 0) {
    return NextResponse.json({
      success: true,
      suggestions: [],
      message: 'Aucun créneau libre trouvé'
    });
  }

  allSuggestions.sort((a, b) => b.score - a.score);
  const bestSuggestions = allSuggestions.slice(0, 6);

  const enrichedSuggestions = bestSuggestions.map((s, index) => ({
    id: `suggestion-${Date.now()}-${index}`,
    title: `Suggestion ${index + 1}`,
    day: s.day,
    hour: s.hour,
    city: s.city,
    postalCode: s.postalCode,
    latitude: s.latitude,
    longitude: s.longitude,
    distance: s.distance,
    duration: s.duration,
    compatibility: s.compatibility,
    diffDistance: s.averageDistance,
    reasoning: `Point le plus proche : ${s.nearestLocation} à ${s.distance} km`
  }));


  return NextResponse.json({
    success: true,
    suggestions: enrichedSuggestions,
    reasoning: `Suggestions basées sur ${allSuggestions.length} créneaux libres analysés`
  });
}