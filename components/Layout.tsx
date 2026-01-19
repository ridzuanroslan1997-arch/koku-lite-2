import React from 'react';
import { UserRole, User } from '../types';
import { 
  LayoutDashboard, Users, FileText, Upload, LogOut, Menu, X, 
  UserCog, Image as ImageIcon, Briefcase, Trophy, Bell, ListChecks, CheckSquare, Printer, Medal, UserCheck 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  onOpenUpload: () => void;
  hasData?: boolean; // NEW: Controls menu visibility based on data existence
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  onLogout,
  currentView,
  onChangeView,
  onOpenUpload,
  hasData = false
}) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  // Define Menus based on Role
  let menuItems: { id: string, label: string, icon: any, action?: () => void }[] = [];

  if (currentUser.role === UserRole.GURU_PENASIHAT) {
    // Guru always sees their menus, logic in App.tsx handles empty units
    menuItems = [
      { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
      { id: 'guru_notices', label: 'Notifikasi / Hebahan', icon: Bell }, // NEW: View Only for Guru
      { id: 'attendance', label: 'Rekod Kehadiran', icon: Users },
      { id: 'students', label: 'Pengurusan Pelajar', icon: UserCog },
      { id: 'achievements', label: 'Rekod Pencapaian', icon: Trophy }, 
      { id: 'reports', label: 'Laporan Aktiviti', icon: FileText },
      { id: 'gallery', label: 'Galeri Aktiviti', icon: ImageIcon },
    ];
  } else if (currentUser.role === UserRole.SU_KOKU) {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'upload_trigger', label: 'Import Data', icon: Upload, action: onOpenUpload },
      { id: 'su_units', label: 'Maklumat Unit', icon: Briefcase }, // Always accessible to add units manually
    ];

    // Only show operational menus if data exists
    if (hasData) {
        menuItems.push(
            { id: 'registered_teachers', label: 'Guru Berdaftar', icon: UserCheck }, // NEW: View Registered Teachers
            { id: 'su_students', label: 'Senarai Murid', icon: Users },
            { id: 'su_attendance', label: 'Rekod Kehadiran', icon: ListChecks },
            { id: 'su_achievements', label: 'Rekod Pencapaian', icon: Trophy },
            { id: 'su_reports_summary', label: 'Laporan / Analisis', icon: FileText }, 
            { id: 'su_notices', label: 'Notis / Pengumuman', icon: Bell },
            // Removed Documents Menu as requested
        );
    }
  } else if (currentUser.role === UserRole.PK_KOKU) {
    menuItems = [
      { id: 'pk_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pk_notices', label: 'Notis / Pengumuman', icon: Bell }, // NEW: PK can manage
    ];

    // PK sees nothing else until data exists
    if (hasData) {
        menuItems.push(
            { id: 'registered_teachers', label: 'Guru Berdaftar', icon: UserCheck }, // NEW: View Registered Teachers
            { id: 'pk_units', label: 'Unit Kokurikulum', icon: Briefcase },
            // { id: 'pk_teachers', label: 'Guru Penasihat', icon: Users }, // OLD: Replaced by registered_teachers mostly
            { id: 'pk_activities', label: 'Aktiviti & Laporan', icon: FileText },
            { id: 'pk_validation', label: 'Semakan Laporan', icon: CheckSquare }, 
            { id: 'pk_print', label: 'Cetakan / Laporan', icon: Printer },
        );
    }
  } else {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    ];
  }

  const roleLabel = {
    [UserRole.PK_KOKU]: 'PK Kokurikulum',
    [UserRole.SU_KOKU]: 'Setiausaha Koku',
    [UserRole.GURU_PENASIHAT]: 'Guru Penasihat'
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
      if (item.action) {
          item.action();
      } else {
          onChangeView(item.id);
      }
      setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <LayoutDashboard size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">KokuLite</h1>
        </div>
        <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out shadow-2xl
        md:relative md:translate-x-0 md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
            {/* Logo Area */}
            <div className="mb-8 flex items-center gap-3 px-2">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/50">
                    <Medal size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">KokuLite</h1>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">Sistem Sekolah</p>
                </div>
            </div>

            {/* User Profile & School Info Card */}
            <div className="mb-8 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                            {currentUser.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-sm truncate text-slate-100">{currentUser.name}</p>
                            <p className="text-[10px] text-blue-300 font-bold uppercase mt-0.5">{roleLabel[currentUser.role]}</p>
                        </div>
                    </div>
                    {/* School Info */}
                    <div className="pt-3 border-t border-slate-700/50">
                        <p className="text-xs font-bold text-slate-300 truncate">{currentUser.schoolName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">KOD: {currentUser.schoolId}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
                {menuItems.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                        currentView === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 font-semibold translate-x-1' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                    }`}
                    >
                    <item.icon size={20} className={`transition-transform duration-200 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Logout & Footer */}
            <div className="pt-4 border-t border-slate-800 mt-4">
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-300 hover:bg-red-950/30 hover:text-red-200 rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Log Keluar</span>
                </button>
                <div className="mt-4 text-center text-[10px] text-slate-600">
                    &copy; 2026 KokuLite System
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-slate-50 p-4 md:p-8 scroll-smooth">
        {children}
      </main>
    </div>
  );
};