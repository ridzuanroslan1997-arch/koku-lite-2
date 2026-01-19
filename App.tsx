import React, { useState, useEffect, useMemo } from 'react';
import { User, Student, AttendanceRecord, ActivityReport, UserRole, Announcement, Achievement, Unit } from './types';
import { INITIAL_UNITS, DEMO_SCHOOL_ID } from './constants';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Attendance } from './components/Attendance';
import { Reports } from './components/Reports';
import { UploadDataModal } from './components/UploadData';
import { Login } from './components/Login';
import { StudentManagement } from './components/StudentManagement';
import { Gallery } from './components/Gallery';
import { SUUnitList, SUStudentList, SUAchievements, SUDocuments, SUNotices, GuruNoticesList } from './components/SUDashboardModules';
import { SUReportReview } from './components/SUReportReview';
import { PKSummary, PKUnits, PKTeachers, PKActivities, PKValidation, PKPrint } from './components/PKDashboardModules';
import { Achievements } from './components/Achievements'; 
import { RegisteredTeachersList } from './components/RegisteredTeachersList'; // NEW IMPORT

// FIREBASE IMPORTS
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // DATA STATE (Now Live from Firebase)
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [reports, setReports] = useState<ActivityReport[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [currentView, setCurrentView] = useState('dashboard');
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [dbError, setDbError] = useState(false);

  // --- REAL-TIME DATABASE LISTENERS ---
  useEffect(() => {
      if (!db) {
          setDbError(true);
          return;
      }

      // 1. Users
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          setUsers(snapshot.docs.map(d => d.data() as User));
      });

      // 2. Students
      const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
          setStudents(snapshot.docs.map(d => d.data() as Student));
      });

      // 3. Units
      const unsubUnits = onSnapshot(collection(db, 'units'), (snapshot) => {
          const loadedUnits = snapshot.docs.map(d => d.data() as Unit);
          if (loadedUnits.length === 0) {
              // If DB empty, fallback to initial units (optional logic, usually better to save them to DB)
              setUnits([]); 
          } else {
              setUnits(loadedUnits);
          }
      });

      // 4. Attendance
      const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
          setAttendance(snapshot.docs.map(d => d.data() as AttendanceRecord));
      });

      // 5. Reports
      const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
          setReports(snapshot.docs.map(d => d.data() as ActivityReport));
      });

      // 6. Achievements
      const unsubAchievements = onSnapshot(collection(db, 'achievements'), (snapshot) => {
          setAchievements(snapshot.docs.map(d => d.data() as Achievement));
      });

      // 7. Announcements
      const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
          setAnnouncements(snapshot.docs.map(d => d.data() as Announcement));
      });

      return () => {
          unsubUsers(); unsubStudents(); unsubUnits(); unsubAttendance(); unsubReports(); unsubAchievements(); unsubAnnouncements();
      };
  }, []);

  // --- LOGIN HANDLER ---
  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
  };

  // --- AUTOMATIC LINKING LOGIC FOR GURU PENASIHAT (With DB Update) ---
  useEffect(() => {
      if (currentUser && currentUser.role === UserRole.GURU_PENASIHAT && currentUser.assignedUnitId?.startsWith('temp_') && currentUser.registeredUnitName) {
          const registeredName = currentUser.registeredUnitName.toLowerCase().trim();
          
          const matchingUnit = units.find(u => 
              u.schoolId === currentUser.schoolId && 
              u.name.toLowerCase().trim() === registeredName
          );

          if (matchingUnit) {
              const updatedUser = { ...currentUser, assignedUnitId: matchingUnit.id };
              // Update local state immediate
              setCurrentUser(updatedUser);
              // Update Database
              if (db) updateDoc(doc(db, 'users', updatedUser.id), { assignedUnitId: matchingUnit.id });
          }
      }
  }, [currentUser, units]);


  // --- SCHOOL FILTERING LOGIC ---
  const currentSchoolId = currentUser?.schoolId;

  // STRICT FILTERING: Only show data for the logged-in school
  const allUnits = useMemo(() => units.filter(u => u.schoolId === currentSchoolId), [units, currentSchoolId]);
  const schoolStudents = useMemo(() => students.filter(s => s.schoolId === currentSchoolId), [students, currentSchoolId]);
  const schoolUsers = useMemo(() => users.filter(u => u.schoolId === currentSchoolId), [users, currentSchoolId]);
  const schoolAttendance = useMemo(() => attendance.filter(a => a.schoolId === currentSchoolId), [attendance, currentSchoolId]);
  const schoolReports = useMemo(() => reports.filter(r => r.schoolId === currentSchoolId), [reports, currentSchoolId]);
  const schoolAnnouncements = useMemo(() => announcements.filter(a => a.schoolId === currentSchoolId), [announcements, currentSchoolId]);
  const schoolAchievements = useMemo(() => achievements.filter(a => a.schoolId === currentSchoolId), [achievements, currentSchoolId]);

  const hasData = allUnits.length > 0;

  // --- DATABASE WRITE HANDLERS ---
  // Using Firestore functions instead of localStorage

  const handleBatchImport = async (newStudents: Student[], newTeachers: User[], newUnits: Unit[]) => {
      if (!currentUser || !db) return;

      const batch = writeBatch(db);

      // Add Units (Check uniqueness handled in UI component logic usually, but here we just write)
      newUnits.forEach(u => {
          if (!units.some(ex => ex.id === u.id)) { // Double check
             batch.set(doc(db, 'units', u.id), u);
          }
      });

      // Add/Update Teachers
      newTeachers.forEach(t => {
          batch.set(doc(db, 'users', t.id), t); // Overwrites/Adds
      });

      // Add Students
      newStudents.forEach(s => {
          batch.set(doc(db, 'students', s.id), s);
      });

      try {
          await batch.commit();
          alert("Import Data Berjaya Disimpan ke Database!");
      } catch (e) {
          console.error("Batch import failed", e);
          alert("Gagal menyimpan data import.");
      }
  };

  const handleAddStudent = async (newStudent: Student) => {
    if(db) await setDoc(doc(db, 'students', newStudent.id), newStudent);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    if(db) await updateDoc(doc(db, 'students', updatedStudent.id), { ...updatedStudent });
  };

  const handleDeleteStudent = async (id: string) => {
    if(db) await deleteDoc(doc(db, 'students', id));
  };

  const handleSaveAttendance = async (record: AttendanceRecord) => {
    if (!currentUser || !db) return;
    const stampedRecord = { ...record, schoolId: currentUser.schoolId };
    await setDoc(doc(db, 'attendance', record.id), stampedRecord);
  };

  const handleAddReport = async (report: ActivityReport) => {
    if (!currentUser || !db) return;
    const stampedReport = { ...report, schoolId: currentUser.schoolId };
    await setDoc(doc(db, 'reports', report.id), stampedReport);
  };

  const handleUpdateReport = async (updatedReport: ActivityReport) => {
    if(db) await updateDoc(doc(db, 'reports', updatedReport.id), { ...updatedReport });
  };

  const handleAddAchievement = async (newAch: Achievement) => {
      if(db) await setDoc(doc(db, 'achievements', newAch.id), newAch);
  };

  const handleUpdateAchievement = async (updatedAch: Achievement) => {
      if(db) await updateDoc(doc(db, 'achievements', updatedAch.id), { ...updatedAch });
  };

  const handleDeleteAchievement = async (id: string) => {
      if(db) await deleteDoc(doc(db, 'achievements', id));
  };

  const handleAddAnnouncement = async (newNotice: Announcement) => {
    if (!currentUser || !db) return;
    const stampedNotice = { ...newNotice, schoolId: currentUser.schoolId };
    await setDoc(doc(db, 'announcements', newNotice.id), stampedNotice);
  };

  const handleUpdateAnnouncement = async (updatedNotice: Announcement) => {
    if(db) await updateDoc(doc(db, 'announcements', updatedNotice.id), { ...updatedNotice });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if(db) await deleteDoc(doc(db, 'announcements', id));
  };

  const handleAddTeacher = async (newTeacher: User) => {
      if(db) await setDoc(doc(db, 'users', newTeacher.id), newTeacher);
  };

  // NEW: Handle Delete Teacher
  const handleDeleteTeacher = async (id: string) => {
      if(db) await deleteDoc(doc(db, 'users', id));
  };

  if (dbError) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Ralat Konfigurasi Database</h1>
                  <p className="text-gray-600 mb-4">Sistem tidak dapat berhubung dengan Firebase.</p>
                  <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded text-left">
                      Sila buka fail <code>firebase.ts</code> dan masukkan maklumat <code>firebaseConfig</code> projek anda.
                  </p>
              </div>
          </div>
      )
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const getDashboardView = () => {
    if (currentUser.role === UserRole.PK_KOKU) return <PKSummary units={allUnits} users={schoolUsers} students={schoolStudents} reports={schoolReports} attendance={schoolAttendance} onChangeView={setCurrentView} />;
    return <Dashboard 
        attendance={schoolAttendance} 
        units={allUnits} 
        students={schoolStudents} 
        reports={schoolReports} 
        currentUser={currentUser}
        announcements={schoolAnnouncements} 
        onAddAnnouncement={handleAddAnnouncement}
    />;
  };

  const renderContent = () => {
    // SECURITY CHECK: If no units exist, restrict views unless it's Dashboard, Import, or Setup
    if (!hasData && currentView !== 'dashboard' && currentView !== 'upload_trigger' && currentView !== 'su_units' && currentUser.role !== UserRole.GURU_PENASIHAT && currentView !== 'pk_notices') {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                <div className="bg-slate-100 p-6 rounded-full mb-4">
                    <Dashboard attendance={[]} units={[]} students={[]} reports={[]} currentUser={currentUser} />
                </div>
            </div>
        )
    }

    switch (currentView) {
      case 'dashboard': return getDashboardView();
      case 'pk_dashboard': return <PKSummary units={allUnits} users={schoolUsers} students={schoolStudents} reports={schoolReports} attendance={schoolAttendance} onChangeView={setCurrentView} />;
      
      // === SHARED VIEW (NEW) ===
      case 'registered_teachers':
        if (currentUser.role === UserRole.GURU_PENASIHAT) return <div>Access Denied</div>;
        return <RegisteredTeachersList users={schoolUsers} units={allUnits} currentUser={currentUser} onDeleteTeacher={handleDeleteTeacher} />;

      // ... (Rest of switch cases remain the same, just passing the data props we already have)
      // === GURU PENASIHAT VIEWS ===
      case 'guru_notices':
        if (currentUser.role !== UserRole.GURU_PENASIHAT) return <div>Access Denied</div>;
        return <GuruNoticesList announcements={schoolAnnouncements} />;

      case 'attendance':
        if (currentUser.role !== UserRole.GURU_PENASIHAT) return <div>Access Denied</div>;
        const assignedUnit = allUnits.find(u => u.id === currentUser.assignedUnitId);
        if (!assignedUnit) return <div className="p-12 text-center text-gray-500">Unit tidak ditemui. Sila hubungi SU Kokurikulum.</div>;
        return <Attendance 
            students={schoolStudents} 
            unit={assignedUnit} 
            onSave={handleSaveAttendance} 
            onChangeView={setCurrentView} 
            existingRecords={schoolAttendance}
            schoolId={currentUser.schoolId}
        />;

      case 'students':
        if (currentUser.role !== UserRole.GURU_PENASIHAT) return <div>Access Denied</div>;
        const unitForStudents = allUnits.find(u => u.id === currentUser.assignedUnitId);
        if (!unitForStudents) return <div className="p-12 text-center text-gray-500">Unit tidak ditemui. Sila hubungi SU Kokurikulum.</div>;
        return <StudentManagement 
            students={schoolStudents} 
            unit={unitForStudents} 
            onAddStudent={handleAddStudent} 
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            schoolId={currentUser.schoolId}
        />;
      
      case 'achievements': 
        if (currentUser.role !== UserRole.GURU_PENASIHAT) return <div>Access Denied</div>;
        const unitForAch = allUnits.find(u => u.id === currentUser.assignedUnitId);
        if (!unitForAch) return <div>Tiada Unit Ditugaskan.</div>;
        const studentsInUnit = schoolStudents.filter(s => s.unitId === unitForAch.id);
        
        return <Achievements 
            achievements={schoolAchievements} 
            students={studentsInUnit} 
            unit={unitForAch}
            schoolId={currentUser.schoolId}
            onAddAchievement={handleAddAchievement}
            onUpdateAchievement={handleUpdateAchievement}
            onDeleteAchievement={handleDeleteAchievement}
        />;

      case 'reports':
        return (
          <Reports 
            attendance={schoolAttendance}
            reports={schoolReports} 
            units={allUnits} 
            currentUser={currentUser} 
            onAddReport={handleAddReport}
            onUpdateReport={handleUpdateReport} 
          />
        );

      case 'gallery':
         return (
             <Gallery 
                reports={schoolReports} 
                currentUser={currentUser}
             />
         );
      
      // === SU KOKU VIEWS ===
      case 'su_units':
         if (currentUser.role !== UserRole.SU_KOKU) return <div>Access Denied</div>;
         return <SUUnitList 
            units={allUnits} 
            students={schoolStudents} 
            attendance={schoolAttendance} 
            reports={schoolReports}
            users={schoolUsers}
            onAddTeacher={handleAddTeacher}
         />;

      case 'su_students':
         if (currentUser.role !== UserRole.SU_KOKU) return <div>Access Denied</div>;
         return <SUStudentList students={schoolStudents} units={allUnits} />;
      
      case 'su_attendance':
         return <Dashboard 
            attendance={schoolAttendance} 
            units={allUnits} 
            students={schoolStudents} 
            reports={schoolReports} 
            currentUser={currentUser}
            announcements={schoolAnnouncements}
            onAddAnnouncement={handleAddAnnouncement}
        />;
      
      case 'su_achievements':
         if (currentUser.role !== UserRole.SU_KOKU) return <div>Access Denied</div>;
         return <SUAchievements 
            units={allUnits} 
            schoolId={currentUser.schoolId} 
            achievements={schoolAchievements}
            onAddAchievement={handleAddAchievement}
            onUpdateAchievement={handleUpdateAchievement}
            onDeleteAchievement={handleDeleteAchievement}
         />;
      
      case 'su_reports_summary':
          if (currentUser.role !== UserRole.SU_KOKU) return <div>Access Denied</div>;
          return <SUReportReview 
            reports={schoolReports} 
            units={allUnits} 
            users={schoolUsers}
            onUpdateReport={handleUpdateReport} 
          />;

      case 'su_documents':
          if (currentUser.role !== UserRole.SU_KOKU) return <div>Access Denied</div>;
          return <SUDocuments schoolId={currentUser.schoolId} />;

      case 'su_notices':
          if (currentUser.role !== UserRole.SU_KOKU) return <div>Access Denied</div>;
          return <SUNotices 
            announcements={schoolAnnouncements} 
            onAdd={handleAddAnnouncement}
            onUpdate={handleUpdateAnnouncement}
            onDelete={handleDeleteAnnouncement}
            schoolId={currentUser.schoolId} 
          />;

      // === PK KOKU VIEWS ===
      case 'pk_units':
          if (currentUser.role !== UserRole.PK_KOKU) return <div>Access Denied</div>;
          return <PKUnits units={allUnits} students={schoolStudents} />;
      
      case 'pk_teachers': // Kept for backward compatibility if needed, but menu points to registered_teachers now mostly
          if (currentUser.role !== UserRole.PK_KOKU) return <div>Access Denied</div>;
          return <PKTeachers users={schoolUsers} units={allUnits} />;

      case 'pk_activities':
          if (currentUser.role !== UserRole.PK_KOKU) return <div>Access Denied</div>;
          return <PKActivities reports={schoolReports} units={allUnits} />;

      case 'pk_validation':
          if (currentUser.role !== UserRole.PK_KOKU) return <div>Access Denied</div>;
          return <PKValidation 
            units={allUnits} 
            users={schoolUsers} 
            students={schoolStudents} 
            reports={schoolReports} 
            attendance={schoolAttendance} 
            onUpdateReport={handleUpdateReport}
          />;

      case 'pk_print':
          if (currentUser.role !== UserRole.PK_KOKU) return <div>Access Denied</div>;
          return <PKPrint 
            units={allUnits} 
            users={schoolUsers} 
            students={schoolStudents} 
            reports={schoolReports} 
            attendance={schoolAttendance} 
            achievements={schoolAchievements} 
          />;
      
      case 'pk_notices':
          if (currentUser.role !== UserRole.PK_KOKU) return <div>Access Denied</div>;
          return <SUNotices 
            announcements={schoolAnnouncements} 
            onAdd={handleAddAnnouncement}
            onUpdate={handleUpdateAnnouncement}
            onDelete={handleDeleteAnnouncement}
            schoolId={currentUser.schoolId} 
          />;
        
      default:
        return getDashboardView();
    }
  };

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={() => setCurrentUser(null)}
      currentView={currentView}
      onChangeView={setCurrentView}
      onOpenUpload={() => setUploadModalOpen(true)}
      hasData={hasData} 
    >
      {renderContent()}
      
      <UploadDataModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        units={allUnits} 
        onBatchImport={handleBatchImport}
        schoolId={currentUser.schoolId}
        schoolName={currentUser.schoolName}
      />
    </Layout>
  );
};

export default App;