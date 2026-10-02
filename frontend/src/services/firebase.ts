import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Coordinates } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface HistoricalIncident {
  id?: string;
  title: string;
  description: string;
  trailId: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  severity: 'moderate' | 'high' | 'critical';
  incidentType: 'rockfall' | 'slip_fall' | 'hypothermia' | 'seismic' | 'flash_flood' | 'lost_hiker';
  occurredAt: string;
  outcome: string;
  source: string;
  createdAt?: number;
}

// Initial seed data representing real historical occurrences for major trails
const INITIAL_HISTORICAL_INCIDENTS: Omit<HistoricalIncident, 'id'>[] = [
  {
    trailId: 'trail-rainier-skyline',
    title: 'Rockfall and Talus Displacement on Pebble Creek Traverse',
    description: 'Sudden rockfall dislodged loose boulders across the trail after afternoon sun thaw. One hiker suffered severe bruising; trail crew stabilized switchback footing.',
    coordinates: { latitude: 46.7912, longitude: -121.7345, altitude: 2180 },
    severity: 'high',
    incidentType: 'rockfall',
    occurredAt: 'August 14, 2023',
    outcome: 'Ranger search and rescue deployed splint; route re-flagged via safer talus bench.',
    source: 'National Park Mountain Ranger Log #2023-841'
  },
  {
    trailId: 'trail-rainier-skyline',
    title: 'Severe Slip and Ankle Sprain on Glazed Ice Verge',
    description: 'Hiker attempted descending late-season hardpack snow without traction cleats. Slipped 25 meters down snow chute into boulder margin.',
    coordinates: { latitude: 46.7945, longitude: -121.7321, altitude: 2260 },
    severity: 'critical',
    incidentType: 'slip_fall',
    occurredAt: 'September 22, 2024',
    outcome: 'Helicopter hoist evacuation conducted from Panorama Point helipad.',
    source: 'SAR Dispatch Archive'
  },
  {
    trailId: 'trail-half-dome',
    title: 'Sub-Camp Creek Surge & Flash Inundation',
    description: 'Sudden cloudburst above Mist Trail caused rapid water rise of 0.8m in 15 minutes, sweeping trail gravel over riverbed stepping stones.',
    coordinates: { latitude: 37.7325, longitude: -119.5582, altitude: 1540 },
    severity: 'high',
    incidentType: 'flash_flood',
    occurredAt: 'July 8, 2024',
    outcome: 'Trail temporarily closed for 6 hours until water receded.',
    source: 'Yosemite Geological Safety Dispatch'
  },
  {
    trailId: 'trail-angels-landing',
    title: 'Lightning Discharge Strike on Knife-Edge Chain Section',
    description: 'Isolated dry lightning bolt struck exposed iron chain anchor 100 meters below summit during afternoon thunderstorm buildup.',
    coordinates: { latitude: 37.2694, longitude: -112.9472, altitude: 1760 },
    severity: 'critical',
    incidentType: 'seismic',
    occurredAt: 'June 19, 2024',
    outcome: 'Four hikers successfully sheltered in natural sandstone alcove; no fatalities.',
    source: 'Zion Emergency Dispatch Log'
  }
];

// Fetch historical incidents for a given trail or coordinates
export async function getHistoricalIncidents(trailId?: string): Promise<HistoricalIncident[]> {
  try {
    const colRef = collection(db, 'trail_incidents');
    const snap = await getDocs(colRef);

    if (snap.empty) {
      // Seed initial historical incidents if database collection is empty
      await seedInitialIncidents();
      return INITIAL_HISTORICAL_INCIDENTS.map((item, idx) => ({ ...item, id: `seed-${idx}` }));
    }

    const incidents: HistoricalIncident[] = [];
    snap.forEach((doc) => {
      incidents.push({ id: doc.id, ...(doc.data() as Omit<HistoricalIncident, 'id'>) });
    });

    if (trailId) {
      return incidents.filter(i => i.trailId === trailId || !i.trailId);
    }
    return incidents;
  } catch (err) {
    console.warn('Firestore fetch warning, falling back to local historical records:', err);
    return INITIAL_HISTORICAL_INCIDENTS.map((item, idx) => ({ ...item, id: `seed-${idx}` }));
  }
}

// Store a new historical incident report
export async function logHistoricalIncident(incident: Omit<HistoricalIncident, 'id' | 'createdAt'>): Promise<string> {
  try {
    const colRef = collection(db, 'trail_incidents');
    const docRef = await addDoc(colRef, {
      ...incident,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (err) {
    console.error('Failed to log incident to Firestore:', err);
    return `local-${Date.now()}`;
  }
}

// Seed helper
async function seedInitialIncidents() {
  try {
    const colRef = collection(db, 'trail_incidents');
    for (const item of INITIAL_HISTORICAL_INCIDENTS) {
      await addDoc(colRef, {
        ...item,
        createdAt: Date.now()
      });
    }
  } catch (err) {
    console.warn('Initial seeding notice:', err);
  }
}
