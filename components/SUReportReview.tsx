import React, { useState, useMemo } from 'react';
import { ActivityReport, Unit, User } from '../types';
import { FileText, CheckCircle2, AlertCircle, MessageSquare, X, ChevronRight, Calendar, User as UserIcon, Send, HelpCircle } from 'lucide-react';

interface SUReportReviewProps {
    reports: ActivityReport[];
    units: Unit[];
    users: User[]; // To get teacher names
    onUpdateReport: (report: ActivityReport) => void;
}

export const SUReportReview: React.FC<SUReportReviewProps> = ({ reports, units, users, onUpdateReport }) => {
    const [selectedReport, setSelectedReport] = useState<ActivityReport | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [actionState, setActionState] = useState<'VIEW' | 'REJECTING'>('VIEW');
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('PENDING');
    
    // Modal State
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

    // Statistics
    const stats = useMemo(() => {
        return {
            total: reports.length,
            submitted: reports.filter(r => r.status === 'SUBMITTED').length,
            correction: reports.filter(r => r.status === 'NEEDS_CORRECTION').length,
            verified: reports.filter(r => r.status === 'VERIFIED').length,
        };
    }, [reports]);

    // Filter reports list
    const reviewList = useMemo(() => {
        return reports.filter(r => {
            if (filter === 'PENDING') return r.status === 'SUBMITTED' || r.status === 'NEEDS_CORRECTION';
            if (filter === 'VERIFIED') return r.status === 'VERIFIED';
            return r.status !== 'DRAFT'; 
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reports, filter]);

    const handleOpenReport = (report: ActivityReport) => {
        setSelectedReport(report);
        setActionState('VIEW');
        setFeedbackText(report.feedback || '');
    };

    // Trigger Modal
    const initiateVerify = () => {
        if (!selectedReport) return;
        setIsVerifyModalOpen(true);
    };

    // Execute Logic
    const confirmVerify = () => {
        if (!selectedReport) return;
        
        const updated: ActivityReport = { 
            ...selectedReport, 
            status: 'VERIFIED', 
            feedback: '' // Clear feedback
        };
        
        onUpdateReport(updated);
        setIsVerifyModalOpen(false);
        setSelectedReport(null); // Return to list
    };

    const handleRejectClick = () => {
        setActionState('REJECTING');
        setFeedbackText('');
    };

    const submitRejection = () => {
        if (!selectedReport) return;
        if (!feedbackText.trim()) {
            alert("Sila masukkan ulasan pembetulan.");
            return;
        }
        
        const updated: ActivityReport = { 
            ...selectedReport, 
            status: 'NEEDS_CORRECTION', 
            feedback: feedbackText 
        };
        onUpdateReport(updated);
        setSelectedReport(null);
    };

    const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'Unit Tidak Diketahui';
    const getTeacherName = (id: string) => users.find(u => u.id === id)?.name || 'Guru';

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 relative">
            
            {/* --- VERIFICATION MODAL --- */}
            {isVerifyModalOpen && selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 transform scale-100 transition-all">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <Send size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Sahkan & Hantar ke PK?</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                Adakah anda pasti laporan <b>"{selectedReport.title}"</b> ini lengkap?
                                <br/><br/>
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                    Status akan bertukar kepada <b>VERIFIED</b> dan akan muncul di Dashboard PK Kokurikulum.
                                </span>
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setIsVerifyModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmVerify}
                                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    Ya, Sahkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Laporan & Analisis Aktiviti
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Uruskan semakan laporan dan pantau status penghantaran.</p>
                </div>
                
                {/* Mini Stats Dashboard */}
                <div className="flex gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><AlertCircle size={16} /></div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Perlu Semakan</p>
                            <p className="text-lg font-bold text-gray-800">{stats.submitted}</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                         <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full"><MessageSquare size={16} /></div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Dalam Pembetulan</p>
                            <p className="text-lg font-bold text-gray-800">{stats.correction}</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-full"><CheckCircle2 size={16} /></div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Disahkan</p>
                            <p className="text-lg font-bold text-gray-800">{stats.verified}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <button 
                    onClick={() => setFilter('PENDING')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${filter === 'PENDING' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                    <AlertCircle size={16} /> Perlu Tindakan
                    {(stats.submitted + stats.correction) > 0 && <span className="bg-white/20 px-1.5 rounded text-xs">{stats.submitted + stats.correction}</span>}
                </button>
                <button 
                    onClick={() => setFilter('VERIFIED')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${filter === 'VERIFIED' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                    <CheckCircle2 size={16} /> Telah Disahkan
                    {stats.verified > 0 && <span className="bg-white/20 px-1.5 rounded text-xs">{stats.verified}</span>}
                </button>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                {/* Left: Scrollable List */}
                <div className="space-y-4 overflow-y-auto pr-2 h-full">
                    {reviewList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>Tiada laporan dalam kategori ini.</p>
                        </div>
                    ) : (
                        reviewList.map(report => (
                            <div 
                                key={report.id}
                                onClick={() => handleOpenReport(report)}
                                className={`bg-white p-5 rounded-xl border cursor-pointer transition-all hover:shadow-md flex items-center justify-between group
                                    ${selectedReport?.id === report.id ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300'}
                                `}
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                                            ${report.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 
                                              report.status === 'NEEDS_CORRECTION' ? 'bg-red-100 text-red-700' : 
                                              'bg-green-100 text-green-700'}
                                        `}>
                                            {report.status === 'NEEDS_CORRECTION' ? 'Menunggu Pembetulan' : report.status === 'VERIFIED' ? 'Selesai' : 'Baru'}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                            <Calendar size={10} /> {report.date}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{report.title}</h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <UserIcon size={10} /> {getTeacherName(report.teacherId)} • {getUnitName(report.unitId)}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-full ${selectedReport?.id === report.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300 group-hover:text-blue-500'}`}>
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right: Sticky Detail View */}
                <div className="relative h-full">
                    {selectedReport ? (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Card Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 leading-snug">{selectedReport.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200"><Calendar size={14}/> {selectedReport.date}</span>
                                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200"><UserIcon size={14}/> {getTeacherName(selectedReport.teacherId)}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Card Body - Scrollable */}
                            <div className="p-6 overflow-y-auto flex-1 bg-white">
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kandungan Laporan</label>
                                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        {selectedReport.content}
                                    </div>
                                </div>

                                {selectedReport.images && selectedReport.images.length > 0 && (
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lampiran Gambar ({selectedReport.images.length})</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedReport.images.map((img, i) => (
                                                <img key={i} src={img} className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:opacity-90 cursor-zoom-in" alt="Lampiran" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedReport.status === 'NEEDS_CORRECTION' && (
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                                        <p className="text-xs font-bold text-red-600 uppercase mb-1 flex items-center gap-1"><MessageSquare size={12}/> Teguran Terkini:</p>
                                        <p className="text-sm text-red-800 italic">"{selectedReport.feedback}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer - Actions */}
                            {selectedReport.status === 'SUBMITTED' && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
                                    {actionState === 'VIEW' ? (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleRejectClick}
                                                className="flex-1 py-3 border border-red-300 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare size={18} /> Minta Pembetulan
                                            </button>
                                            <button 
                                                onClick={initiateVerify}
                                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-md transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={18} /> Sahkan & Hantar PK
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-bottom-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Ulasan Pembetulan kepada Guru:</label>
                                            <textarea 
                                                value={feedbackText}
                                                onChange={e => setFeedbackText(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm mb-3 shadow-inner"
                                                rows={3}
                                                placeholder="Sila nyatakan bahagian yang perlu dibetulkan (cth: Gambar tidak jelas, laporan terlalu ringkas)..."
                                                autoFocus
                                            />
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => setActionState('VIEW')}
                                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    Batal
                                                </button>
                                                <button 
                                                    onClick={submitRejection}
                                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors"
                                                >
                                                    Hantar Teguran
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {selectedReport.status === 'VERIFIED' && (
                                <div className="p-4 bg-green-50 border-t border-green-200 text-center shrink-0">
                                    <p className="text-green-700 font-bold flex items-center justify-center gap-2">
                                        <CheckCircle2 size={18} /> Laporan telah disahkan dan dihantar ke PK
                                    </p>
                                </div>
                            )}

                             {selectedReport.status === 'NEEDS_CORRECTION' && (
                                <div className="p-4 bg-yellow-50 border-t border-yellow-200 text-center shrink-0">
                                    <p className="text-yellow-800 font-bold flex items-center justify-center gap-2">
                                        <AlertCircle size={18} /> Menunggu guru membuat pembetulan
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Pilih laporan dari senarai untuk semakan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};