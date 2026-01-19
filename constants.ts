import { Unit, UnitCategory, User, UserRole } from './types';

export const DEMO_SCHOOL_ID = 'MBA1234';
export const DEMO_SCHOOL_NAME = 'SK Demo Bistari';

// CENTRALIZED STORAGE KEYS
// Ensuring these keys remain constant allows data to persist across code updates.
export const STORAGE_KEYS = {
  USERS: 'koku_users',
  STUDENTS: 'koku_students',
  UNITS: 'koku_units',
  ATTENDANCE: 'koku_attendance',
  REPORTS: 'koku_reports',
  ACHIEVEMENTS: 'koku_achievements',
  ANNOUNCEMENTS: 'koku_announcements'
};

// Global defaults (Optional: You can keep these empty if you want a blank slate for units too)
export const INITIAL_UNITS: Unit[] = [
  // Default units can be kept for easier onboarding, but they will be linked to DEMO_SCHOOL_ID
  // Real users will register their own units or import them.
  { id: 'u1', name: 'Pengakap', category: UnitCategory.BADAN_BERUNIFORM, schoolId: DEMO_SCHOOL_ID },
  { id: 'u2', name: 'PBSM', category: UnitCategory.BADAN_BERUNIFORM, schoolId: DEMO_SCHOOL_ID },
  { id: 'u3', name: 'TKRS', category: UnitCategory.BADAN_BERUNIFORM, schoolId: DEMO_SCHOOL_ID },
  { id: 'u4', name: 'Bahasa Melayu', category: UnitCategory.KELAB_PERSATUAN, schoolId: DEMO_SCHOOL_ID },
  { id: 'u5', name: 'STEM', category: UnitCategory.KELAB_PERSATUAN, schoolId: DEMO_SCHOOL_ID },
  { id: 'u6', name: 'Bola Sepak', category: UnitCategory.SUKAN_PERMAINAN, schoolId: DEMO_SCHOOL_ID },
  { id: 'u7', name: 'Bola Jaring', category: UnitCategory.SUKAN_PERMAINAN, schoolId: DEMO_SCHOOL_ID },
];

// REMOVED MOCK USERS - System now relies 100% on registered users in LocalStorage
export const MOCK_USERS: User[] = [];