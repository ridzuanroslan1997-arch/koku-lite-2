
// Enums
export enum UserRole {
  PK_KOKU = 'PK_KOKU', // Penolong Kanan Kokurikulum
  SU_KOKU = 'SU_KOKU', // Setiausaha Kokurikulum
  GURU_PENASIHAT = 'GURU_PENASIHAT' // Guru Penasihat Unit
}

export enum UnitCategory {
  BADAN_BERUNIFORM = 'BADAN_BERUNIFORM',
  KELAB_PERSATUAN = 'KELAB_PERSATUAN',
  SUKAN_PERMAINAN = 'SUKAN_PERMAINAN'
}

// Interfaces
export interface User {
  id: string; // This is the Email
  name: string;
  role: UserRole;
  schoolId: string; // NEW: Link user to a specific school
  schoolName: string; // NEW: Display name
  assignedUnitId?: string; // Only for Guru Penasihat (The Real ID)
  registeredUnitName?: string; // NEW: The name entered during registration
  registeredUnitCategory?: UnitCategory; // NEW: Category selected during registration
  password?: string; // NEW: For authentication
  resetToken?: string; // NEW: For forgot password flow
}

export interface Unit {
  id: string;
  name: string;
  category: UnitCategory;
  schoolId?: string; // NEW: Units can be specific to a school (Optional for global defaults)
}

export interface Student {
  id: string; // MyKid or unique ID
  name: string;
  class: string;
  unitId: string; // The unit this student belongs to
  schoolId: string; // NEW: Partition data by school
  position?: string; // e.g., 'Pengerusi', 'Ahli Biasa'
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO date string
  activityName?: string; // Optional activity title
  unitId: string;
  schoolId: string; // NEW
  studentIdsPresent: string[]; // List of IDs present
  totalStudents: number;
}

export interface ActivityReport {
  id: string;
  attendanceId?: string; // Link to specific attendance record
  date: string;
  unitId: string;
  schoolId: string; // NEW
  teacherId: string;
  title: string;
  content: string; // The full report text
  generatedByAI: boolean;
  images?: string[]; // Array of base64 image strings
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'VERIFIED'; // Workflow status
  feedback?: string; // Comment from SU if needs correction
}

// Updated Achievement Interface
export interface Achievement {
  id: string;
  title: string;
  level: 'SEKOLAH' | 'DAERAH' | 'NEGERI' | 'KEBANGSAAN' | 'ANTARABANGSA';
  category: 'UNIT' | 'INDIVIDU'; // New field to distinguish type
  studentId?: string; // Optional, only if category is INDIVIDU
  studentName?: string; // Optional helper for display
  unitId: string;
  schoolId: string; 
  date: string;
  result: string; // e.g. "Johan", "Penyertaan", "Emas"
  status?: 'DRAFT' | 'SUBMITTED' | 'VERIFIED'; // NEW: Workflow status
}

export interface Document {
  id: string;
  title: string;
  type: 'SURAT' | 'MINIT' | 'LAIN-LAIN';
  schoolId: string; // NEW
  date: string;
  url?: string; // In real app this is a link
}

export interface Announcement {
  id: string;
  title: string; // ADDED TITLE
  content: string;
  date: string;
  authorId: string;
  schoolId: string; // NEW: Announcements are school-specific
  isImportant: boolean;
}

// App State Context Type
export interface AppState {
  currentUser: User | null;
  students: Student[];
  units: Unit[];
  attendance: AttendanceRecord[];
  reports: ActivityReport[];
  setCurrentUser: (user: User | null) => void;
  addStudents: (newStudents: Student[]) => void;
  addAttendance: (record: AttendanceRecord) => void;
  addReport: (report: ActivityReport) => void;
}