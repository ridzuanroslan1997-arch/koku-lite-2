import React, { useState, useMemo, useEffect } from 'react';
import { Achievement, Student, Unit } from '../types';
import { Trophy, Plus, Calendar, Medal, User, Users, X, Save, Trash2, Award, Edit2, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface AchievementsProps {
  achievements: Achievement[];
  students: Student[]; // All students in unit (for selection)
  unit: Unit;
  schoolId: string;
  onAddAchievement: (achievement: Achievement) => void;
  onUpdateAchievement: (achievement: Achievement) => void;
  onDeleteAchievement: (id: string) => void;
}

export const Achievements: React.FC<AchievementsProps> = ({ 
    achievements, 
    students, 
    unit, 
    schoolId,
    onAddAchievement,
    onUpdateAchievement,
    onDeleteAchievement
}) => {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'UNIT' | 'INDIVIDU'>('UNIT');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // UI States for Modals
    const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });
    const [submitModal, setSubmitModal] = useState<{isOpen: boolean, id: string | null}>({ isOpen: false, id: null });
    
    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formLevel, setFormLevel] = useState('DAERAH');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formResult, setFormResult] = useState('');
    const [formStudentId, setFormStudentId] = useState('');

    // --- Filter Data ---
    const unitAchievements = useMemo(() => 
        achievements.filter(a => a.unitId === unit.id && a.category === 'UNIT')
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [achievements, unit.id]);

    const individualAchievements = useMemo(() => 
        achievements.filter(a => a.unitId === unit.id && a.category === 'INDIVIDU')
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [achievements, unit.id]);

    const displayedList = activeTab === 'UNIT' ? unitAchievements : individualAchievements;
    const sortedStudents = useMemo(() => [...students].sort((a,b) => a.name.localeCompare(b.name)), [students]);

    // --- Handlers ---
    const openAddModal = () => {
        setEditingId(null);
        setFormTitle('');
        setFormResult('');
        setFormStudentId('');
        setFormLevel('DAERAH');
        setFormDate(new Date().toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const openEditModal = (ach: Achievement) => {
        setEditingId(ach.id);
        setFormTitle(ach.title);
        setFormResult(ach.result);
        setFormLevel(ach.level);
        setFormDate(ach.date);
        setFormStudentId(ach.studentId || '');
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formTitle || !formResult) {
            alert("Sila lengkapkan Tajuk dan Keputusan.");
            return;
        }

        if (activeTab === 'INDIVIDU' && !formStudentId) {
            alert("Sila pilih nama murid untuk pencapaian individu.");
            return;
        }

        const studentName = activeTab === 'INDIVIDU' 
            ? students.find(s => s.id === formStudentId)?.name 
            : undefined;

        const achievementData: Achievement = {
            id: editingId || `ach_${Date.now()}`,
            title: formTitle,
            level: formLevel as any,
            category: activeTab,
            unitId: unit.id,
            schoolId: schoolId,
            date: formDate,
            result: formResult,
            studentId: activeTab === 'INDIVIDU' ? formStudentId : undefined,
            studentName: studentName,
            status: editingId ? achievements.find(a => a.id === editingId)?.status : 'DRAFT'
        };

        if (editingId) {
            onUpdateAchievement(achievementData);
        } else {
            onAddAchievement(achievementData);
        }
        
        setIsModalOpen(false);
    };

    const initiateDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = () => {
        if (deleteModal.id) {
            onDeleteAchievement(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    const initiateSubmit = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSubmitModal({ isOpen: true, id });
    };

    const confirmSubmit = () => {
        if (submitModal.id) {
            const original = achievements.find(a => a.id === submitModal.id);
            if (original) {
                onUpdateAchievement({ ...original, status: 'SUBMITTED' });
            }
            setSubmitModal({ isOpen: false, id: null });
        }
    };

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

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
            
            {/* --- DELETE CONFIRMATION MODAL --- */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border-t-4 border-red-500">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Padam Rekod?</h3>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                Adakah anda pasti? Tindakan ini tidak boleh dikembalikan. Data pencapaian akan dihapuskan.
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setDeleteModal({isOpen: false, id: null})}
                                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    Ya, Padam
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SUBMIT CONFIRMATION MODAL --- */}
            {submitModal.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border-t-4 border-green-500">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <Send size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Hantar Laporan?</h3>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                Rekod ini akan dihantar kepada Setiausaha Kokurikulum untuk semakan. Anda tidak boleh mengedit rekod ini selepas dihantar.
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setSubmitModal({isOpen: false, id: null})}
                                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmSubmit}
                                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    Ya, Hantar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Trophy className="text-yellow-500 fill-yellow-500" />
                        Rekod Pencapaian
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">
                        Unit: <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{unit.name}</span>
                    </p>
                </div>
                <button 
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center gap-2 font-bold text-sm transform active:scale-95"
                >
                    <Plus size={20} />
                    Tambah Pencapaian
                </button>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Trophy size={24}/></div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Menang</p>
                        <p className="text-2xl font-extrabold text-slate-900">{unitAchievements.length + individualAchievements.length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-colors">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users size={24}/></div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kategori Unit</p>
                        <p className="text-2xl font-extrabold text-slate-900">{unitAchievements.length}</p>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-orange-300 transition-colors">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><User size={24}/></div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Kategori Individu</p>
                        <p className="text-2xl font-extrabold text-slate-900">{individualAchievements.length}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-200 p-1.5 rounded-xl w-fit mb-6">
                <button 
                    onClick={() => setActiveTab('UNIT')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'UNIT' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                >
                    <Users size={18} /> Pencapaian Unit
                </button>
                <button 
                    onClick={() => setActiveTab('INDIVIDU')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'INDIVIDU' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
                >
                    <User size={18} /> Pencapaian Individu
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {displayedList.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-16 text-center">
                        <Medal size={64} className="mx-auto mb-4 text-slate-200" />
                        <h3 className="text-xl font-bold text-slate-700">Tiada Pencapaian Direkodkan</h3>
                        <p className="text-slate-400 mt-2">
                            Klik butang "Tambah Pencapaian" di atas untuk mula.
                        </p>
                    </div>
                ) : (
                    displayedList.map(item => {
                        const isDraft = !item.status || item.status === 'DRAFT';
                        const isSubmitted = item.status === 'SUBMITTED';
                        const isVerified = item.status === 'VERIFIED';

                        return (
                            <div key={item.id} className={`bg-white rounded-2xl shadow-sm border p-6 transition-all group flex flex-col md:flex-row gap-5 items-start md:items-center relative
                                ${isVerified ? 'border-green-200 bg-green-50/10' : 'border-slate-200 hover:border-blue-400 hover:shadow-md'}
                            `}>
                                {/* Icon Box */}
                                <div className={`p-4 rounded-xl shrink-0 ${activeTab === 'UNIT' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                    <Trophy size={28} />
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${getLevelBadge(item.level)}`}>
                                            {item.level}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded">
                                            <Calendar size={12} /> {new Date(item.date).toLocaleDateString('ms-MY', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                        {/* STATUS BADGE */}
                                        {isVerified ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded uppercase border border-green-200">
                                                <CheckCircle2 size={12} /> Disahkan
                                            </span>
                                        ) : isSubmitted ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded uppercase border border-blue-200">
                                                <Send size={12} /> Dihantar
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded uppercase border border-yellow-200">
                                                <Edit2 size={12} /> Draf
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">{item.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg flex items-center gap-2 border border-green-100">
                                            <Medal size={16} /> {item.result}
                                        </span>
                                        {item.category === 'INDIVIDU' && item.studentName && (
                                            <span className="text-sm text-slate-600 flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                                <User size={14} /> {item.studentName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    {isDraft && (
                                        <>
                                            <button 
                                                onClick={(e) => initiateSubmit(item.id, e)}
                                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                                                title="Hantar Laporan"
                                            >
                                                <Send size={14} /> Hantar
                                            </button>
                                            <button 
                                                onClick={() => openEditModal(item)}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 bg-white"
                                                title="Edit Rekod"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => initiateDelete(item.id, e)}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200 bg-white"
                                                title="Padam Rekod"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                    {(isSubmitted || isVerified) && (
                                        <div className="text-xs text-slate-400 italic pr-2 font-medium bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                            <span className="flex items-center gap-1"><AlertCircle size={14}/> Rekod Dikunci</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- FORM MODAL (ADD / EDIT) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {editingId ? 'Kemaskini Pencapaian' : `Tambah Pencapaian`}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Rekod kejayaan pertandingan dan acara.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="space-y-5 overflow-y-auto flex-1 pr-2">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Kejohanan / Pertandingan</label>
                                <input 
                                    value={formTitle} 
                                    onChange={e => setFormTitle(e.target.value)} 
                                    className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" 
                                    placeholder="Cth: Pertandingan Kawad Kaki Peringkat Daerah"
                                    autoFocus
                                />
                            </div>

                            {activeTab === 'INDIVIDU' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Murid</label>
                                    <div className="relative">
                                        <select 
                                            value={formStudentId} 
                                            onChange={e => setFormStudentId(e.target.value)} 
                                            className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white text-slate-800"
                                        >
                                            <option value="">-- Pilih Murid --</option>
                                            {sortedStudents.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                                            ))}
                                        </select>
                                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5 italic">Hanya murid dalam unit {unit.name} dipaparkan.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Peringkat</label>
                                    <select 
                                        value={formLevel} 
                                        onChange={e => setFormLevel(e.target.value)} 
                                        className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                                    >
                                        <option value="SEKOLAH">Sekolah</option>
                                        <option value="DAERAH">Daerah</option>
                                        <option value="NEGERI">Negeri</option>
                                        <option value="KEBANGSAAN">Kebangsaan</option>
                                        <option value="ANTARABANGSA">Antarabangsa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tarikh</label>
                                    <input 
                                        type="date" 
                                        value={formDate} 
                                        onChange={e => setFormDate(e.target.value)} 
                                        className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Keputusan</label>
                                <div className="relative">
                                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input 
                                        value={formResult} 
                                        onChange={e => setFormResult(e.target.value)} 
                                        className="w-full pl-12 p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" 
                                        placeholder="Cth: Johan / Naib Johan / Pingat Emas"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="flex-1 py-3.5 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> {editingId ? 'Kemaskini' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};