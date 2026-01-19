
/**
 * 🔒 LOCKED COMPONENT (GURU PENASIHAT)
 * Updated with ADD NEW STUDENT Feature.
 */

import React, { useState, useMemo } from 'react';
import { Student, Unit } from '../types';
import { UserCog, Search, Edit2, Trash2, Check, X, Shield, AlertTriangle, ChevronLeft, ChevronRight, UserPlus, Save } from 'lucide-react';

interface StudentManagementProps {
  students: Student[];
  unit: Unit;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  schoolId: string;
}

const POSITIONS = ['Pengerusi', 'Naib Pengerusi', 'Setiausaha', 'Pen. Setiausaha', 'Bendahari', 'Pen. Bendahari', 'AJK', 'Ahli Biasa'];
const ITEMS_PER_PAGE = 50;

export const StudentManagement: React.FC<StudentManagementProps> = ({ students, unit, onAddStudent, onUpdateStudent, onDeleteStudent, schoolId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');
  const [newStudentPosition, setNewStudentPosition] = useState('Ahli Biasa');

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, student: Student | null}>({
      isOpen: false,
      student: null
  });
  
  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editPosition, setEditPosition] = useState('');

  // Filter students for this unit & school (Assumed filtered by parent, but sorting here)
  const unitStudents = useMemo(() => 
    students.filter(s => s.unitId === unit.id).sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name)),
  [students, unit.id]);

  const filteredStudents = useMemo(() => {
    return unitStudents.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.class.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unitStudents, searchQuery]);

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Reset to page 1 on search
  React.useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery]);

  // --- HANDLERS ---

  const handleAddSubmit = () => {
      if (!newStudentName.trim() || !newStudentClass.trim()) {
          alert("Sila isi Nama dan Kelas.");
          return;
      }

      const newStudent: Student = {
          id: `std_${Date.now()}_new`, // Simple ID generation
          name: newStudentName,
          class: newStudentClass,
          unitId: unit.id,
          schoolId: schoolId,
          position: newStudentPosition
      };

      onAddStudent(newStudent);
      
      // Reset & Close
      setIsAddModalOpen(false);
      setNewStudentName('');
      setNewStudentClass('');
      setNewStudentPosition('Ahli Biasa');
      
      // Provide feedback (optional)
      // alert("Murid berjaya didaftarkan.");
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditClass(student.class);
    setEditPosition(student.position || 'Ahli Biasa');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (originalStudent: Student) => {
    if (!editName.trim()) {
        alert("Nama tidak boleh kosong.");
        return;
    }
    const updated: Student = {
        ...originalStudent,
        name: editName,
        class: editClass,
        position: editPosition
    };
    onUpdateStudent(updated);
    setEditingId(null);
  };

  const initiateDelete = (student: Student) => {
      setDeleteModal({ isOpen: true, student });
  };

  const confirmDelete = () => {
      if (deleteModal.student) {
          onDeleteStudent(deleteModal.student.id);
          setDeleteModal({ isOpen: false, student: null });
      }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
        {/* --- ADD STUDENT MODAL --- */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <UserPlus className="text-blue-600" />
                            Daftar Murid Baru
                        </h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 mb-4">
                            Murid ini akan didaftarkan terus ke dalam unit <b>{unit.name}</b>.
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penuh Murid</label>
                            <input 
                                value={newStudentName}
                                onChange={e => setNewStudentName(e.target.value)}
                                type="text" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="Cth: Muhammad Ali Bin Abu"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Kelas</label>
                            <input 
                                value={newStudentClass}
                                onChange={e => setNewStudentClass(e.target.value)}
                                type="text" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="Cth: 4 Merah"
                                list="class-suggestions"
                            />
                            <datalist id="class-suggestions">
                                <option value="4 Merah" />
                                <option value="4 Biru" />
                                <option value="5 Merah" />
                                <option value="5 Biru" />
                                <option value="6 Merah" />
                                <option value="6 Biru" />
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Jawatan</label>
                            <select 
                                value={newStudentPosition} 
                                onChange={e => setNewStudentPosition(e.target.value)} 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <button 
                            onClick={handleAddSubmit} 
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-4 flex items-center justify-center gap-2 shadow-md"
                        >
                            <Save size={18} />
                            Simpan & Daftar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {deleteModal.isOpen && deleteModal.student && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-100 transition-all border-t-4 border-red-500">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Padam Rekod Pelajar?</h3>
                        
                        <div className="bg-red-50 p-5 rounded-xl border border-red-100 w-full mb-6 relative overflow-hidden">
                            <div className="relative z-10 text-left">
                                <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Butiran Pelajar</p>
                                <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{deleteModal.student.name}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="bg-white px-2 py-0.5 rounded border border-red-100">{deleteModal.student.class}</span>
                                    <span>•</span>
                                    <span>{deleteModal.student.position || 'Ahli Biasa'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Adakah anda pasti? Tindakan ini <b>tidak boleh dikembalikan</b>. Data pelajar ini akan dihapuskan sepenuhnya dari sistem.
                        </p>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setDeleteModal({isOpen: false, student: null})}
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

        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserCog className="text-blue-600" />
                    Pengurusan Pelajar
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Unit: <span className="font-semibold text-gray-700">{unit.name}</span> • Urus senarai nama, jawatan dan keahlian.
                </p>
            </div>
            
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-bold text-sm"
            >
                <UserPlus size={18} />
                Daftar Murid Baru
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau kelas..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 text-sm"
                    />
                </div>
                <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                    Jumlah: <span className="font-bold text-gray-800">{filteredStudents.length}</span> Pelajar
                </div>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <div className="col-span-1">No.</div>
                <div className="col-span-4">Nama Pelajar</div>
                <div className="col-span-2">Kelas</div>
                <div className="col-span-3">Jawatan</div>
                <div className="col-span-2 text-right">Tindakan</div>
            </div>

            {/* List with Pagination */}
            <div className="divide-y divide-gray-100 min-h-[300px]">
                {paginatedStudents.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p className="mb-2 font-medium">Tiada pelajar dijumpai.</p>
                        <p className="text-xs text-gray-400">Pastikan Setiausaha Kokurikulum telah memuat naik data unit ini.</p>
                    </div>
                ) : (
                    paginatedStudents.map((student, idx) => (
                        <div key={student.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50/30 transition-colors">
                            {editingId === student.id ? (
                                // EDIT MODE
                                <>
                                    <div className="col-span-1 text-gray-400 font-mono text-xs hidden md:block">{(currentPage-1)*ITEMS_PER_PAGE + idx + 1}</div>
                                    <div className="col-span-12 md:col-span-4">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block md:hidden">Nama</label>
                                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"/>
                                    </div>
                                    <div className="col-span-12 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block md:hidden">Kelas</label>
                                        <input type="text" value={editClass} onChange={e => setEditClass(e.target.value)} className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"/>
                                    </div>
                                    <div className="col-span-12 md:col-span-3">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block md:hidden">Jawatan</label>
                                        <select value={editPosition} onChange={e => setEditPosition(e.target.value)} className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                                            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 mt-2 md:mt-0">
                                        <button onClick={() => saveEdit(student)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors shadow-sm"><Check size={18} /></button>
                                        <button onClick={cancelEdit} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"><X size={18} /></button>
                                    </div>
                                </>
                            ) : (
                                // VIEW MODE
                                <>
                                    <div className="col-span-1 text-gray-400 font-mono text-xs hidden md:block">{(currentPage-1)*ITEMS_PER_PAGE + idx + 1}</div>
                                    <div className="col-span-12 md:col-span-4 font-medium text-gray-800">
                                        <span className="md:hidden text-gray-400 text-xs mr-2">#{(currentPage-1)*ITEMS_PER_PAGE + idx+1}</span>
                                        {student.name}
                                    </div>
                                    <div className="col-span-6 md:col-span-2 text-sm text-gray-600">
                                        <span className="md:hidden font-bold text-xs text-gray-400 mr-2">Kelas:</span>
                                        {student.class}
                                    </div>
                                    <div className="col-span-6 md:col-span-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${student.position && student.position !== 'Ahli Biasa' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600'}`}>
                                            {student.position && student.position !== 'Ahli Biasa' && <Shield size={10} />}
                                            {student.position || 'Ahli Biasa'}
                                        </span>
                                    </div>
                                    <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 mt-2 md:mt-0">
                                        <button onClick={() => startEdit(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => initiateDelete(student)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <ChevronLeft size={16} /> Sebelumnya
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                        Halaman {currentPage} dari {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        Seterusnya <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};
