import React, { useState, useMemo } from 'react';
import { User, Unit, UserRole } from '../types';
import { Search, UserCheck, Briefcase, Mail, ShieldCheck, Trash2, AlertTriangle, X } from 'lucide-react';

interface RegisteredTeachersListProps {
  users: User[];
  units: Unit[];
  currentUser: User;
  onDeleteTeacher: (id: string) => void;
}

export const RegisteredTeachersList: React.FC<RegisteredTeachersListProps> = ({ users, units, currentUser, onDeleteTeacher }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, user: User | null}>({isOpen: false, user: null});

  // Filter only GURU_PENASIHAT for the current school
  const teachers = useMemo(() => {
    return users.filter(u => 
      u.role === UserRole.GURU_PENASIHAT && 
      u.schoolId === currentUser.schoolId
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, currentUser.schoolId]);

  // Filter based on search
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  const initiateDelete = (user: User) => {
      setDeleteModal({ isOpen: true, user });
  };

  const confirmDelete = () => {
      if (deleteModal.user) {
          onDeleteTeacher(deleteModal.user.id);
          setDeleteModal({ isOpen: false, user: null });
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModal.isOpen && deleteModal.user && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-100 transition-all border-t-4 border-red-500">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                          <Trash2 size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Padam Akaun Guru?</h3>
                      
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100 w-full mb-6 relative overflow-hidden">
                          <div className="relative z-10 text-left">
                              <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Nama Guru</p>
                              <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{deleteModal.user.name}</p>
                              <p className="text-xs text-gray-600">{deleteModal.user.id}</p>
                          </div>
                      </div>
                      
                      <div className="flex items-start gap-2 bg-yellow-50 p-3 rounded-lg text-left mb-6 border border-yellow-100">
                          <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-800 leading-snug font-medium">
                              Tindakan ini <b>tidak boleh dikembalikan</b>. Akaun guru ini akan dipadam dari sistem sekolah.
                          </p>
                      </div>
                      
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => setDeleteModal({isOpen: false, user: null})}
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

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserCheck className="text-blue-600" />
            Senarai Guru Berdaftar
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Paparan maklumat pendaftaran akaun guru penasihat bagi {currentUser.schoolName}.
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                <ShieldCheck size={24} />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Jumlah Mendaftar</p>
                <p className="text-2xl font-extrabold text-gray-900">{teachers.length} <span className="text-sm font-medium text-gray-400">Guru</span></p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari nama guru atau emel..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
                />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 w-16 text-center">#</th>
                        <th className="px-6 py-4">Nama Guru</th>
                        <th className="px-6 py-4">ID Pengguna (Emel)</th>
                        <th className="px-6 py-4">Unit Dipegang</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center w-24">Tindakan</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredTeachers.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-gray-400">
                                <div className="flex flex-col items-center justify-center">
                                    <UserCheck size={48} className="opacity-20 mb-3" />
                                    <p className="font-medium">Tiada guru dijumpai.</p>
                                    <p className="text-xs">Pastikan guru telah mendaftar menggunakan Kod Sekolah yang betul.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredTeachers.map((teacher, index) => {
                            const assignedUnit = units.find(u => u.id === teacher.assignedUnitId);
                            const hasTempUnit = teacher.assignedUnitId?.startsWith('temp_');

                            return (
                                <tr key={teacher.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{teacher.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit text-xs font-mono border border-gray-200">
                                            <Mail size={12} /> {teacher.id}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {assignedUnit ? (
                                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                                <Briefcase size={16} className="text-blue-500" />
                                                {assignedUnit.name}
                                            </div>
                                        ) : hasTempUnit ? (
                                            <div className="text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded w-fit flex items-center gap-1">
                                                {teacher.registeredUnitName || 'Menunggu Data'} 
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Tiada Unit</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            Aktif
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => initiateDelete(teacher)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group-hover:opacity-100"
                                            title="Padam Akaun"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
            <span>Senarai ini dijana secara automatik daripada pangkalan data.</span>
            <span>Jumlah Rekod: {filteredTeachers.length}</span>
        </div>

      </div>
    </div>
  );
};