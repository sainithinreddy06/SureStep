import { EmergencyContact, HazardReport, HikeSession } from '../types';

const SESSIONS_STORAGE_KEY = 'surestep_hike_sessions';
const CUSTOM_HAZARDS_KEY = 'surestep_custom_hazards';
const CONTACTS_KEY = 'surestep_emergency_contacts';
const SETTINGS_KEY = 'surestep_user_settings';

export interface UserSettings {
  units: 'metric' | 'imperial';
  outdoorHighContrast: boolean;
  weatherProvider: 'Open-Meteo' | 'Custom API';
  hapticFeedback: boolean;
  simulationSpeed: number; // 1x, 2x
}

const DEFAULT_SETTINGS: UserSettings = {
  units: 'metric',
  outdoorHighContrast: true,
  weatherProvider: 'Open-Meteo',
  hapticFeedback: true,
  simulationSpeed: 1
};

export const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact-1',
    name: 'National Park Dispatch (24/7)',
    phone: '360-569-6600',
    relationship: 'Search & Rescue Dispatch'
  },
  {
    id: 'contact-2',
    name: 'Primary Backcountry Contact',
    phone: '+1 (555) 234-8901',
    relationship: 'Emergency Contact'
  }
];

export function getSavedSessions(): HikeSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHikeSession(session: HikeSession): void {
  try {
    const existing = getSavedSessions();
    const updated = [session, ...existing.filter(s => s.id !== session.id)];
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export function deleteHikeSession(id: string): void {
  try {
    const existing = getSavedSessions();
    const updated = existing.filter(s => s.id !== id);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete session:', err);
  }
}

export function getCustomHazards(): HazardReport[] {
  try {
    const raw = localStorage.getItem(CUSTOM_HAZARDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addCustomHazard(hazard: HazardReport): void {
  try {
    const existing = getCustomHazards();
    const updated = [hazard, ...existing];
    localStorage.setItem(CUSTOM_HAZARDS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save hazard report:', err);
  }
}

export function getEmergencyContacts(): EmergencyContact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return DEFAULT_CONTACTS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONTACTS;
  }
}

export function saveEmergencyContacts(contacts: EmergencyContact[]): void {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('Failed to save emergency contacts:', err);
  }
}

export function getUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save user settings:', err);
  }
}
