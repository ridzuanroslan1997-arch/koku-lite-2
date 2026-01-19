/**
 * 🔒 LOCKED COMPONENT (GURU PENASIHAT LOGIC)
 * The Guru Penasihat View in this component is finalized.
 * Ensure any global changes do not regress the Guru flow (Editor & List).
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ActivityReport, Unit, UserRole, User, AttendanceRecord } from '../types';
import { generateActivityReport } from '../services/geminiService';
import { Bot, FileText, Loader2, Image as ImageIcon, X, Save, Send, Edit, AlertCircle, Calendar, CheckCircle2, HelpCircle, Lock, Filter, Clock, ChevronLeft, MessageSquareWarning } from 'lucide-react';

interface ReportsProps {
  attendance: AttendanceRecord[];
  reports: ActivityReport[];
  units: Unit[];
  currentUser: User;
  onAddReport: (report: ActivityReport) => void;
  onUpdateReport: (report: ActivityReport) => void;
}

// Helper to Resize Images before saving to Firestore (Max 1MB limit)
const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Max dimension 800px to ensure file size is small (~50-100KB)
                const MAX_DIM = 800; 

                if (width > height) {
                    if (width > MAX_DIM) {
                        height *= MAX_DIM / width;
                        width = MAX_DIM;
                    }
                } else {
                    if (height > MAX_DIM) {
                        width *= MAX_DIM / height;
                        height = MAX_DIM;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // 0.6 quality JPEG reduces size significantly
                    resolve(canvas.toDataURL('image/jpeg', 0.6)); 
                } else {
                    resolve(event.target?.result as string);
                }
            };
            // On error return original (fallback, though unlikely to save if huge)
            img.onerror = () => resolve(event.target?.result as string);
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export const Reports: React.FC<ReportsProps> = ({ attendance, reports, units, currentUser, onAddReport, onUpdateReport }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkedAttendanceId, setLinkedAttendanceId] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'DRAFT' | 'SUBMITTED'>('ALL');
  
  // UI States
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type: 'DRAFT' | 'SUBMITTED' | null}>({ isOpen: false, type: null });
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
  const [viewFeedback, setViewFeedback] = useState<string | null>(null); // To view feedback in list

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [unitId, setUnitId] = useState(currentUser.assignedUnitId || (units[0]?.id || ''));
  const [keywords, setKeywords] = useState('');
  const [attendanceCount, setAttendanceCount] = useState(20);
  const [generatedContent, setGeneratedContent] = useState('');
  const [title, setTitle] = useState('');
  const [images, setImages] = useState<string[]>([]); // Base64 strings
  const [processingImages, setProcessingImages] = useState(false); // New state for image processing

  const isGuru = currentUser.role === UserRole.GURU_PENASIHAT;
  
  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // --- Data Preparation ---
  const guruViewData = useMemo(() => {
    if (!isGuru || !currentUser.assignedUnitId) return [];
    
    const unitAttendance = attendance
        .filter(a => a.unitId === currentUser.assignedUnitId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return unitAttendance.map(att => {
        const report = reports.find(r => r.attendanceId === att.id);
        return {
            attendance: att,
            report: report
        };
    });
  }, [attendance, reports, currentUser.assignedUnitId, isGuru]);

  // Filtered List based on Tab Selection
  const filteredGuruList = useMemo(() => {
    return guruViewData.filter(item => {
        if (filterStatus === 'ALL') return true;
        if (filterStatus === 'PENDING') return !item.report;
        if (filterStatus === 'DRAFT') return item.report?.status === 'DRAFT' || item.report?.status === 'NEEDS_CORRECTION';
        if (filterStatus === 'SUBMITTED') return item.report?.status === 'SUBMITTED' || item.report?.status === 'VERIFIED';
        return true;
    });
  }, [guruViewData, filterStatus]);

  // Counts for Tabs
  const counts = useMemo(() => ({
      all: guruViewData.length,
      pending: guruViewData.filter(i => !i.report).length,
      // Treat NEEDS_CORRECTION as Drafts (Action required)
      draft: guruViewData.filter(i => i.report?.status === 'DRAFT' || i.report?.status === 'NEEDS_CORRECTION').length,
      submitted: guruViewData.filter(i => i.report?.status === 'SUBMITTED' || i.report?.status === 'VERIFIED').length
  }), [guruViewData]);


  const adminViewData = useMemo(() => {
     if (isGuru) return [];
     return reports
        .filter(r => r.status === 'SUBMITTED' || r.status === 'VERIFIED')
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, isGuru]);


  // --- Handlers ---

  const handleCreateFromAttendance = (att: AttendanceRecord) => {
    setEditingId(null);
    setLinkedAttendanceId(att.id);
    setDate(att.date);
    setTitle(att.activityName || '');
    setAttendanceCount(att.studentIdsPresent.length);
    setUnitId(att.unitId);
    setKeywords('');
    setGeneratedContent('');
    setImages([]);
    setIsEditing(true);
    setViewFeedback(null);
    // Scroll to top when opening editor
    window.scrollTo(0, 0);
  };

  const handleEditReport = (report: ActivityReport) => {
    setEditingId(report.id);
    setLinkedAttendanceId(report.attendanceId || null);
    setDate(report.date);
    setUnitId(report.unitId);
    setGeneratedContent(report.content);
    setTitle(report.title);
    setImages(report.images || []);
    setAttendanceCount(20); 
    
    // Show feedback if any
    if (report.feedback) {
        setViewFeedback(report.feedback);
    } else {
        setViewFeedback(null);
    }
    
    if (report.attendanceId) {
        const att = attendance.find(a => a.id === report.attendanceId);
        if (att) setAttendanceCount(att.studentIdsPresent.length);
    }

    setIsEditing(true);
    // Scroll to top when opening editor
    window.scrollTo(0, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const remainingSlots = 5 - images.length;
      
      if (files.length > remainingSlots) {
        alert(`Anda hanya boleh menambah ${remainingSlots} lagi gambar. Maksimum 5 gambar.`);
        return;
      }

      setProcessingImages(true);
      
      // Resize images sequentially to manage memory/UI
      for (const file of files) {
          try {
              const resizedDataUrl = await resizeImage(file);
              setImages(prev => [...prev, resizedDataUrl]);
          } catch (error) {
              console.error("Gagal memproses gambar", error);
              alert("Gagal memuat naik salah satu gambar.");
          }
      }
      
      setProcessingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateAI = async () => {
    if (!keywords) return;
    setLoadingAI(true);
    const unitName = units.find(u => u.id === unitId)?.name || 'Unit';
    
    const result = await generateActivityReport(keywords, unitName, date, attendanceCount);
    setGeneratedContent(result);
    setLoadingAI(false);
  };

  // 1. Triggered when user clicks button
  const initiateSave = (type: 'DRAFT' | 'SUBMITTED') => {
     if (processingImages) {
         alert("Sila tunggu sehingga gambar selesai diproses.");
         return;
     }

     // Strict validation for submission
     if (type === 'SUBMITTED') {
        if (!title.trim() || !generatedContent.trim()) {
            alert("⚠️ PERHATIAN: Laporan belum lengkap!\n\nSila pastikan TAJUK AKTIVITI dan KANDUNGAN LAPORAN telah diisi sebelum menghantar.");
            return;
        }
     } else {
        // Less strict for draft
        if (!title.trim()) {
            alert("Sila isikan sekurang-kurangnya Tajuk Aktiviti untuk menyimpan draf.");
            return;
        }
     }
    setConfirmModal({ isOpen: true, type });
  };

  // 2. Triggered when user confirms in Modal
  const executeSave = () => {
    const status = confirmModal.type;
    if (!status) return;

    // FIX: Ensure no 'undefined' values are passed to Firestore
    const reportData: ActivityReport = {
        id: editingId || `rpt_${Date.now()}`,
        date,
        unitId,
        schoolId: currentUser.schoolId,
        teacherId: currentUser.id,
        title,
        content: generatedContent,
        generatedByAI: true,
        images,
        status,
        feedback: '' // Use empty string instead of undefined to satisfy Firestore constraints
    };

    if (linkedAttendanceId) {
        reportData.attendanceId = linkedAttendanceId;
    }
    
    if (editingId) {
        onUpdateReport(reportData);
    } else {
        onAddReport(reportData);
    }
    
    setConfirmModal({ isOpen: false, type: null });
    
    // IMPORTANT: Return to list view immediately
    setIsEditing(false);
    setViewFeedback(null);
    
    // Switch filter to the saved status so user sees their item
    setFilterStatus(status === 'NEEDS_CORRECTION' ? 'DRAFT' : status);
    
    // Scroll to top so user sees the notification
    window.scrollTo(0, 0);

    // Show banner notification instead of full modal
    setNotification({
        show: true,
        message: status === 'SUBMITTED' ? 'Laporan telah berjaya dihantar.' : 'Laporan telah disimpan sebagai draf.',
        type: 'success'
    });
  };

  // --- Render Logic ---

  // === ADMIN VIEW (Not Locked, can be updated) ===
  if (!isGuru) {
      return (
        <div className="max-w-6xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Semakan Laporan Aktiviti (Paparan Admin)</h2>
            <div className="grid grid-cols-1 gap-6">
                {adminViewData.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 border-2 border-dashed rounded-xl">Tiada laporan yang disahkan setakat ini.</div>
                ) : (
                    adminViewData.map(report => {
                        const unitName = units.find(u => u.id === report.unitId)?.name || 'Unit';
                        const isVerified = report.status === 'VERIFIED';
                        return (
                            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">{report.date} • {unitName}</div>
                                        <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${isVerified ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {isVerified ? 'DISAHKAN SU' : 'DIHANTAR'}
                                    </span>
                                </div>
                                <p className="text-gray-600 line-clamp-3 mb-4">{report.content}</p>
                                {report.images && report.images.length > 0 && (
                                    <div className="flex gap-2">
                                        {report.images.map((img, i) => (
                                            <img key={i} src={img} className="w-16 h-16 object-cover rounded-lg border" alt="" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      );
  }

  // === GURU PENASIHAT VIEW (LOCKED / FINALIZED) ===
  return (
    <div className="max-w-6xl mx-auto pb-12">
        
        {/* --- CONFIRMATION MODAL --- */}
        {confirmModal.isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-100 transition-all">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmModal.type === 'SUBMITTED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {confirmModal.type === 'SUBMITTED' ? <Send size={32} /> : <Save size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {confirmModal.type === 'SUBMITTED' ? 'Hantar Laporan?' : 'Simpan Draf?'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {confirmModal.type === 'SUBMITTED' 
                                ? 'Adakah anda pasti mahu menghantar laporan ini? Status akan bertukar kepada TELAH DIHANTAR.' 
                                : 'Laporan akan disimpan dengan label DRAF dan boleh disunting semula kemudian.'}
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setConfirmModal({isOpen: false, type: null})}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={executeSave}
                                className={`flex-1 px-4 py-2 rounded-lg text-white font-bold shadow-md ${confirmModal.type === 'SUBMITTED' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                            >
                                {confirmModal.type === 'SUBMITTED' ? 'Ya, Hantar' : 'Ya, Setuju'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isEditing ? (
            /* --- EDITOR VIEW --- */
            <div className="relative max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {editingId ? 'Semak & Kemaskini Laporan' : 'Lengkapkan Laporan Aktiviti'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Maklumat asas telah diambil dari rekod kehadiran. Sila lengkapkan laporan.
                        </p>
                    </div>
                    <button onClick={() => { setIsEditing(false); setViewFeedback(null); }} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* SHOW FEEDBACK ALERT IF EXISTS */}
                {viewFeedback && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex gap-4 animate-pulse">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg h-fit">
                            <MessageSquareWarning size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-red-700 text-sm uppercase">Teguran Pembetulan daripada SU:</h4>
                            <p className="text-red-900 mt-1 font-medium">"{viewFeedback}"</p>
                            <p className="text-xs text-red-500 mt-2">Sila buat pembetulan pada laporan di bawah dan tekan 'Hantar Laporan' semula.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Locked / Pre-filled Info */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Tajuk Aktiviti (Dari Kehadiran)</label>
                            <div className="font-bold text-gray-800 text-lg">{title}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Butiran Sesi</label>
                            <div className="flex gap-4 text-sm font-medium text-gray-700">
                                <span className="flex items-center gap-1"><Calendar size={16}/> {date}</span>
                                <span className="flex items-center gap-1"><CheckCircle2 size={16}/> {attendanceCount} Hadir</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Helper Section */}
                    {!generatedContent && (
                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Bot className="text-purple-600" />
                                <h3 className="font-bold text-purple-900">Bantuan AI (Penjana Laporan)</h3>
                            </div>
                            <label className="block text-sm font-medium text-purple-800 mb-2">Masukkan kata kunci aktiviti (Cth: tempat, aktiviti utama, pencapaian)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={keywords} 
                                    onChange={e => setKeywords(e.target.value)} 
                                    className="flex-1 p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                    placeholder="Cth: Latihan kawad kaki, padang sekolah, persediaan hari sukan..."
                                />
                                <button 
                                    onClick={handleGenerateAI}
                                    disabled={loadingAI || !keywords}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                                >
                                    {loadingAI ? <Loader2 className="animate-spin" size={18}/> : "Jana Laporan"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content Editor */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between">
                            <span>Isi Kandungan Laporan</span>
                            <span className="text-xs font-normal text-gray-500">Boleh disunting secara manual</span>
                        </label>
                        <textarea 
                            value={generatedContent}
                            onChange={e => setGeneratedContent(e.target.value)}
                            className="w-full h-80 p-5 border border-gray-300 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-sm"
                            placeholder="Kandungan laporan akan dipaparkan di sini. Anda boleh menulis sendiri atau menggunakan bantuan AI di atas."
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div className="border-t border-gray-100 pt-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span>Lampiran Gambar Aktiviti</span>
                                <HelpCircle size={14} className="text-gray-400" title="Klik Muat Naik untuk membuka Galeri atau Kamera peranti" />
                            </div>
                            <div className="flex items-center gap-2">
                                {processingImages && (
                                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1 animate-pulse">
                                        <Loader2 size={12} className="animate-spin"/> Memproses...
                                    </span>
                                )}
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{images.length} / 5</span>
                            </div>
                        </label>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                                    <img src={img} alt={`Lampiran ${idx}`} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg transform scale-90 group-hover:scale-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            
                            {images.length < 5 && (
                                <label className={`border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 hover:border-blue-500 transition-all aspect-square group relative overflow-hidden ${processingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                        <div className="p-3 bg-white rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                            {processingImages ? <Loader2 className="animate-spin text-blue-500"/> : <ImageIcon className="text-blue-500" />}
                                        </div>
                                        <span className="text-xs text-blue-600 font-bold group-hover:underline">{processingImages ? 'Sabar..' : 'Muat Naik'}</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        multiple 
                                        onChange={handleImageUpload} 
                                        disabled={processingImages}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                        <button 
                            onClick={() => initiateSave('DRAFT')}
                            disabled={processingImages}
                            className="px-6 py-3 rounded-lg border border-yellow-400 bg-yellow-50 text-yellow-700 font-bold hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            <Save size={18} /> Simpan Draf
                        </button>
                        <button 
                            onClick={() => initiateSave('SUBMITTED')}
                            disabled={processingImages}
                            className="px-6 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
                        >
                            <Send size={18} /> Hantar Laporan
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            /* --- LIST VIEW --- */
            <div>
                {/* Notification Banner */}
                {notification.show && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <p className="font-medium">{notification.message}</p>
                        <button onClick={() => setNotification(prev => ({...prev, show: false}))} className="ml-auto text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Pengurusan Laporan</h2>
                    <p className="text-gray-500 text-sm">Urus, semak status dan hantar laporan aktiviti kokurikulum.</p>
                </div>

                {/* --- STATUS TABS / FILTER --- */}
                <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${filterStatus === 'ALL' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Filter size={16} /> Semua <span className="bg-gray-200/20 px-1.5 rounded text-xs">{counts.all}</span>
                    </button>
                    <button 
                        onClick={() => setFilterStatus('PENDING')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${filterStatus === 'PENDING' ? 'bg-red-500 text-white shadow-md' : 'text-gray-600 hover:bg-red-50'}`}
                    >
                        <AlertCircle size={16} /> Perlu Dibuat <span className="bg-white/20 px-1.5 rounded text-xs">{counts.pending}</span>
                    </button>
                    <button 
                        onClick={() => setFilterStatus('DRAFT')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${filterStatus === 'DRAFT' ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-600 hover:bg-yellow-50'}`}
                    >
                        <Edit size={16} /> Draf / Pembetulan <span className="bg-white/20 px-1.5 rounded text-xs">{counts.draft}</span>
                    </button>
                    <button 
                        onClick={() => setFilterStatus('SUBMITTED')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${filterStatus === 'SUBMITTED' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-green-50'}`}
                    >
                        <CheckCircle2 size={16} /> Telah Dihantar <span className="bg-white/20 px-1.5 rounded text-xs">{counts.submitted}</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {filteredGuruList.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                {filterStatus === 'ALL' ? <Calendar /> : filterStatus === 'DRAFT' ? <Edit /> : <CheckCircle2 />}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Tiada Rekod Dijumpai</h3>
                            <p className="text-gray-500 mt-1">
                                {filterStatus === 'ALL' && "Tiada aktiviti direkodkan lagi. Sila rekod kehadiran dahulu."}
                                {filterStatus === 'PENDING' && "Syabas! Semua laporan kehadiran telah diselesaikan."}
                                {filterStatus === 'DRAFT' && "Tiada laporan dalam simpanan draf."}
                                {filterStatus === 'SUBMITTED' && "Belum ada laporan yang dihantar."}
                            </p>
                        </div>
                    ) : (
                        filteredGuruList.map(({ attendance, report }) => {
                            const isVerified = report && report.status === 'VERIFIED';
                            const isDone = report && (report.status === 'SUBMITTED' || isVerified);
                            const isCorrection = report && report.status === 'NEEDS_CORRECTION';
                            const isDraft = report && report.status === 'DRAFT';
                            const isPending = !report;

                            return (
                                <div key={attendance.id} className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden 
                                    ${isPending ? 'border-l-4 border-l-red-500' : 
                                      isCorrection ? 'border-l-4 border-l-red-600 ring-1 ring-red-200' :
                                      isDraft ? 'border-l-4 border-l-yellow-400' : 
                                      'border-l-4 border-l-green-500'}`}>
                                    
                                    {/* Alert Header for Correction */}
                                    {isCorrection && (
                                        <div className="bg-red-50 px-6 py-2 border-b border-red-100 flex items-center gap-2 text-xs font-bold text-red-600">
                                            <AlertCircle size={14} /> PERLU PEMBETULAN: Lihat ulasan SU
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col md:flex-row gap-6">
                                        {/* Date Box */}
                                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 min-w-[100px] border border-gray-100">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Tarikh</span>
                                            <span className="text-xl font-bold text-gray-900">{new Date(attendance.date).getDate()}</span>
                                            <span className="text-xs font-medium text-gray-500 uppercase">{new Date(attendance.date).toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">{attendance.activityName || "Aktiviti Tanpa Nama"}</h3>
                                                
                                                {/* Mobile visible status badge */}
                                                <div className="md:hidden mb-2">
                                                    {isDraft && <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">DRAF</span>}
                                                    {isCorrection && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">PEMBETULAN</span>}
                                                    {isDone && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">DIHANTAR</span>}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                                <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded">
                                                    <CheckCircle2 size={16} className="text-blue-500"/>
                                                    {attendance.studentIdsPresent.length} Murid Hadir
                                                </span>
                                                {report && report.generatedByAI && (
                                                    <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                                                        <Bot size={16} /> AI Generated
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Area */}
                                            <div className="flex items-center gap-3">
                                                {isPending && (
                                                    <div className="flex items-center gap-4 w-full justify-between">
                                                        <span className="text-red-600 text-sm font-medium flex items-center gap-1">
                                                            <AlertCircle size={16} /> Laporan Belum Dibuat
                                                        </span>
                                                        <button 
                                                            onClick={() => handleCreateFromAttendance(attendance)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                                                        >
                                                            <FileText size={16} /> Tulis Laporan
                                                        </button>
                                                    </div>
                                                )}

                                                {(isDraft || isCorrection) && (
                                                     <div className="flex items-center gap-4 w-full justify-between">
                                                        <div className="flex items-center gap-2 hidden md:flex">
                                                            {isCorrection ? (
                                                                <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200 animate-pulse">
                                                                    PERLU PEMBETULAN
                                                                </span>
                                                            ) : (
                                                                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">
                                                                    DRAF
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12}/> Disimpan</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleEditReport(report)}
                                                            className={`border text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2 
                                                                ${isCorrection ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 'bg-white border-gray-300'}
                                                            `}
                                                        >
                                                            <Edit size={16} /> {isCorrection ? 'Baiki Laporan' : 'Sambung Edit'}
                                                        </button>
                                                    </div>
                                                )}

                                                {isDone && (
                                                    <div className="flex items-center gap-4 w-full justify-between">
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 hidden md:flex
                                                            ${isVerified ? 'bg-green-200 text-green-900 border-green-300' : 'bg-green-100 text-green-800 border-green-200'}
                                                        `}>
                                                            <CheckCircle2 size={14} /> {isVerified ? 'DISAHKAN OLEH SU' : 'TELAH DIHANTAR'}
                                                        </span>
                                                        <div className="flex -space-x-2 items-center">
                                                            {report.images && report.images.slice(0,3).map((img, i) => (
                                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                                                </div>
                                                            ))}
                                                            <div className="ml-2">
                                                                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full cursor-default">
                                                                    <Lock size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}
    </div>
  );
};