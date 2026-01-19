import React from 'react';
import { UserRole, User } from '../types';
import { 
  LayoutDashboard, Users, FileText, Upload, LogOut, Menu, X, 
  UserCog, Image as ImageIcon, Briefcase, Trophy, FolderOpen, Bell, ListChecks, CheckSquare, Printer 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  onOpenUpload: () => void; // Prop to trigger upload modal
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  onLogout,
  currentView,
  onChangeView,
  onOpenUpload
}) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  // Define Menus based on Role
  let menuItems: { id: string, label: string, icon: any, action?: () => void }[] = [];

  if (currentUser.role === UserRole.GURU_PENASIHAT) {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
      { id: 'attendance', label: 'Rekod Kehadiran', icon: Users },
      { id: 'students', label: 'Pengurusan Pelajar', icon: UserCog },
      { id: 'reports', label: 'Laporan Aktiviti', icon: FileText },
      { id: 'gallery', label: 'Galeri Aktiviti', icon: ImageIcon },
    ];
  } else if (currentUser.role === UserRole.SU_KOKU) {
    // SU_KOKU Menu - Consolidated "Semakan Laporan" features into "Laporan / Analisis"
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'su_units', label: 'Maklumat Unit', icon: Briefcase },
      { id: 'su_students', label: 'Senarai Murid', icon: Users },
      { id: 'su_attendance', label: 'Rekod Kehadiran', icon: ListChecks },
      { id: 'su_achievements', label: 'Rekod Pencapaian', icon: Trophy },
      { id: 'su_reports_summary', label: 'Laporan / Analisis', icon: FileText }, // Points to SUReportReview
      { id: 'su_notices', label: 'Notis / Pengumuman', icon: Bell },
      // Import Data button triggers the modal action
      { id: 'upload_trigger', label: 'Import Data', icon: Upload, action: onOpenUpload },
    ];
  } else if (currentUser.role === UserRole.PK_KOKU) {
    // PK Koku Menu - PALING SIMPLE
    menuItems = [
      { id: 'pk_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pk_units', label: 'Unit Kokurikulum', icon: Briefcase },
      { id: 'pk_teachers', label: 'Guru Penasihat', icon: Users },
      { id: 'pk_activities', label: 'Aktiviti & Laporan', icon: FileText },
      { id: 'pk_validation', label: 'Pengesahan', icon: CheckSquare },
      { id: 'pk_print', label: 'Cetakan / Laporan', icon: Printer },
    ];
  } else {
    // Fallback
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
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-800 text-white p-4 flex justify-between items-center">
        <h1 className="font-bold text-lg">KokuLite</h1>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-1">KokuLite</h1>
          <p className="text-blue-300 text-xs">Sistem Rekod Kokurikulum Sekolah Rendah</p>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-blue-800 rounded-lg p-3">
            <p className="font-medium text-sm truncate">{currentUser.name}</p>
            <p className="text-xs text-blue-300 mt-1 uppercase">{roleLabel[currentUser.role]}</p>
          </div>
        </div>

        <nav className="px-4 space-y-1 mb-20">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === item.id 
                  ? 'bg-blue-700 text-white shadow-md' 
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-blue-900/50 backdrop-blur-sm">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-200 hover:bg-blue-950 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Log Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-gray-50 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};