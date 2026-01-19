import React, { useState } from 'react';
import { AttendanceRecord, Unit, Student, ActivityReport, UnitCategory, User, UserRole, Announcement } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CalendarCheck, CheckCircle2, Edit3, Bell, AlertTriangle, FileText, Trophy, AlertCircle, Plus, X, Save, School, Upload, ArrowRight } from 'lucide-react';

interface DashboardProps {
  attendance: AttendanceRecord[];
  units: Unit[];
  students: Student[];
  reports: ActivityReport[];
  currentUser: User;
  announcements?: Announcement[];
  onAddAnnouncement?: (notice: Announcement) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    attendance, 
    units, 
    students, 
    reports, 
    currentUser, 
    announcements = [],
    onAddAnnouncement 
}) => {
  
  const isGuru = currentUser.role === UserRole.GURU_PENASIHAT;
  const isSU = currentUser.role === UserRole.SU_KOKU;
  const isPK = currentUser.role === UserRole.PK_KOKU;

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [isNoticeImportant, setIsNoticeImportant] = useState(false);

  const handleSaveNotice = () => {
      if (!noticeContent.trim() || !noticeTitle.trim()) {
          alert("Sila masukkan tajuk dan kandungan notis.");
          return;
      }
      if (onAddAnnouncement) {
          const newNotice: Announcement = {
              id: `notis_${Date.now()}`,
              title: noticeTitle,
              content: noticeContent,
              date: new Date().toISOString().split('T')[0],
              authorId: currentUser.id,
              isImportant: isNoticeImportant,
              schoolId: currentUser.schoolId
          };
          onAddAnnouncement(newNotice);
          setIsNoticeModalOpen(false);
          setNoticeTitle('');
          setNoticeContent('');
          setIsNoticeImportant(false);
      }
  };

  // --- SCHOOL HEADER COMPONENT ---
  const SchoolHeader = () => (
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
              <School size={150} />
          </div>
          <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{currentUser.schoolName}</h1>
              <div className="flex items-center gap-3">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-mono text-sm md:text-base font-bold border border-white/10 shadow-sm">
                      KOD: {currentUser.schoolId}
                  </span>
                  <span className="text-blue-200 text-sm font-medium border-l border-blue-700 pl-3">
                      Sistem Pengurusan Kokurikulum
                  </span>
              </div>
          </div>
      </div>
  );

  // --- ZERO STATE (NEW SCHOOL) ---
  if (units.length === 0 && (isSU || isPK)) {
      return (
          <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
              <SchoolHeader />
              
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-300 shadow-sm flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                      <Upload size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Selamat Datang ke KokuLite!</h2>
                  <p className="text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
                      Sistem pangkalan data sekolah anda masih kosong. 
                      {isSU 
                        ? ' Sebagai Setiausaha, sila muat naik data kokurikulum atau tambah unit secara manual untuk memulakan sistem.'
                        : ' Sila hubungi Setiausaha Kokurikulum untuk memuat naik data unit, guru, dan murid ke dalam sistem.'}
                  </p>
                  
                  {isSU && (
                      <div className="flex gap-4">
                          <button 
                            // This relies on parent passing the upload trigger, but purely visual here for guidance
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 pointer-events-none"
                          >
                              <Upload size={20} />
                              Gunakan Menu "Import Data" di Sisi
                          </button>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- LOGIC FOR GURU PENASIHAT ---
  if (isGuru) {
      const myUnitId = currentUser.assignedUnitId;
      const myUnitName = units.find(u => u.id === myUnitId)?.name;
      
      // CHECK: Is the unit still linked to a temp ID? (Meaning SU hasn't uploaded data matching the name)
      const isDataMissing = !myUnitName && currentUser.assignedUnitId?.startsWith('temp_');
      
      const filteredStudents = students.filter(s => s.unitId === myUnitId);
      const filteredAttendance = attendance.filter(a => a.unitId === myUnitId);
      const filteredReports = reports.filter(r => r.unitId === myUnitId);
      const submittedReports = filteredReports.filter(r => r.status === 'SUBMITTED').length;
      const draftReports = filteredReports.filter(r => r.status === 'DRAFT').length;
      
      return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* School Header Banner */}
            <SchoolHeader />

            {/* Header Guru */}
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-800 flex flex-wrap items-center gap-3">
                    Dashboard Guru Penasihat
                    {myUnitName ? (
                        <span className="inline-flex items-center px-4 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200">
                            Unit: {myUnitName}
                        </span>
                    ) : (
                        currentUser.registeredUnitName && (
                            <span className="inline-flex items-center px-4 py-1 rounded-full text-sm bg-gray-100 text-gray-600 border border-gray-200">
                                {currentUser.registeredUnitName} (Menunggu Data)
                            </span>
                        )
                    )}
                </h2>
            </div>

            {/* EMPTY STATE WARNING */}
            {isDataMissing && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm mb-8 flex items-start gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-800">Data Unit Belum Dimuat Naik</h3>
                        <p className="text-red-700 mt-1 leading-relaxed">
                            Setiausaha Kokurikulum masih belum memuat naik data untuk unit <b>"{currentUser.registeredUnitName}"</b> ke dalam sistem.
                            <br/>
                            Sila hubungi beliau untuk memuat naik fail data kokurikulum supaya anda boleh mula merekod kehadiran dan laporan.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* KPI Cards Guru */}
                <div className={`col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 ${isDataMissing ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users size={24} /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keahlian</span>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold text-slate-900">{filteredStudents.length}</p>
                            <p className="text-sm text-slate-500 font-medium">Murid Berdaftar</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors"><CalendarCheck size={24} /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktiviti</span>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold text-slate-900">{filteredAttendance.length}</p>
                            <p className="text-sm text-slate-500 font-medium">Sesi Kehadiran</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-green-300 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors"><CheckCircle2 size={24} /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Laporan</span>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold text-slate-900">{submittedReports}</p>
                            <p className="text-sm text-slate-500 font-medium">Telah Dihantar</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-yellow-300 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition-colors"><Edit3 size={24} /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Draf</span>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold text-slate-900">{draftReports}</p>
                            <p className="text-sm text-slate-500 font-medium">Dalam Simpanan</p>
                        </div>
                    </div>
                </div>

                {/* Notices Board (Read Only for Guru) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Bell size={20} className="text-yellow-500 fill-yellow-500" />
                            Hebahan Terkini
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] pr-2 custom-scrollbar">
                        {announcements.length === 0 ? (
                            <div className="text-center text-slate-400 py-12 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">Tiada pengumuman semasa.</div>
                        ) : (
                            announcements.map(notice => (
                                <div key={notice.id} className={`p-5 rounded-xl border transition-all hover:translate-x-1 ${notice.isImportant ? 'bg-red-50 border-red-100 hover:shadow-md' : 'bg-slate-50 border-slate-100 hover:shadow-md'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-slate-500">{notice.date}</span>
                                        {notice.isImportant && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full shadow-sm">PENTING</span>}
                                    </div>
                                    {notice.title && <h4 className="font-bold text-slate-900 text-sm mb-1">{notice.title}</h4>}
                                    <p className="text-sm text-slate-800 leading-relaxed font-medium">{notice.content}</p>
                                    <p className="text-[10px] text-slate-400 mt-3 text-right font-bold tracking-wide uppercase">- Pentadbir</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- LOGIC FOR SU KOKU & ADMIN ---
  
  const totalUnits = units.length;
  const missingReports = attendance.length - reports.length;
  const registeredCount = students.filter(s => s.unitId).length;
  const unregisteredCount = students.length - registeredCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Modal Tambah Notis */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Tambah Pengumuman Baru</h3>
                    <button onClick={() => setIsNoticeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Tajuk</label>
                        <input
                            type="text"
                            value={noticeTitle} 
                            onChange={e => setNoticeTitle(e.target.value)} 
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" 
                            placeholder="Tajuk Ringkas..." 
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Kandungan Notis</label>
                        <textarea 
                            value={noticeContent} 
                            onChange={e => setNoticeContent(e.target.value)} 
                            rows={4} 
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50" 
                            placeholder="Tulis pengumuman penting di sini..." 
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                        <input 
                            type="checkbox" 
                            id="imp_dash" 
                            checked={isNoticeImportant} 
                            onChange={e => setIsNoticeImportant(e.target.checked)} 
                            className="w-5 h-5 text-blue-600 rounded cursor-pointer" 
                        />
                        <label htmlFor="imp_dash" className="text-sm text-red-700 font-bold cursor-pointer flex-1">
                            Tandakan sebagai PENTING
                        </label>
                        <AlertTriangle size={18} className="text-red-500" />
                    </div>
                        <button 
                            onClick={handleSaveNotice} 
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors mt-2 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                        >
                        <Save size={18} />
                        Siar Pengumuman
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* School Header Banner */}
      <SchoolHeader />

      <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {isSU ? 'Dashboard Setiausaha Kokurikulum' : 'Dashboard Pentadbir'}
            </h2>
            <p className="text-slate-500 text-sm">Ringkasan aktiviti, status data dan pengumuman semasa.</p>
        </div>
        {isSU && missingReports > 0 && (
             <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-5 py-3 rounded-xl border border-yellow-200 text-sm font-bold shadow-sm">
                 <AlertTriangle size={18} />
                 <span>{missingReports} Aktiviti belum dihantar laporan</span>
             </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Students */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Users size={28} /></div>
          <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Jumlah Murid</p><p className="text-3xl font-extrabold text-slate-900">{students.length}</p></div>
        </div>

        {/* Card 2: Registration Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className={`p-4 rounded-2xl ${unregisteredCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <AlertCircle size={28} />
          </div>
          <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Belum Daftar</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-3xl font-extrabold ${unregisteredCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{unregisteredCount}</p>
                <span className="text-xs text-slate-400 font-medium">/ {students.length}</span>
              </div>
          </div>
        </div>

        {/* Card 3: Reports */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><FileText size={28} /></div>
          <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Laporan Lengkap</p><p className="text-3xl font-extrabold text-slate-900">{reports.filter(r => r.status === 'SUBMITTED').length}</p></div>
        </div>

        {/* Card 4: Units */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Trophy size={28} /></div>
          <div><p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Unit Aktif</p><p className="text-3xl font-extrabold text-slate-900">{totalUnits}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Statistik Penglibatan Mengikut Unit</h3>
           <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={units.map(u => ({
                  name: u.name,
                  count: students.filter(s => s.unitId === u.id).length
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-45} textAnchor="end" height={70} stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Bil. Murid" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notices Board */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bell size={20} className="text-yellow-500 fill-yellow-500" />
                    Notis & Pengumuman
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px] pr-2 custom-scrollbar">
                {announcements.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">Tiada pengumuman semasa.</div>
                ) : (
                    announcements.map(notice => (
                        <div key={notice.id} className={`p-5 rounded-xl border transition-all hover:translate-x-1 ${notice.isImportant ? 'bg-red-50 border-red-100 hover:shadow-md' : 'bg-slate-50 border-slate-100 hover:shadow-md'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-500">{notice.date}</span>
                                {notice.isImportant && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full shadow-sm">PENTING</span>}
                            </div>
                            {notice.title && <h4 className="font-bold text-slate-900 text-sm mb-1">{notice.title}</h4>}
                            <p className="text-sm text-slate-800 leading-relaxed font-medium">{notice.content}</p>
                            <p className="text-[10px] text-slate-400 mt-3 text-right font-bold tracking-wide uppercase">- Pentadbir</p>
                        </div>
                    ))
                )}
            </div>
            
            {isSU && (
                <button 
                    onClick={() => setIsNoticeModalOpen(true)}
                    className="mt-6 w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-sm text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    Tambah Notis Baru
                </button>
            )}
        </div>
      </div>
    </div>
  );
};