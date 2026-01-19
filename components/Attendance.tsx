/**
 * 🔒 LOCKED COMPONENT (GURU PENASIHAT)
 * This component is finalized for the Guru Penasihat role.
 * Do not modify logic here when working on Admin/SU features.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceRecord, Unit } from '../types';
import { Calendar, Save, CheckCircle2, XCircle, Plus, Edit2, Users, Search, X, UserCog } from 'lucide-react';
import { STORAGE_KEYS } from '../constants';

interface AttendanceProps {
  students: Student[];
  unit: Unit;
  // We need to pass the full attendance history to show the dashboard list
  // In a real app, this would be fetched from the backend inside this component
  onSave: (record: AttendanceRecord) => void;
  existingRecords?: AttendanceRecord[]; // Optional prop to pass existing records if available in parent
  onChangeView?: (view: string) => void; // Optional: to switch to student management
  schoolId: string;
}

// Mocking the access to global attendance state for this demo since props were limited in App.tsx
// In a real React app, you'd use Context or Redux. 
// Here we will use a little trick to read from localStorage just to display the list nicely 
// without changing App.tsx signature too much, OR we assume the parent handles it.
// For this specific request, I will manage local state for the UI flow.

export const Attendance: React.FC<AttendanceProps> = ({ students, unit, onSave, onChangeView, schoolId }) => {
  // --- Local State for UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  
  // Data State for the Form
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formActivity, setFormActivity] = useState('');
  const [formPresentIds, setFormPresentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Load records from localStorage to display the "Dashboard" list for this unit
  const [unitRecords, setUnitRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const loadRecords = () => {
        try {
            const allRecordsString = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
            if (allRecordsString) {
                const allRecords: AttendanceRecord[] = JSON.parse(allRecordsString);
                const filtered = allRecords
                    .filter(r => r.unitId === unit.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setUnitRecords(filtered);
            }
        } catch (e) {
            console.error("Failed to load attendance records", e);
        }
    };
    loadRecords();
    // Set up a listener solely for this demo to refresh list when save happens
    window.addEventListener('storage', loadRecords);
    return () => window.removeEventListener('storage', loadRecords);
  }, [unit.id]);

  // Filter students for this unit
  const unitStudents = useMemo(() => 
    students.filter(s => s.unitId === unit.id).sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name)),
  [students, unit.id]);

  // Filter students in modal based on search
  const filteredStudents = unitStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Handlers ---

  const openNewSession = () => {
    setEditingRecord(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormActivity('');
    setFormPresentIds(new Set()); // Default empty or maybe select all? Let's keep empty.
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const openEditSession = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormDate(record.date);
    setFormActivity(record.activityName || '');
    setFormPresentIds(new Set(record.studentIdsPresent));
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const toggleStudentPresence = (id: string) => {
    const newSet = new Set(formPresentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setFormPresentIds(newSet);
  };

  const markAll = (present: boolean) => {
    if (present) {
        setFormPresentIds(new Set(unitStudents.map(s => s.id)));
    } else {
        setFormPresentIds(new Set());
    }
  };

  const handleSave = () => {
    if (!formActivity.trim()) {
        alert("Sila masukkan nama aktiviti.");
        return;
    }

    const record: AttendanceRecord = {
      id: editingRecord ? editingRecord.id : `att_${Date.now()}`,
      date: formDate,
      activityName: formActivity,
      unitId: unit.id,
      schoolId: schoolId,
      studentIdsPresent: Array.from(formPresentIds),
      totalStudents: unitStudents.length
    };

    onSave(record);
    
    // Manual refresh for local list since we rely on localStorage in this component
    try {
        const allRecordsString = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
        const allRecords: AttendanceRecord[] = allRecordsString ? JSON.parse(allRecordsString) : [];
        const updatedRecords = editingRecord 
            ? allRecords.map(r => r.id === record.id ? record : r)
            : [...allRecords, record];
        
        // Update local state immediately for UI responsiveness
        setUnitRecords(updatedRecords.filter(r => r.unitId === unit.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
        console.error("Error updating local state", e);
    }
    
    setIsModalOpen(false);
  };

  // --- Stats for Modal ---
  const presentCount = formPresentIds.size;
  const absentCount = unitStudents.length - presentCount;
  const percentage = Math.round((presentCount / (unitStudents.length || 1)) * 100);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-blue-600" />
                Pengurusan Kehadiran
            </h1>
            <p className="text-gray-500 text-sm mt-1">Unit: <span className="font-semibold text-gray-700">{unit.name}</span></p>
        </div>
        <div className="flex gap-2">
             {onChangeView && (
                <button 
                    onClick={() => onChangeView('students')}
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium"
                >
                    <UserCog size={18} />
                    <span className="hidden md:inline">Urus Pelajar</span>
                </button>
             )}
            <button 
                onClick={openNewSession}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium"
            >
                <Plus size={20} />
                Rekod Sesi Baru
            </button>
        </div>
      </div>

      {/* Main Content: List of Sessions (Dashboard Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unitRecords.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Calendar className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Belum ada rekod</h3>
                <p className="text-gray-500 mt-1 mb-4">Mula merekod kehadiran untuk aktiviti pertama anda.</p>
                <button onClick={openNewSession} className="text-blue-600 font-medium hover:underline">
                    Cipta Rekod Sekarang
                </button>
            </div>
        ) : (
            unitRecords.map(record => {
                const percentage = Math.round((record.studentIdsPresent.length / record.totalStudents) * 100);
                return (
                    <div 
                        key={record.id} 
                        onClick={() => openEditSession(record)}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 size={16} className="text-blue-500" />
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                            <Calendar size={14} />
                            {new Date(record.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate pr-6">
                            {record.activityName || "Aktiviti Tanpa Nama"}
                        </h3>
                        
                        <div className="mt-4 flex items-end justify-between">
                            <div>
                                <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
                                <div className="text-xs text-gray-500">Kehadiran</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-700">
                                    <span className="text-green-600">{record.studentIdsPresent.length}</span> / {record.totalStudents}
                                </div>
                                <div className="text-xs text-gray-400">Murid Hadir</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* --- MODAL POPUP --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                
                {/* Modal Header */}
                <div className="bg-blue-900 text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">
                            {editingRecord ? 'Kemaskini Sesi' : 'Rekod Sesi Baru'}
                        </h2>
                        <p className="text-blue-200 text-sm mt-0.5">Lengkapkan butiran aktiviti dan kehadiran.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-blue-200 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    
                    {/* Top Controls: Activity Info */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Aktiviti</label>
                            <input 
                                type="text" 
                                value={formActivity}
                                onChange={e => setFormActivity(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Contoh: Latihan Kawad Kaki / Mesyuarat Agung"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tarikh</label>
                            <input 
                                type="date" 
                                value={formDate}
                                onChange={e => setFormDate(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Student List Section */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800">Senarai Kehadiran</h3>
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{unitStudents.length} Murid</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-40 md:w-56"
                                    />
                                </div>
                                <div className="flex bg-gray-200 rounded-lg p-1">
                                    <button onClick={() => markAll(true)} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:text-green-700 hover:shadow-sm rounded transition-all">Semua Hadir</button>
                                    <button onClick={() => markAll(false)} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:text-red-700 hover:shadow-sm rounded transition-all">Kosongkan</button>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                            {filteredStudents.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 italic">Tiada murid ditemui.</div>
                            ) : (
                                filteredStudents.map((student) => {
                                    const isPresent = formPresentIds.has(student.id);
                                    return (
                                        <div 
                                            key={student.id}
                                            onClick={() => toggleStudentPresence(student.id)}
                                            className={`
                                                flex items-center justify-between p-4 cursor-pointer transition-colors border-l-4
                                                ${isPresent ? 'bg-blue-50/30 border-blue-500' : 'hover:bg-gray-50 border-transparent'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                                    ${isPresent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}
                                                `}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isPresent ? 'text-gray-900' : 'text-gray-500'}`}>
                                                        {student.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{student.class}</p>
                                                </div>
                                            </div>
                                            
                                            <div className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                                ${isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}
                                            `}>
                                                {isPresent ? (
                                                    <>Hadir <CheckCircle2 size={16} /></>
                                                ) : (
                                                    <>Tidak Hadir <XCircle size={16} /></>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer - Sticky */}
                <div className="bg-white border-t border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="flex gap-6 text-sm">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Hadir</span>
                            <span className="text-xl font-bold text-green-600">{presentCount}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Tidak Hadir</span>
                            <span className="text-xl font-bold text-red-500">{absentCount}</span>
                        </div>
                        <div className="flex flex-col border-l pl-6 ml-2">
                            <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Peratus</span>
                            <span className="text-xl font-bold text-blue-600">{percentage}%</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 md:flex-none px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-1 md:flex-none px-8 py-2.5 rounded-lg bg-blue-900 text-white font-bold shadow-lg hover:bg-blue-800 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Simpan Rekod
                        </button>
                    </div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
};