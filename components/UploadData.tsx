import React, { useState, useRef, useEffect } from 'react';
import { Student, Unit, User, UserRole, UnitCategory } from '../types';
import { Upload, AlertCircle, CheckCircle2, X, FileSpreadsheet, ArrowRight, Database, Columns, UserCog, GraduationCap, ChevronDown, LayoutTemplate, FileUp, Download, Briefcase } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UploadDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  onBatchImport: (students: Student[], teachers: User[], newUnits: Unit[]) => void;
  schoolId: string;
  schoolName: string;
}

// Updated Mapping Options to include Category
type ColumnType = 'IGNORE' | 'STUDENT_NAME' | 'CLASS' | 'UNIT_CATEGORY' | 'UNIT_NAME' | 'TEACHER_NAME';

const COLUMN_OPTIONS: { value: ColumnType; label: string; color: string }[] = [
    { value: 'IGNORE', label: 'Abaikan', color: 'text-slate-400 bg-slate-100' },
    { value: 'STUDENT_NAME', label: 'Nama Murid', color: 'text-blue-700 bg-blue-100 border-blue-200' },
    { value: 'CLASS', label: 'Tahun / Kelas', color: 'text-purple-700 bg-purple-100 border-purple-200' },
    { value: 'UNIT_CATEGORY', label: 'Kategori Unit (Modul)', color: 'text-pink-700 bg-pink-100 border-pink-200' },
    { value: 'UNIT_NAME', label: 'Nama Unit (Kelab/Sukan)', color: 'text-orange-700 bg-orange-100 border-orange-200' },
    { value: 'TEACHER_NAME', label: 'Guru Penasihat', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
];

export const UploadDataModal: React.FC<UploadDataModalProps> = ({ isOpen, onClose, units, onBatchImport, schoolId, schoolName }) => {
  const [fileData, setFileData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  const [columnMapping, setColumnMapping] = useState<ColumnType[]>([]);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ students: 0, teachers: 0, newUnits: 0, updatedStudents: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RESET STATE ON OPEN
  useEffect(() => {
      if (isOpen) {
          handleReset();
      }
  }, [isOpen]);

  const handleReset = () => {
      setFileData([]);
      setHeaders([]);
      setColumnMapping([]);
      setFileName('');
      setStep(1);
      setError('');
      setStats({ students: 0, teachers: 0, newUnits: 0, updatedStudents: 0 });
  };

  if (!isOpen) return null;

  // --- DOWNLOAD TEMPLATE HANDLER ---
  const handleDownloadTemplate = () => {
      const templateData = [
          { 
              "Nama Murid": "Ali Bin Abu", 
              "Tahun / Kelas": "4 Merah", 
              "Kategori Unit": "Unit Beruniform", 
              "Nama Unit": "Pengakap", 
              "Guru Penasihat": "Cikgu Ahmad" 
          },
          { 
              "Nama Murid": "Siti Binti Ali", 
              "Tahun / Kelas": "5 Biru", 
              "Kategori Unit": "Kelab & Persatuan", 
              "Nama Unit": "Persatuan Bahasa Melayu", 
              "Guru Penasihat": "Cikgu Sarah" 
          },
          { 
              "Nama Murid": "Muthu A/L Ravi", 
              "Tahun / Kelas": "6 Hijau", 
              "Kategori Unit": "Sukan & Permainan", 
              "Nama Unit": "Bola Sepak", 
              "Guru Penasihat": "Cikgu Tan" 
          }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Auto-width for columns
      const wscols = [
          {wch: 25}, // Nama Murid
          {wch: 15}, // Kelas
          {wch: 20}, // Kategori
          {wch: 25}, // Nama Unit
          {wch: 20}, // Guru
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Kokurikulum");
      XLSX.writeFile(wb, "Template_Import_KokuLite.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rawData.length < 2) throw new Error("Fail kosong atau format tidak sah.");

        const fileHeaders = rawData[0].map(h => String(h || '').trim());
        const contentRows = rawData.slice(1).filter(row => row.some((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== ''));

        if (contentRows.length === 0) throw new Error("Tiada data ditemui dalam baris fail.");

        setHeaders(fileHeaders);
        setFileData(contentRows);

        // Smart Mapping based on User's Preferred Headers
        const initialMapping: ColumnType[] = fileHeaders.map(header => {
            const h = header.toLowerCase();
            if (h.includes('nama murid') || h.includes('student') || h.includes('pelajar')) return 'STUDENT_NAME';
            if (h.includes('kelas') || h.includes('tahun') || h.includes('tingkatan')) return 'CLASS';
            if (h.includes('kategori') || h.includes('modul') || h.includes('jenis')) return 'UNIT_CATEGORY';
            if (h.includes('nama unit') || h.includes('kelab') || h.includes('persatuan') || h.includes('sukan') || h.includes('uniform')) return 'UNIT_NAME';
            if (h.includes('guru') || h.includes('teacher') || h.includes('penasihat')) return 'TEACHER_NAME';
            return 'IGNORE';
        });

        setColumnMapping(initialMapping);
        setStep(2);
        setIsProcessing(false);

      } catch (err: any) {
        setError(err.message || "Gagal membaca fail.");
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMapChange = (index: number, value: ColumnType) => {
      const newMapping = [...columnMapping];
      newMapping[index] = value;
      setColumnMapping(newMapping);
  };

  const parseUnitCategory = (val: string, unitName: string): UnitCategory => {
      const lowerVal = val.toLowerCase();
      
      // Explicit Mapping
      if (lowerVal.includes('sukan') || lowerVal.includes('permainan') || lowerVal.includes('bola') || lowerVal.includes('olahraga')) return UnitCategory.SUKAN_PERMAINAN;
      if (lowerVal.includes('uniform') || lowerVal.includes('beruniform') || lowerVal.includes('pengakap') || lowerVal.includes('krs')) return UnitCategory.BADAN_BERUNIFORM;
      if (lowerVal.includes('kelab') || lowerVal.includes('persatuan') || lowerVal.includes('akademik')) return UnitCategory.KELAB_PERSATUAN;

      // Fallback: Guess by Unit Name if Category is vague
      const lowerName = unitName.toLowerCase();
      if (lowerName.includes('bola') || lowerName.includes('sepak') || lowerName.includes('badminton')) return UnitCategory.SUKAN_PERMAINAN;
      if (lowerName.includes('pengakap') || lowerName.includes('tunas') || lowerName.includes('bsmm')) return UnitCategory.BADAN_BERUNIFORM;
      
      return UnitCategory.KELAB_PERSATUAN; // Default
  };

  const handleProcessAndSave = () => {
      setIsProcessing(true);
      
      const studentsToSave: Student[] = [];
      const teachersToSave: User[] = [];
      const uniqueTeachers = new Set<string>(); 
      const newUnitsCreated: Unit[] = [];
      const knownUnitMap = new Map<string, string>(); 

      units.forEach(u => knownUnitMap.set(u.name.trim().toLowerCase(), u.id));

      const nameIdx = columnMapping.indexOf('STUDENT_NAME');
      const classIdx = columnMapping.indexOf('CLASS');
      const categoryIdx = columnMapping.indexOf('UNIT_CATEGORY');
      const unitIdx = columnMapping.indexOf('UNIT_NAME');
      const teacherIdx = columnMapping.indexOf('TEACHER_NAME');

      if (unitIdx === -1) {
          setError("Sila padankan lajur 'Nama Unit'.");
          setIsProcessing(false);
          return;
      }

      // 1. Identify Units (Find Existing OR Create New)
      fileData.forEach(row => {
          const rawUnitName = row[unitIdx] ? String(row[unitIdx]).trim() : '';
          const rawCategory = categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]).trim() : '';
          
          if (!rawUnitName) return;

          const key = rawUnitName.toLowerCase();
          
          if (!knownUnitMap.has(key)) {
              const newId = `u_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
              const newUnit: Unit = {
                  id: newId,
                  name: rawUnitName, 
                  category: parseUnitCategory(rawCategory, rawUnitName),
                  schoolId: schoolId
              };
              
              newUnitsCreated.push(newUnit);
              knownUnitMap.set(key, newId);
          }
      });

      // 2. Extract Data
      fileData.forEach((row, idx) => {
          const rawUnitName = row[unitIdx] ? String(row[unitIdx]).trim() : '';
          if (!rawUnitName) return;

          const unitId = knownUnitMap.get(rawUnitName.toLowerCase());
          if (!unitId) return;

          // Student
          if (nameIdx !== -1 && classIdx !== -1) {
              const sName = row[nameIdx] ? String(row[nameIdx]).trim() : '';
              const sClass = row[classIdx] ? String(row[classIdx]).trim() : '';
              
              if (sName && sClass) {
                  studentsToSave.push({
                      id: `imp_std_${Date.now()}_${idx}`, 
                      name: sName,
                      class: sClass,
                      unitId: unitId,
                      schoolId: schoolId,
                      position: 'Ahli Biasa'
                  });
              }
          }

          // Teacher
          if (teacherIdx !== -1) {
              const tName = row[teacherIdx] ? String(row[teacherIdx]).trim() : '';
              if (tName && !uniqueTeachers.has(tName)) {
                  uniqueTeachers.add(tName);
                  teachersToSave.push({
                      id: `imp_tchr_${Date.now()}_${idx}`, 
                      name: tName,
                      role: UserRole.GURU_PENASIHAT,
                      schoolId: schoolId,
                      schoolName: schoolName,
                      assignedUnitId: unitId
                  });
              }
          }
      });

      if (studentsToSave.length === 0 && teachersToSave.length === 0) {
          setError("Tiada data sah dijumpai untuk disimpan.");
          setIsProcessing(false);
          return;
      }

      onBatchImport(studentsToSave, teachersToSave, newUnitsCreated);

      setStats({
          students: studentsToSave.length,
          teachers: teachersToSave.length,
          newUnits: newUnitsCreated.length,
          updatedStudents: 0 
      });

      setStep(3);
      setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
                    <Database size={24} className="text-white" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold tracking-tight">Import Data Kokurikulum</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Sistem memproses fail untuk susunan data yang sistematik.</p>
                 </div>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                 <X size={24} />
             </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            
            {/* STEP 1: UPLOAD */}
            {step === 1 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4">
                    
                    <div className="mb-8 w-full max-w-xl">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <LayoutTemplate size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-900 text-sm">Belum ada fail?</h4>
                                    <p className="text-xs text-blue-600">Muat turun template Excel yang lengkap.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleDownloadTemplate}
                                className="px-4 py-2 bg-white text-blue-700 text-xs font-bold rounded-lg border border-blue-200 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-2"
                            >
                                <Download size={14} /> Muat Turun Template
                            </button>
                        </div>
                    </div>

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full max-w-xl border-3 border-dashed border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-400 rounded-3xl p-12 cursor-pointer transition-all group flex flex-col items-center shadow-sm hover:shadow-xl relative"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".csv, .xlsx, .xls" 
                            className="hidden" 
                        />
                        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all shadow-inner">
                            <FileSpreadsheet size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Pilih Fail Data</h3>
                        <p className="text-slate-500 max-w-xs mx-auto leading-relaxed text-sm">
                            Pastikan fail mempunyai lajur: <br/>
                            <span className="font-mono text-xs bg-slate-100 px-1 rounded">Nama, Tahun, Kategori, Unit, Guru</span>
                        </p>
                        <button className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 group-hover:bg-blue-600 group-hover:shadow-blue-600/30 transition-all">
                            Buka Fail Dari Peranti
                        </button>
                    </div>
                    
                    {isProcessing && <p className="mt-6 text-blue-600 font-bold animate-pulse text-sm">Sedang membaca struktur fail...</p>}
                    
                    {error && (
                        <div className="mt-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200 max-w-md text-sm font-medium">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2: MAP & PREVIEW */}
            {step === 2 && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm shrink-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                                <FileSpreadsheet size={20}/>
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{fileName}</p>
                                <p className="text-xs text-slate-500">{fileData.length} Baris Data Dijumpai</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleReset} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50">
                                Batal
                            </button>
                            <button 
                                onClick={handleProcessAndSave}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 flex items-center gap-2"
                            >
                                {isProcessing ? 'Menyusun Data...' : <>Sahkan & Simpan <ArrowRight size={16} /></>}
                            </button>
                        </div>
                    </div>

                    {/* Mapping Table */}
                    <div className="flex-1 overflow-auto bg-slate-50 p-6">
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 text-xs text-blue-800 flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            Sistem telah cuba memadankan lajur berdasarkan template. Sila semak sebelum meneruskan.
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-200">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        {/* Row 1: Mapping Dropdowns */}
                                        <tr className="bg-slate-100 border-b border-slate-200">
                                            <th className="p-4 w-12 text-center font-bold text-slate-400 text-xs">#</th>
                                            {headers.map((header, idx) => (
                                                <th key={idx} className="p-2 min-w-[200px]">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs font-bold text-slate-500 uppercase truncate px-1">{header}</span>
                                                        <div className="relative">
                                                            <select
                                                                value={columnMapping[idx]}
                                                                onChange={(e) => handleMapChange(idx, e.target.value as ColumnType)}
                                                                className={`w-full appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-bold border-2 cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-blue-500/50 ${
                                                                    COLUMN_OPTIONS.find(o => o.value === columnMapping[idx])?.color
                                                                }`}
                                                            >
                                                                {COLUMN_OPTIONS.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-50 pointer-events-none" size={14} />
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {fileData.slice(0, 5).map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 text-center text-xs text-slate-400 font-mono border-r border-slate-100">{rIdx + 1}</td>
                                                {headers.map((_, cIdx) => (
                                                    <td key={cIdx} className={`p-3 text-sm border-r border-slate-50 truncate max-w-[200px] ${columnMapping[cIdx] === 'IGNORE' ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                                                        {row[cIdx] !== undefined ? String(row[cIdx]) : ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <FileUp size={48} />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-2">Import & Kemaskini Berjaya!</h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Data telah disusun mengikut kategori, unit dan guru penasihat yang ditetapkan dalam fail.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-6 w-full max-w-2xl mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center group hover:border-blue-300 transition-all">
                            <span className="text-4xl font-extrabold text-blue-600 mb-1">{stats.students}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 group-hover:text-blue-500">
                                <GraduationCap size={14}/> Rekod Murid
                            </span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center group hover:border-purple-300 transition-all">
                            <span className="text-4xl font-extrabold text-purple-600 mb-1">{stats.teachers}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 group-hover:text-purple-500">
                                <UserCog size={14}/> Rekod Guru
                            </span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center group hover:border-orange-300 transition-all">
                            <span className="text-4xl font-extrabold text-orange-600 mb-1">{stats.newUnits}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 group-hover:text-orange-500">
                                <Briefcase size={14}/> Unit Baru
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all transform hover:scale-105"
                    >
                        Selesai & Tutup
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};