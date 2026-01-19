import React, { useState, useEffect } from 'react';
import { Unit, User, Student, ActivityReport, AttendanceRecord, UnitCategory, UserRole, Announcement, Achievement } from '../types'; 
import { 
    LayoutDashboard, Users, Briefcase, FileText, CheckSquare, Printer, 
    Trophy, TrendingUp, CheckCircle2, Calendar, Search, Filter, Download, ChevronRight, AlertCircle, X, MessageSquare, Save, Eye, Loader2, School, FileSpreadsheet, FileBarChart, HardDrive
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

// --- SHARED PROPS INTERFACE ---
interface PKProps {
    units: Unit[];
    users: User[];
    students: Student[];
    reports: ActivityReport[];
    attendance: AttendanceRecord[];
    achievements?: Achievement[]; // Added achievements
    onChangeView?: (view: string) => void;
    onUpdateReport?: (report: ActivityReport) => void; 
    // New Props for Notices
    announcements?: Announcement[];
    onAddAnnouncement?: (ann: Announcement) => void;
    onUpdateAnnouncement?: (ann: Announcement) => void;
    onDeleteAnnouncement?: (id: string) => void;
    schoolId?: string;
}

// 1. DASHBOARD RINGKASAN & NAVIGATION HUB
export const PKSummary: React.FC<PKProps> = ({ units, users, students, reports, attendance, onChangeView }) => {
    const teachers = users.filter(u => u.role === UserRole.GURU_PENASIHAT);
    const verifiedReportsCount = reports.filter(r => r.status === 'VERIFIED').length;
    
    const schoolName = users[0]?.schoolName || "Sekolah";
    const schoolId = users[0]?.schoolId || "";

    const verifiedActivityItems = attendance.filter(att => {
        const relatedReport = reports.find(r => r.attendanceId === att.id);
        return relatedReport && relatedReport.status === 'VERIFIED';
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const stats = [
        { label: 'Jumlah Unit', value: units.length, icon: Briefcase, color: 'bg-blue-600' },
        { label: 'Guru Penasihat', value: teachers.length, icon: Users, color: 'bg-purple-600' },
        { label: 'Jumlah Murid', value: students.length, icon: Trophy, color: 'bg-orange-600' },
        { label: 'Laporan Disahkan', value: verifiedReportsCount, icon: TrendingUp, color: 'bg-green-600' },
    ];

    const quickMenu = [
        { 
            id: 'pk_units', 
            title: 'Unit Kokurikulum', 
            desc: 'Senarai Badan Beruniform, Kelab & Sukan', 
            icon: Briefcase, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50',
            border: 'hover:border-blue-300'
        },
        { 
            id: 'pk_teachers', 
            title: 'Guru Penasihat', 
            desc: 'Senarai guru & lantikan unit', 
            icon: Users, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50',
            border: 'hover:border-purple-300'
        },
        { 
            id: 'pk_activities', 
            title: 'Aktiviti & Laporan', 
            desc: 'Pantau aktiviti yang disahkan', 
            icon: FileText, 
            color: 'text-orange-600', 
            bg: 'bg-orange-50',
            border: 'hover:border-orange-300'
        },
        { 
            id: 'pk_validation', 
            title: 'Semakan Laporan', 
            desc: 'Semak & beri amaran pembetulan', 
            icon: CheckSquare, 
            color: 'text-green-600', 
            bg: 'bg-green-50',
            border: 'hover:border-green-300'
        },
        { 
            id: 'pk_print', 
            title: 'Cetakan / Laporan', 
            desc: 'Muat turun data & laporan', 
            icon: Printer, 
            color: 'text-gray-600', 
            bg: 'bg-gray-50',
            border: 'hover:border-gray-300'
        },
    ];

    const categoryData = [
        { name: 'Unit Beruniform', value: units.filter(u => u.category === UnitCategory.BADAN_BERUNIFORM).length, color: '#3b82f6' },
        { name: 'Kelab & Persatuan', value: units.filter(u => u.category === UnitCategory.KELAB_PERSATUAN).length, color: '#8b5cf6' },
        { name: 'Sukan & Permainan', value: units.filter(u => u.category === UnitCategory.SUKAN_PERMAINAN).length, color: '#f97316' },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* SCHOOL HEADER BANNER */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <School size={150} />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{schoolName}</h1>
                    <div className="flex items-center gap-3">
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg font-mono text-sm md:text-base font-bold border border-white/10 shadow-sm">
                            KOD: {schoolId}
                        </span>
                        <span className="text-blue-200 text-sm font-medium border-l border-blue-700 pl-3">
                            Panel Penolong Kanan Kokurikulum
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Utama</h2>
                <p className="text-gray-500 mt-1">Pusat kawalan data kokurikulum sekolah. Data disegerakkan secara automatik.</p>
            </div>

            {/* SECTION 1: RINGKASAN KESELURUHAN (STATS) */}
            <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <LayoutDashboard size={20} className="text-blue-600"/> Ringkasan Data Semasa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className={`p-4 rounded-xl text-white shadow-lg ${stat.color} bg-gradient-to-br from-white/20 to-transparent`}>
                                <stat.icon size={28} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
                                <p className="text-3xl font-extrabold text-gray-800">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 2: MENU PANTAS / NAVIGASI UTAMA */}
            <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-blue-600"/> Pengurusan Utama
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {quickMenu.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => onChangeView && onChangeView(item.id)}
                            className={`flex flex-col items-start p-5 rounded-xl border border-gray-200 bg-white shadow-sm transition-all group ${item.border} hover:-translate-y-1 hover:shadow-md`}
                        >
                            <div className={`p-3 rounded-lg mb-3 ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                                <item.icon size={24} />
                            </div>
                            <h4 className="font-bold text-gray-800 mb-1 text-left">{item.title}</h4>
                            <p className="text-xs text-gray-500 text-left leading-relaxed">{item.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* SECTION 3: ANALISIS & AKTIVITI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Carta Pecahan Unit */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Pecahan Kategori Unit</h3>
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={categoryData} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-gray-800">{units.length}</span>
                            <span className="text-xs text-gray-500 uppercase font-bold">Total Unit</span>
                        </div>
                    </div>
                </div>

                {/* Senarai Aktiviti Terkini - FILTERED ONLY VERIFIED */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Laporan Aktiviti Terkini (Disahkan)</h3>
                        <button 
                            onClick={() => onChangeView && onChangeView('pk_activities')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            Lihat Semua <ChevronRight size={14} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2">
                        {verifiedActivityItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <CheckCircle2 size={32} className="mb-2 opacity-50"/>
                                <p className="text-sm">Tiada laporan yang disahkan setakat ini.</p>
                            </div>
                        ) : (
                            verifiedActivityItems.slice(0, 5).map((att, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-green-50/50 hover:border-green-100 transition-colors">
                                    <div className="bg-white border border-gray-200 text-gray-700 p-3 rounded-lg font-bold text-xs flex flex-col items-center min-w-[60px] shadow-sm">
                                        <span className="text-xl">{new Date(att.date).getDate()}</span>
                                        <span className="uppercase text-[10px]">{new Date(att.date).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{att.activityName || 'Aktiviti Tanpa Tajuk'}</h4>
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                                Disahkan
                                            </span>
                                        </div>
                                        <p className="text-xs text-blue-600 font-medium mt-1">{units.find(u => u.id === att.unitId)?.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">Hadir: {att.studentIdsPresent.length} orang</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... (PKUnits, PKTeachers, PKActivities, PKValidation remain unchanged) ...
export const PKUnits: React.FC<PKProps> = ({ units, students }) => {
    // ... code ...
    const categories = [
        { id: UnitCategory.BADAN_BERUNIFORM, label: 'Badan Beruniform', color: 'bg-blue-600' },
        { id: UnitCategory.KELAB_PERSATUAN, label: 'Kelab & Persatuan', color: 'bg-purple-600' },
        { id: UnitCategory.SUKAN_PERMAINAN, label: 'Sukan & Permainan', color: 'bg-orange-600' },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Senarai Unit Kokurikulum</h2>
                <p className="text-gray-500">Paparan semua unit dan bilangan keahlian terkini hasil import data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {categories.map(cat => (
                    <div key={cat.id} className="space-y-4">
                        <div className={`p-4 rounded-xl shadow-sm text-white ${cat.color} flex items-center justify-between`}>
                            <h3 className="font-bold text-lg">{cat.label}</h3>
                            <Briefcase size={20} className="opacity-80" />
                        </div>
                        <div className="space-y-3">
                            {units.filter(u => u.category === cat.id).map(unit => {
                                const count = students.filter(s => s.unitId === unit.id).length;
                                return (
                                    <div key={unit.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                        <span className="font-medium text-gray-700">{unit.name}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-500'}`}>
                                            {count} Murid
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PKTeachers: React.FC<PKProps> = ({ users, units }) => {
    // ... code ...
    const teachers = users.filter(u => u.role === UserRole.GURU_PENASIHAT);
    const [search, setSearch] = useState('');

    const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Senarai Guru Penasihat</h2>
                    <p className="text-gray-500">Direktori guru dan unit yang dipertanggungjawabkan.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cari nama guru..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Nama Guru</th>
                            <th className="px-6 py-4">Unit Dipegang</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-400">Tiada guru dijumpai.</td></tr>
                        ) : (
                            filtered.map((teacher, i) => {
                                const unit = units.find(u => u.id === teacher.assignedUnitId);
                                return (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-800">{teacher.name}</td>
                                        <td className="px-6 py-4 text-blue-600 font-medium">
                                            {unit ? unit.name : <span className="text-red-400 italic">Tiada Unit</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                                <CheckCircle2 size={12} /> Aktif
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const PKActivities: React.FC<PKProps> = ({ reports, units }) => {
    // ... code ...
    // Show ONLY VERIFIED reports
    const verifiedReports = reports.filter(r => r.status === 'VERIFIED').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Aktiviti & Laporan</h2>
                <p className="text-gray-500">Senarai laporan aktiviti yang telah <b>disahkan</b> oleh Setiausaha Kokurikulum.</p>
            </div>

            <div className="space-y-4">
                {verifiedReports.length === 0 ? (
                    <div className="p-12 bg-white rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-500">
                        <FileText size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Tiada laporan yang disahkan lagi.</p>
                        <p className="text-xs mt-1">Laporan perlu disemak oleh SU sebelum muncul di sini.</p>
                    </div>
                ) : (
                    verifiedReports.map(report => {
                        const unit = units.find(u => u.id === report.unitId);
                        return (
                            <div key={report.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6">
                                <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg min-w-[100px] border border-green-100">
                                    <Calendar size={20} className="text-green-600 mb-1" />
                                    <span className="font-bold text-gray-800">{new Date(report.date).getDate()}</span>
                                    <span className="text-xs uppercase font-bold text-gray-500">{new Date(report.date).toLocaleString('default', { month: 'short' })}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle2 size={12} /> DISAHKAN SU
                                        </span>
                                    </div>
                                    <p className="text-sm text-blue-600 font-medium mb-3">{unit?.name}</p>
                                    <p className="text-gray-600 text-sm line-clamp-2">{report.content}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export const PKValidation: React.FC<PKProps> = ({ reports, units, onUpdateReport }) => {
    // ... code ...
    // Show ONLY VERIFIED reports (Ready for PK Validation/Review)
    const verifiedReports = reports.filter(r => r.status === 'VERIFIED');
    
    // UI State
    const [selectedReport, setSelectedReport] = useState<ActivityReport | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [notification, setNotification] = useState<{show: boolean, message: string}>({show: false, message: ''});

    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => setNotification({show: false, message: ''}), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification.show]);

    const handleOpenReport = (report: ActivityReport) => {
        setSelectedReport(report);
        setIsRejecting(false);
        setFeedback('');
        setIsProcessing(false);
    };

    const handleReject = () => {
        if (!feedback.trim()) {
            alert("Sila masukkan sebab pembetulan.");
            return;
        }
        
        setIsProcessing(true); 

        setTimeout(() => {
            if (selectedReport && onUpdateReport) {
                onUpdateReport({
                    ...selectedReport,
                    status: 'NEEDS_CORRECTION',
                    feedback: `[Arahan PK] ${feedback}`
                });
                setSelectedReport(null);
                setNotification({ show: true, message: 'Arahan pembetulan telah dihantar kepada SU.' });
            }
            setIsProcessing(false);
        }, 600);
    };

    const handleApprove = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setSelectedReport(null); 
            setNotification({ show: true, message: 'Semakan selesai. Laporan diterima.' });
            setIsProcessing(false);
        }, 400);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto relative">
             {notification.show && (
                 <div className="fixed top-20 right-4 z-[150] bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                     <CheckCircle2 size={20} className="text-green-600" />
                     <span className="font-bold text-sm">{notification.message}</span>
                 </div>
             )}

             <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Semakan Laporan</h2>
                <p className="text-gray-500">Laporan disahkan oleh SU sedia untuk semakan akhir.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Tarikh</th>
                            <th className="px-6 py-4">Unit</th>
                            <th className="px-6 py-4">Aktiviti</th>
                            <th className="px-6 py-4 text-center">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {verifiedReports.map(report => {
                            const unit = units.find(u => u.id === report.unitId);
                            return (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{report.date}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{unit?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 line-clamp-1">{report.title}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleOpenReport(report)}
                                            className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 mx-auto"
                                        >
                                            <Eye size={16} /> Semak
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {verifiedReports.length === 0 && (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">Tiada laporan menunggu semakan PK.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Disahkan SU
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedReport.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedReport.date} • {units.find(u => u.id === selectedReport.unitId)?.name}
                                </p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kandungan Laporan</label>
                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    {selectedReport.content}
                                </div>
                            </div>

                            {selectedReport.images && selectedReport.images.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lampiran Gambar</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedReport.images.map((img, i) => (
                                            <img key={i} src={img} className="w-full h-24 object-cover rounded-lg border border-gray-200" alt="Lampiran" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isRejecting && (
                                <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                                        <AlertCircle size={16} /> Arahan Pembetulan kepada SU/Guru:
                                    </label>
                                    <textarea 
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-white"
                                        rows={3}
                                        placeholder="Nyatakan kesalahan atau maklumat yang perlu diperbetulkan..."
                                        autoFocus
                                    />
                                    <div className="flex gap-3 mt-3 justify-end">
                                        <button 
                                            onClick={() => setIsRejecting(false)}
                                            disabled={isProcessing}
                                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-50"
                                        >
                                            Batal
                                        </button>
                                        <button 
                                            onClick={handleReject}
                                            disabled={isProcessing}
                                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm flex items-center gap-2 disabled:opacity-70"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : null}
                                            Hantar Amaran
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isRejecting && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                <button 
                                    onClick={() => setIsRejecting(true)}
                                    className="px-5 py-2.5 rounded-lg border border-red-300 text-red-600 bg-white font-bold hover:bg-red-50 text-sm flex items-center gap-2 transition-colors"
                                >
                                    <MessageSquare size={18} /> Minta Pembetulan
                                </button>
                                <button 
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                    className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 text-sm flex items-center gap-2 transition-colors disabled:opacity-70"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <CheckSquare size={18} />}
                                    Terima & Tutup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const PKPrint: React.FC<PKProps> = ({ units, students, reports, attendance, achievements, users }) => {
    
    // Type for Report Cards
    type ReportType = 'MEMBERSHIP' | 'ACTIVITY' | 'ATTENDANCE' | 'ACHIEVEMENT';
    
    const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- HELPER TO GET UNIT NAME ---
    const getUnitName = (id: string) => units.find(u => u.id === id)?.name || id;

    // --- GENERATION LOGIC ---
    const handleDownload = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const wb = XLSX.utils.book_new();
            let fileName = 'Laporan_KokuLite.xlsx';

            try {
                if (selectedReportType === 'MEMBERSHIP') {
                    // Data: All Students
                    const data = students.map((s, i) => ({
                        'Bil': i + 1,
                        'Nama Murid': s.name,
                        'Kelas': s.class,
                        'Unit Kokurikulum': getUnitName(s.unitId),
                        'Jawatan': s.position || 'Ahli Biasa'
                    }));
                    const ws = XLSX.utils.json_to_sheet(data);
                    // Auto width approximation
                    ws['!cols'] = [{wch: 5}, {wch: 30}, {wch: 15}, {wch: 25}, {wch: 20}];
                    XLSX.utils.book_append_sheet(wb, ws, "Keahlian");
                    fileName = `Laporan_Keahlian_${new Date().toISOString().split('T')[0]}.xlsx`;

                } else if (selectedReportType === 'ACTIVITY') {
                    // Data: Verified Reports
                    const verified = reports.filter(r => r.status === 'VERIFIED');
                    const data = verified.map((r, i) => ({
                        'Bil': i + 1,
                        'Tarikh': r.date,
                        'Unit': getUnitName(r.unitId),
                        'Tajuk Aktiviti': r.title,
                        'Kandungan Laporan': r.content.replace(/\n/g, ' '), // Remove newlines for excel
                        'Guru Bertugas': users.find(u => u.id === r.teacherId)?.name || r.teacherId
                    }));
                    const ws = XLSX.utils.json_to_sheet(data);
                    ws['!cols'] = [{wch: 5}, {wch: 15}, {wch: 25}, {wch: 30}, {wch: 50}, {wch: 25}];
                    XLSX.utils.book_append_sheet(wb, ws, "Laporan Aktiviti");
                    fileName = `Laporan_Aktiviti_Mingguan_${new Date().toISOString().split('T')[0]}.xlsx`;

                } else if (selectedReportType === 'ATTENDANCE') {
                    // Data: Attendance Stats per Unit
                    const data = units.map((u, i) => {
                        const unitAtt = attendance.filter(a => a.unitId === u.id);
                        const totalSessions = unitAtt.length;
                        // Calculate Average Attendance %
                        let totalPerc = 0;
                        unitAtt.forEach(a => {
                            totalPerc += (a.studentIdsPresent.length / (a.totalStudents || 1)) * 100;
                        });
                        const avgPerc = totalSessions > 0 ? (totalPerc / totalSessions).toFixed(1) : '0';

                        return {
                            'Bil': i + 1,
                            'Nama Unit': u.name,
                            'Kategori': u.category,
                            'Bil. Sesi': totalSessions,
                            'Purata Kehadiran (%)': avgPerc + '%'
                        };
                    });
                    const ws = XLSX.utils.json_to_sheet(data);
                    ws['!cols'] = [{wch: 5}, {wch: 25}, {wch: 20}, {wch: 10}, {wch: 20}];
                    XLSX.utils.book_append_sheet(wb, ws, "Analisis Kehadiran");
                    fileName = `Analisis_Kehadiran_${new Date().toISOString().split('T')[0]}.xlsx`;

                } else if (selectedReportType === 'ACHIEVEMENT') {
                    // Data: Achievements
                    const achData = achievements || [];
                    const data = achData.map((a, i) => ({
                        'Bil': i + 1,
                        'Nama Pencapaian': a.title,
                        'Peringkat': a.level,
                        'Unit': getUnitName(a.unitId),
                        'Kategori': a.category,
                        'Keputusan': a.result,
                        'Tarikh': a.date,
                        'Nama Pemenang (Individu)': a.studentName || '-'
                    }));
                    const ws = XLSX.utils.json_to_sheet(data);
                    ws['!cols'] = [{wch: 5}, {wch: 30}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 25}];
                    XLSX.utils.book_append_sheet(wb, ws, "Pencapaian");
                    fileName = `Laporan_Pencapaian_${new Date().toISOString().split('T')[0]}.xlsx`;
                }

                XLSX.writeFile(wb, fileName);
                setIsGenerating(false);
                setSelectedReportType(null); // Close modal on success

            } catch (error) {
                console.error("Export Error:", error);
                alert("Gagal menjana fail. Sila cuba lagi.");
                setIsGenerating(false);
            }
        }, 1000); // Simulate processing delay for UX
    };

    const ReportCard = ({ type, title, desc, icon: Icon, color, count }: { type: ReportType, title: string, desc: string, icon: any, color: string, count: number }) => (
        <div 
            onClick={() => setSelectedReportType(type)}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start gap-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
            <div className={`p-3 rounded-lg text-white ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-2">{desc}</p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    <HardDrive size={12} /> {count} Rekod
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
             
             {/* --- DOWNLOAD MODAL --- */}
             {selectedReportType && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                     <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border-t-4 border-blue-600">
                         <div className="text-center mb-6">
                             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Download size={32} />
                             </div>
                             <h3 className="text-xl font-bold text-gray-900">Jana & Muat Turun Data</h3>
                             <p className="text-gray-500 text-sm mt-1">
                                 Sistem akan menjana fail <b>.XLSX</b> (Excel) untuk:
                             </p>
                             <div className="mt-4 bg-gray-50 p-3 rounded-lg font-medium text-blue-800 border border-blue-100">
                                 {selectedReportType === 'MEMBERSHIP' && "Senarai Keahlian Semua Murid"}
                                 {selectedReportType === 'ACTIVITY' && "Laporan Mingguan Aktiviti Kokurikulum"}
                                 {selectedReportType === 'ATTENDANCE' && "Analisis Peratusan Kehadiran Mengikut Unit"}
                                 {selectedReportType === 'ACHIEVEMENT' && "Rekod Pencapaian Sekolah & Murid"}
                             </div>
                         </div>

                         <div className="flex gap-3">
                             <button 
                                 onClick={() => setSelectedReportType(null)}
                                 disabled={isGenerating}
                                 className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                             >
                                 Batal
                             </button>
                             <button 
                                 onClick={handleDownload}
                                 disabled={isGenerating}
                                 className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                             >
                                 {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                                 {isGenerating ? 'Menjana...' : 'Muat Turun'}
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Cetakan & Laporan Rasmi</h2>
                <p className="text-gray-500">Pusat sehenti muat turun data untuk simpanan fail atau serahan PPD.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportCard 
                    type="ACTIVITY"
                    title="Laporan Mingguan Aktiviti" 
                    desc="Kompilasi semua laporan aktiviti yang telah disahkan."
                    icon={FileText}
                    color="bg-blue-600"
                    count={reports.filter(r => r.status === 'VERIFIED').length}
                />

                <ReportCard 
                    type="ATTENDANCE"
                    title="Analisis Kehadiran Unit" 
                    desc="Statistik kehadiran dan peratusan mengikut unit."
                    icon={FileBarChart}
                    color="bg-purple-600"
                    count={attendance.length}
                />

                 <ReportCard 
                    type="ACHIEVEMENT"
                    title="Rekod Pencapaian Sekolah" 
                    desc="Senarai kemenangan peringkat Daerah, Negeri & Kebangsaan."
                    icon={Trophy}
                    color="bg-orange-600"
                    count={achievements ? achievements.length : 0}
                />

                <ReportCard 
                    type="MEMBERSHIP"
                    title="Data Keahlian Murid" 
                    desc="Senarai nama penuh murid mengikut kelas dan unit."
                    icon={Users}
                    color="bg-green-600"
                    count={students.length}
                />
            </div>
        </div>
    );
};