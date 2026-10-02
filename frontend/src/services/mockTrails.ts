import { TrailRoute } from '../types';

export const MOCK_TRAILS: TrailRoute[] = [
  {
    id: 'rainier-skyline',
    name: 'Skyline Trail Loop',
    region: 'Mount Rainier National Park, WA',
    difficulty: 'Hard',
    lengthKm: 8.8,
    elevationGainM: 520,
    baseElevationM: 1645,
    maxElevationM: 2145,
    coordinates: [
      [46.7865, -121.7358], // Paradise Trailhead
      [46.7892, -121.7371],
      [46.7925, -121.7389],
      [46.7961, -121.7412], // Glacier Vista
      [46.7998, -121.7405],
      [46.8042, -121.7364], // Panorama Point (high elevation / exposed)
      [46.8061, -121.7335],
      [46.8045, -121.7289],
      [46.8002, -121.7265], // High Skyline junction
      [46.7954, -121.7281], // Myrtle Falls approach
      [46.7910, -121.7312],
      [46.7865, -121.7358]
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 1645 },
      { distanceKm: 1.2, elevationM: 1730 },
      { distanceKm: 2.5, elevationM: 1880 },
      { distanceKm: 3.8, elevationM: 2020 },
      { distanceKm: 4.6, elevationM: 2145 },
      { distanceKm: 5.8, elevationM: 1980 },
      { distanceKm: 7.1, elevationM: 1810 },
      { distanceKm: 8.8, elevationM: 1645 }
    ],
    knownHazards: [
      {
        id: 'hz-1',
        title: 'Late-Season Snow Bridge & Crevasse Risk',
        type: 'ice',
        severity: 'high',
        description: 'Steep snowfield with undercut meltwater below Panorama Point. Microspikes & poles recommended.',
        coordinates: { latitude: 46.8038, longitude: -121.7370 },
        reportedAt: Date.now() - 3600000 * 4,
        verifiedCount: 14
      },
      {
        id: 'hz-2',
        title: 'Loose Talus & Scree on High Traverse',
        type: 'scree',
        severity: 'moderate',
        description: 'Shifting volcanic rocks on steep slope above Glacier Vista. Mind footing to prevent sliding.',
        coordinates: { latitude: 46.7975, longitude: -121.7410 },
        reportedAt: Date.now() - 3600000 * 12,
        verifiedCount: 8
      }
    ],
    safePoints: [
      {
        id: 'sp-1',
        name: 'Paradise Ranger Station & Wilderness Desk',
        type: 'ranger_station',
        coordinates: { latitude: 46.7862, longitude: -121.7355 },
        emergencyContact: '360-569-6600',
        amenities: ['Emergency First Aid', 'Radio Dispatch', 'Potable Water', 'AED'],
        operatingHours: '07:00 - 18:00'
      },
      {
        id: 'sp-2',
        name: 'Panorama Emergency Shelter / Toilet',
        type: 'shelter',
        coordinates: { latitude: 46.8040, longitude: -121.7360 },
        amenities: ['Windbreak Shelter', 'Emergency Radio Beacon', 'Solar SOS Box']
      }
    ]
  },
  {
    id: 'yosemite-mist',
    name: 'Mist Trail to Nevada Fall',
    region: 'Yosemite National Park, CA',
    difficulty: 'Hard',
    lengthKm: 8.7,
    elevationGainM: 610,
    baseElevationM: 1225,
    maxElevationM: 1835,
    coordinates: [
      [37.7328, -119.5579], // Happy Isles Trailhead
      [37.7301, -119.5492], // Vernal Fall Footbridge
      [37.7275, -119.5435], // Vernal Fall Top
      [37.7262, -119.5398], // Silver Apron
      [37.7248, -119.5332], // Nevada Fall Top
      [37.7278, -119.5365], // Clark Point junction
      [37.7315, -119.5458],
      [37.7328, -119.5579]
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 1225 },
      { distanceKm: 1.3, elevationM: 1360 },
      { distanceKm: 2.4, elevationM: 1530 },
      { distanceKm: 4.1, elevationM: 1835 },
      { distanceKm: 6.2, elevationM: 1520 },
      { distanceKm: 8.7, elevationM: 1225 }
    ],
    knownHazards: [
      {
        id: 'hz-y1',
        title: 'Extremely Slippery Wet Granite Steps',
        type: 'water',
        severity: 'high',
        description: 'Waterfall spray keeps granite steps slick with algae. Hold metal cables where provided; do not step over barriers.',
        coordinates: { latitude: 37.7285, longitude: -121.5450 },
        reportedAt: Date.now() - 3600000 * 2,
        verifiedCount: 22
      },
      {
        id: 'hz-y2',
        title: 'Active Rockfall Warning Zone',
        type: 'rockfall',
        severity: 'critical',
        description: 'Geologists report recent exfoliations near Clark Point after rain. Do not linger under cliff band.',
        coordinates: { latitude: 37.7270, longitude: -119.5375 },
        reportedAt: Date.now() - 3600000 * 18,
        verifiedCount: 31
      }
    ],
    safePoints: [
      {
        id: 'sp-y1',
        name: 'Happy Isles Emergency First Aid Station',
        type: 'medical_point',
        coordinates: { latitude: 37.7329, longitude: -119.5582 },
        emergencyContact: '209-379-1992',
        amenities: ['Emergency Phone', 'Paramedic Post', 'Defibrillator', 'Fresh Water Station'],
        operatingHours: '24/7 Phone'
      },
      {
        id: 'sp-y2',
        name: 'Vernal Fall Footbridge Rest Area',
        type: 'water_source',
        coordinates: { latitude: 37.7302, longitude: -119.5490 },
        amenities: ['Potable Water Tap', 'Emergency Call Box', 'Pit Toilets']
      }
    ]
  },
  {
    id: 'angels-landing',
    name: "Angels Landing Spine Trail",
    region: 'Zion National Park, UT',
    difficulty: 'Extreme',
    lengthKm: 7.7,
    elevationGainM: 453,
    baseElevationM: 1310,
    maxElevationM: 1763,
    coordinates: [
      [37.2592, -112.9515], // The Grotto
      [37.2625, -112.9492],
      [37.2654, -112.9480], // Walter's Wiggles
      [37.2681, -112.9472], // Scout Lookout
      [37.2694, -112.9478], // The Spine / Chain Section
      [37.2715, -112.9482], // Summit
      [37.2681, -112.9472],
      [37.2592, -112.9515]
    ],
    elevationProfile: [
      { distanceKm: 0.0, elevationM: 1310 },
      { distanceKm: 1.8, elevationM: 1470 },
      { distanceKm: 3.2, elevationM: 1650 },
      { distanceKm: 3.8, elevationM: 1763 },
      { distanceKm: 7.7, elevationM: 1310 }
    ],
    knownHazards: [
      {
        id: 'hz-a1',
        title: 'Severe Exposure & Sudden 1,400ft Drop-Offs',
        type: 'scree',
        severity: 'critical',
        description: 'Fin-ridge trail only a few feet wide with sheer drops on both sides. High wind gusts make this passage deadly. Maintain 3 points of contact.',
        coordinates: { latitude: 37.2698, longitude: -112.9479 },
        reportedAt: Date.now() - 3600000 * 1,
        verifiedCount: 45
      }
    ],
    safePoints: [
      {
        id: 'sp-a1',
        name: 'The Grotto Ranger & Shuttle Station',
        type: 'ranger_station',
        coordinates: { latitude: 37.2590, longitude: -112.9518 },
        emergencyContact: '435-772-3328',
        amenities: ['First Aid', 'Emergency Phone', 'Shuttle Evacuation', 'Water Refill']
      },
      {
        id: 'sp-a2',
        name: 'Scout Lookout Turnback Platform',
        type: 'shelter',
        coordinates: { latitude: 37.2680, longitude: -112.9470 },
        amenities: ['Rest Area', 'Turnback Decision Point', 'Wind Shield']
      }
    ]
  }
];
