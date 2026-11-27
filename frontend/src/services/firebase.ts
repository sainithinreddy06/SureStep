import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocsFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

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

// Reading the archive never creates records.
export async function getHistoricalIncidents(trailId?: string): Promise<HistoricalIncident[]> {
  const snap = await getDocsFromServer(collection(db, 'trail_incidents'));
  const incidents = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as HistoricalIncident));
  return trailId ? incidents.filter(incident => incident.trailId === trailId || !incident.trailId) : incidents;
}

// A report is acknowledged only after Firestore accepts the write.
export async function logHistoricalIncident(incident: Omit<HistoricalIncident, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'trail_incidents'), {
    ...incident,
    createdAt: Date.now(),
  });
  return docRef.id;
}
