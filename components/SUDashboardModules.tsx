import React, { useState, useMemo } from 'react';
import { Unit, Student, Announcement, Document, Achievement, UnitCategory, AttendanceRecord, ActivityReport, User, UserRole } from '../types';
import { Briefcase, Trophy, FolderOpen, Bell, Search, User as UserIcon, Download, Plus, Trash2, Filter, Users, CheckCircle2, XCircle, AlertCircle, X, Save, FileText, Upload, Calendar, ChevronRight, PieChart, Edit, AlertTriangle, UserPlus, Medal, Award, Eye, File, FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- SUB-COMPONENT: MAKLUMAT UNIT ---
interface SUUnitListProps {
    units: Unit[];
    students: Student[];
    attendance: AttendanceRecord[];
    reports: ActivityReport[];
    users: User[]; // Needed to show teachers
    onAddTeacher: (teacher: User) => void; // Function to add a teacher
}

export const SUUnitList: React.FC<SUUnitListProps> = ({ units, students, attendance, reports, users, onAddTeacher }) => {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [editMeetingDay, setEditMeetingDay] = useState('Rabu');
  const [isSaved, setIsSaved] = useState(false);
  
  // State for Adding Teacher
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');

  // Logic to open modal and reset temp state
  const handleUnitClick = (unit: Unit) => {
      setSelectedUnit(unit);
      setIsSaved(false);
      setEditMeetingDay('Rabu');
      setIsAddingTeacher(false);
      setNewTeacherName('');
      setNewTeacherEmail('');
  };

  const handleSaveChanges = () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      // In a real app, you would dispatch an updateUnit action here
  };

  const handleRegisterTeacher = () => {
      if (!newTeacherName || !selectedUnit) {
          alert("Sila masukkan nama guru.");
          return;
      }

      const newTeacher: User = {
          id: newTeacherEmail || `tchr_${Date.now()}`,
          name: newTeacherName,
          role: UserRole.GURU_PENASIHAT,
          schoolId: selectedUnit.schoolId || '',
          schoolName: 'Sekolah', // Should be dynamic in real app
          assignedUnitId: selectedUnit.id,
          registeredUnitName: selectedUnit.name
      };

      onAddTeacher(newTeacher);
      setIsAddingTeacher(false);
      setNewTeacherName('');
      setNewTeacherEmail('');
      alert(`Cikgu ${newTeacherName} telah didaftarkan ke unit ${selectedUnit.name}.`);
  };

  // Get teachers for the selected unit
  const unitTeachers = useMemo(() => {
      if (!selectedUnit) return [];
      return users.filter(u => u.assignedUnitId === selectedUnit.id && u.role === UserRole.GURU_PENASIHAT);
  }, [users, selectedUnit]);

  // Calculate statistics for the selected unit
  const stats = useMemo(() => {
      if (!selectedUnit) return { members: 0, sessions: 0, reports: 0, percentage: 0 };
      
      const members = students.filter(s => s.unitId === selectedUnit.id).length;
      const unitAttendance = attendance.filter(a => a.unitId === selectedUnit.id);
      const unitReports = reports.filter(r => r.unitId === selectedUnit.id && r.status === 'SUBMITTED');
      
      // Calculate avg attendance percentage
      let totalPercentage = 0;
      unitAttendance.forEach(att => {
          totalPercentage += (att.studentIdsPresent.length / (att.totalStudents || 1)) * 100;
      });
      const avgPercentage = unitAttendance.length > 0 ? Math.round(totalPercentage / unitAttendance.length) : 0;

      return {
          members,
          sessions: unitAttendance.length,
          reports: unitReports.length,
          percentage: avgPercentage
      };
  }, [selectedUnit, students, attendance, reports]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* --- UNIT DETAILS POPUP MODAL --- */}
      {selectedUnit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
              <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className={`p-6 text-white flex justify-between items-start shrink-0 ${selectedUnit.category === UnitCategory.BADAN_BERUNIFORM ? 'bg-blue-800' : selectedUnit.category === UnitCategory.SUKAN_PERMAINAN ? 'bg-orange-600' : 'bg-purple-700'}`}>
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{selectedUnit.category.replace('_', ' ')}</span>
                          </div>
                          <h2 className="text-2xl font-bold">{selectedUnit.name}</h2>
                          <p className="text-white/80 text-sm mt-1">Paparan terperinci dan pengurusan unit.</p>
                      </div>
                      <button onClick={() => setSelectedUnit(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                              <Users size={20} className="mx-auto text-blue-500 mb-2" />
                              <div className="text-xl font-bold text-gray-800">{stats.members}</div>
                              <div className="text-xs text-gray-500 uppercase font-bold">Keahlian</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                              <Calendar size={20} className="mx-auto text-purple-500 mb-2" />
                              <div className="text-xl font-bold text-gray-800">{stats.sessions}</div>
                              <div className="text-xs text-gray-500 uppercase font-bold">Aktiviti</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                              <FileText size={20} className="mx-auto text-green-500 mb-2" />
                              <div className="text-xl font-bold text-gray-800">{stats.reports}</div>
                              <div className="text-xs text-gray-500 uppercase font-bold">Laporan</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                              <PieChart size={20} className="mx-auto text-orange-500 mb-2" />
                              <div className="text-xl font-bold text-gray-800">{stats.percentage}%</div>
                              <div className="text-xs text-gray-500 uppercase font-bold">Purata Hadir</div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column: Settings */}
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                  <Briefcase size={18} className="text-gray-500"/>
                                  Tetapan Unit
                              </h3>
                              
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hari Perjumpaan</label>
                                      <select 
                                          value={editMeetingDay} 
                                          onChange={(e) => setEditMeetingDay(e.target.value)}
                                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                                      >
                                          <option value="Isnin">Isnin</option>
                                          <option value="Selasa">Selasa</option>
                                          <option value="Rabu">Rabu</option>
                                          <option value="Khamis">Khamis</option>
                                          <option value="Jumaat">Jumaat</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Masa Perjumpaan</label>
                                      <input 
                                          type="text" 
                                          defaultValue="2:00 PM - 4:00 PM"
                                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                                      />
                                  </div>
                                  <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catatan</label>
                                       <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none bg-gray-50" placeholder="Nota untuk rujukan..."></textarea>
                                  </div>
                              </div>
                          </div>

                          {/* Right Column: Teachers */}
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                      <Users size={18} className="text-gray-500"/>
                                      Guru Penasihat
                                  </h3>
                                  {!isAddingTeacher && (
                                      <button 
                                        onClick={() => setIsAddingTeacher(true)}
                                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold flex items-center gap-1 transition-colors"
                                      >
                                          <UserPlus size={12} /> Tambah
                                      </button>
                                  )}
                              </div>

                              <div className="flex-1 overflow-y-auto max-h-[200px] pr-1 space-y-2">
                                  {isAddingTeacher && (
                                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3 animate-in fade-in slide-in-from-top-2">
                                          <p className="text-xs font-bold text-blue-800 mb-2">Daftar Guru Baru ke Unit Ini</p>
                                          <input 
                                              type="text" 
                                              placeholder="Nama Penuh Guru" 
                                              value={newTeacherName}
                                              onChange={e => setNewTeacherName(e.target.value)}
                                              className="w-full p-2 border border-blue-300 rounded text-sm mb-2 focus:ring-1 focus:ring-blue-500 outline-none"
                                              autoFocus
                                          />
                                          <input 
                                              type="email" 
                                              placeholder="Emel Rasmi (Pilihan)" 
                                              value={newTeacherEmail}
                                              onChange={e => setNewTeacherEmail(e.target.value)}
                                              className="w-full p-2 border border-blue-300 rounded text-sm mb-2 focus:ring-1 focus:ring-blue-500 outline-none"
                                          />
                                          <div className="flex gap-2 justify-end">
                                              <button onClick={() => setIsAddingTeacher(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Batal</button>
                                              <button onClick={handleRegisterTeacher} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-700">Simpan</button>
                                          </div>
                                      </div>
                                  )}

                                  {unitTeachers.length === 0 && !isAddingTeacher ? (
                                      <p className="text-sm text-gray-400 italic text-center py-4">Belum ada guru didaftarkan.</p>
                                  ) : (
                                      unitTeachers.map(teacher => (
                                          <div key={teacher.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                                              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                  {teacher.name.charAt(0)}
                                              </div>
                                              <div className="overflow-hidden">
                                                  <p className="text-sm font-medium text-gray-800 truncate">{teacher.name}</p>
                                                  <p className="text-[10px] text-gray-500 truncate">{teacher.id.includes('@') ? teacher.id : 'ID: ' + teacher.id}</p>
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div>
                          </div>
                      </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
                      <button onClick={() => setSelectedUnit(null)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">
                          Tutup
                      </button>
                      <button 
                          onClick={handleSaveChanges}
                          className={`px-5 py-2.5 rounded-lg font-bold text-white shadow-md flex items-center gap-2 text-sm transition-all ${isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                          {isSaved ? <CheckCircle2 size={18}/> : <Save size={18}/>}
                          {isSaved ? 'Disimpan' : 'Simpan Perubahan'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MAIN LIST --- */}
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800">Maklumat Unit Kokurikulum</h2>
         <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">{units.length} Unit</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map(unit => {
            const memberCount = students.filter(s => s.unitId === unit.id).length;
            const reportCount = reports.filter(r => r.unitId === unit.id && r.status === 'SUBMITTED').length;
            const teacherCount = users.filter(u => u.assignedUnitId === unit.id && u.role === UserRole.GURU_PENASIHAT).length;
            
            return (
                <div 
                    key={unit.id} 
                    onClick={() => handleUnitClick(unit)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 hover:scale-[1.02] transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-lg shadow-sm ${unit.category === UnitCategory.BADAN_BERUNIFORM ? 'bg-blue-100 text-blue-700' : unit.category === UnitCategory.SUKAN_PERMAINAN ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                            <Briefcase size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{unit.name}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-wide truncate">{unit.category.replace('_', ' ')}</p>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-500 flex items-center gap-1 text-xs"><Users size={12}/> Keahlian:</span>
                            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{memberCount} Murid</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-500 flex items-center gap-1 text-xs"><UserIcon size={12}/> Guru:</span>
                            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{teacherCount} Orang</span>
                        </div>
                         <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-500 flex items-center gap-1 text-xs"><FileText size={12}/> Laporan:</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-xs ${reportCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {reportCount} Dihantar
                            </span>
                        </div>
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};

// --- SU STUDENT LIST ---
interface SUStudentListProps {
  students: Student[];
  units: Unit[];
}

export const SUStudentList: React.FC<SUStudentListProps> = ({ students, units }) => {
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.class.toLowerCase().includes(search.toLowerCase());
    const matchUnit = filterUnit ? s.unitId === filterUnit : true;
    return matchSearch && matchUnit;
  });

  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
       <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Senarai Keseluruhan Murid</h2>
                <p className="text-gray-500 text-sm">Pangkalan data murid kokurikulum.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                        type="text" 
                        placeholder="Cari nama atau kelas..." 
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setPage(1); }} 
                        className="w-full pl-9 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>
                <select 
                    value={filterUnit} 
                    onChange={e => { setFilterUnit(e.target.value); setPage(1); }} 
                    className="p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white max-w-[150px]"
                >
                    <option value="">Semua Unit</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <tr>
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Nama Murid</th>
                    <th className="p-4 w-32">Kelas</th>
                    <th className="p-4 w-64">Unit Berdaftar</th>
                    <th className="p-4 w-40">Jawatan</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                {paginated.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Tiada murid ditemui.</td></tr>
                ) : (
                    paginated.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-center text-gray-400 font-mono text-xs">{(page-1)*itemsPerPage + idx + 1}</td>
                            <td className="p-4 font-medium text-gray-900">{s.name}</td>
                            <td className="p-4 text-gray-600">{s.class}</td>
                            <td className="p-4">
                                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                    {units.find(u=>u.id===s.unitId)?.name || '-'}
                                </span>
                            </td>
                            <td className="p-4 text-gray-600">{s.position || 'Ahli Biasa'}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
             <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                 <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-xs font-bold">Sebelum</button>
                 <span className="text-xs text-gray-500 font-bold">Muka {page} dari {totalPages}</span>
                 <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded bg-white disabled:opacity-50 text-xs font-bold">Seterusnya</button>
             </div>
          )}
       </div>
    </div>
  )
}

// --- SU ACHIEVEMENTS ---
interface SUAchievementsProps {
  units: Unit[];
  schoolId: string;
  achievements: Achievement[];
  onAddAchievement: (a: Achievement) => void;
  onUpdateAchievement: (a: Achievement) => void;
  onDeleteAchievement: (id: string) => void;
}

export const SUAchievements: React.FC<SUAchievementsProps> = ({ units, schoolId, achievements, onAddAchievement, onUpdateAchievement, onDeleteAchievement }) => {
    // Basic implementation mimicking Guru's but with unit selector and simplified view
    const [filterUnit, setFilterUnit] = useState('');
    const [selectedItem, setSelectedItem] = useState<Achievement | null>(null);
    const [isConfirmingPDF, setIsConfirmingPDF] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    
    // Filter logic
    const filtered = achievements.filter(a => filterUnit ? a.unitId === filterUnit : true)
                                 .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getLevelBadge = (level: string) => {
        switch(level) {
            case 'SEKOLAH': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'DAERAH': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'NEGERI': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'KEBANGSAAN': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'ANTARABANGSA': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const handleDownloadPDF = () => {
        setIsConfirmingPDF(false);
        setIsGeneratingPDF(true);

        setTimeout(() => {
            const doc = new jsPDF();
            const title = "Laporan Rekod Pencapaian Kokurikulum";
            const dateStr = new Date().toLocaleDateString('ms-MY');

            // Header
            doc.setFontSize(18);
            doc.text("KokuLite System", 14, 15);
            doc.setFontSize(14);
            doc.text(title, 14, 25);
            doc.setFontSize(10);
            doc.text(`Tarikh Cetakan: ${dateStr}`, 14, 32);

            // Table Data
            const tableData = filtered.map((item, index) => [
                index + 1,
                item.title,
                item.level,
                units.find(u => u.id === item.unitId)?.name || '-',
                item.result,
                new Date(item.date).toLocaleDateString('ms-MY')
            ]);

            autoTable(doc, {
                startY: 40,
                head: [['Bil', 'Pencapaian', 'Peringkat', 'Unit', 'Keputusan', 'Tarikh']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255 }
            });

            doc.save('Rekod_Pencapaian.pdf');
            setIsGeneratingPDF(false);
        }, 1500); // Fake delay for UX
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             
             {/* PDF Confirmation Modal */}
             {isConfirmingPDF && (
                 <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                     <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                         <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                             <FileDown size={32} />
                         </div>
                         <h3 className="text-xl font-bold text-slate-800 mb-2">Muat Turun PDF?</h3>
                         <p className="text-slate-500 text-sm mb-6">
                             Fail PDF akan dijana dan disimpan ke dalam folder 'Downloads' peranti anda.
                         </p>
                         <div className="flex gap-3">
                             <button onClick={() => setIsConfirmingPDF(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50">
                                 Batal
                             </button>
                             <button onClick={handleDownloadPDF} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md">
                                 Ya, Simpan
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             {/* Detail Modal */}
             {selectedItem && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                     <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                         <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
                             <div>
                                 <h3 className="text-xl font-bold">Butiran Pencapaian</h3>
                                 <p className="text-slate-300 text-sm mt-1">Maklumat penuh rekod.</p>
                             </div>
                             <button onClick={() => setSelectedItem(null)} className="text-slate-300 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                         </div>
                         <div className="p-6 space-y-4 bg-slate-50">
                             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Kejohanan</label>
                                 <p className="font-bold text-slate-800 text-lg">{selectedItem.title}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peringkat</label>
                                     <p className="font-bold text-blue-600">{selectedItem.level}</p>
                                 </div>
                                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keputusan</label>
                                     <p className="font-bold text-green-600">{selectedItem.result}</p>
                                 </div>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit / Kategori</label>
                                 <p className="font-medium text-slate-700">{units.find(u => u.id === selectedItem.unitId)?.name}</p>
                                 <p className="text-xs text-slate-500 mt-1 uppercase font-bold bg-slate-100 w-fit px-2 py-0.5 rounded">{selectedItem.category}</p>
                             </div>
                             {selectedItem.studentName && (
                                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pemenang</label>
                                     <p className="font-bold text-slate-800 flex items-center gap-2"><UserIcon size={16}/> {selectedItem.studentName}</p>
                                 </div>
                             )}
                         </div>
                         <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
                             <button onClick={() => setSelectedItem(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold shadow-md hover:bg-slate-800">Tutup</button>
                         </div>
                     </div>
                 </div>
             )}

             <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Rekod Pencapaian Sekolah</h2>
                    <p className="text-gray-500 text-sm">Senarai semua kemenangan pertandingan dan acara.</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        value={filterUnit} 
                        onChange={e => setFilterUnit(e.target.value)} 
                        className="p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]"
                    >
                        <option value="">Semua Unit</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button 
                        onClick={() => setIsConfirmingPDF(true)}
                        disabled={isGeneratingPDF}
                        className="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    >
                        {isGeneratingPDF ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
                        Download PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                        <Trophy size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Tiada rekod pencapaian.</p>
                    </div>
                ) : (
                    filtered.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                        >
                             <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                <Trophy size={24} />
                             </div>
                             <div className="flex-1">
                                 <div className="flex flex-wrap items-center gap-2 mb-2">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getLevelBadge(item.level)}`}>{item.level}</span>
                                     <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                                         <Calendar size={10} /> {new Date(item.date).toLocaleDateString()}
                                     </span>
                                     <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                         {units.find(u => u.id === item.unitId)?.name}
                                     </span>
                                 </div>
                                 <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{item.title}</h3>
                                 <div className="flex items-center gap-3 mt-2">
                                     <span className="text-sm font-bold text-green-700 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
                                         <Medal size={14} /> {item.result}
                                     </span>
                                     {item.studentName && (
                                         <span className="text-sm text-gray-600 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded">
                                             <UserIcon size={14} /> {item.studentName}
                                         </span>
                                     )}
                                 </div>
                             </div>
                             <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                                     <Eye size={18} />
                                 </button>
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// --- SU DOCUMENTS ---
interface SUDocumentsProps {
  schoolId: string;
}

export const SUDocuments: React.FC<SUDocumentsProps> = ({ schoolId }) => {
    // Mock Data for now
    const docs = [
        { id: '1', title: 'Takwim Kokurikulum Tahunan 2024', type: 'LAIN-LAIN', date: '2024-01-15' },
        { id: '2', title: 'Surat Lantikan Guru Penasihat', type: 'SURAT', date: '2024-03-01' },
        { id: '3', title: 'Format Laporan Aktiviti', type: 'LAIN-LAIN', date: '2024-01-10' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Dokumen & Fail</h2>
                <p className="text-gray-500 text-sm">Simpanan surat, minit mesyuarat dan bahan rujukan.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docs.map(doc => (
                    <div key={doc.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase">{doc.type}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                        <p className="text-xs text-gray-400 font-medium">{doc.date}</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                            <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                <Download size={14} /> Muat Turun
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Upload Placeholder */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="p-3 bg-gray-100 text-gray-400 rounded-full mb-3 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                        <Upload size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-600 group-hover:text-blue-600">Muat Naik Dokumen</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, Word atau Excel</p>
                </div>
            </div>
        </div>
    );
}

// --- SU NOTICES (EXISTING) ---
interface SUNoticesProps {
  announcements: Announcement[];
  onAdd: (announcement: Announcement) => void;
  onUpdate: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  schoolId: string;
}

export const SUNotices: React.FC<SUNoticesProps> = ({ announcements, onAdd, onUpdate, onDelete, schoolId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);

    const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({
        isOpen: false,
        id: null
    });

    const openAdd = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setIsImportant(false);
        setIsModalOpen(true);
    };

    const openEdit = (ann: Announcement) => {
        setEditingId(ann.id);
        setTitle(ann.title || '');
        setContent(ann.content);
        setIsImportant(ann.isImportant);
        setIsModalOpen(true);
    };

    const openDelete = (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const handleSave = () => {
        if (!content.trim() || !title.trim()) return alert("Sila lengkapkan tajuk dan kandungan notis.");
        
        const noticeData: Announcement = {
            id: editingId || `notis_${Date.now()}`,
            title: title,
            content: content,
            date: editingId ? announcements.find(a => a.id === editingId)?.date || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            authorId: 'su',
            isImportant: isImportant,
            schoolId: schoolId
        };

        if (editingId) {
            onUpdate(noticeData);
        } else {
            onAdd(noticeData);
        }

        setIsModalOpen(false);
        setTitle('');
        setContent('');
        setIsImportant(false);
        setEditingId(null);
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            onDelete(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {deleteModal.isOpen && (
                 <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-100 transition-all border-t-4 border-red-500">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Padam Notis?</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                Adakah anda pasti mahu memadam pengumuman ini? Tindakan ini tidak boleh dikembalikan.
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setDeleteModal({isOpen: false, id: null})}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    Ya, Padam
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

             {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Kemaskini Pengumuman' : 'Tambah Pengumuman'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tajuk</label>
                                <input 
                                    type="text"
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Tajuk ringkas..." 
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Kandungan Notis</label>
                                <textarea 
                                    value={content} 
                                    onChange={e => setContent(e.target.value)} 
                                    rows={4} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Tulis pengumuman di sini..." 
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                                <input 
                                    type="checkbox" 
                                    id="imp" 
                                    checked={isImportant} 
                                    onChange={e => setIsImportant(e.target.checked)} 
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
                                />
                                <label htmlFor="imp" className="text-sm text-red-700 font-bold cursor-pointer flex-1">
                                    Tandakan sebagai PENTING
                                </label>
                                <AlertTriangle size={16} className="text-red-500" />
                            </div>
                             <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-4 flex items-center justify-center gap-2">
                                <Save size={18} />
                                {editingId ? 'Simpan Perubahan' : 'Siar Pengumuman'}
                            </button>
                        </div>
                    </div>
                </div>
             )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Notis & Pengumuman</h2>
                <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={16} /> Tambah Notis
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                {announcements.map(ann => (
                    <div key={ann.id} className="p-6 flex gap-4 group">
                        <div className={`p-3 rounded-full h-fit ${ann.isImportant ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Bell size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">{ann.date}</span>
                                    {ann.isImportant && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">PENTING</span>}
                                </div>
                                
                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                        onClick={() => openEdit(ann)} 
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Kemaskini"
                                     >
                                         <Edit size={16}/>
                                     </button>
                                     <button 
                                        onClick={() => openDelete(ann.id)} 
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Padam"
                                     >
                                         <Trash2 size={16}/>
                                     </button>
                                </div>
                            </div>
                            {ann.title && <h4 className="font-bold text-gray-900 text-sm mb-1">{ann.title}</h4>}
                            <p className="text-gray-800 leading-relaxed text-sm md:text-base">{ann.content}</p>
                        </div>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                        <Bell size={48} className="opacity-20 mb-3" />
                        <p className="font-medium">Tiada pengumuman semasa.</p>
                        <p className="text-xs mt-1">Tekan butang tambah untuk membuat pengumuman baru.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// NEW: Read Only View for Guru
export const GuruNoticesList: React.FC<{ announcements: Announcement[] }> = ({ announcements }) => {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Notifikasi & Hebahan</h2>
                <p className="text-gray-500 text-sm">Makluman terkini daripada pentadbiran sekolah.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                {announcements.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center text-gray-400">
                        <Bell size={64} className="opacity-20 mb-4" />
                        <p className="font-medium text-lg">Tiada pengumuman.</p>
                        <p className="text-sm mt-1">Semua makluman akan dipaparkan di sini.</p>
                    </div>
                ) : (
                    announcements.map(ann => (
                        <div key={ann.id} className={`p-6 flex gap-5 hover:bg-slate-50 transition-colors ${ann.isImportant ? 'bg-red-50/30' : ''}`}>
                            <div className={`p-3 rounded-full h-fit shadow-sm ${ann.isImportant ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Bell size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{ann.date}</span>
                                    {ann.isImportant && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded shadow-sm animate-pulse">PENTING</span>}
                                </div>
                                {ann.title && <h3 className="font-bold text-gray-900 text-lg mb-2">{ann.title}</h3>}
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{ann.content}</p>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daripada: Pentadbir Sekolah</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};