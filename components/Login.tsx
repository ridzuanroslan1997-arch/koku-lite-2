import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, Briefcase, CheckCircle2, AlertCircle, School, RefreshCw, Loader2, ChevronLeft } from 'lucide-react';
import { User, UserRole, UnitCategory } from '../types';
import { db } from '../firebase';
import { collection, getDocs, query, where, setDoc, doc, getDoc } from 'firebase/firestore';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

type ViewState = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD_FORM';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<ViewState>('LOGIN');
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginSchoolCode, setLoginSchoolCode] = useState(''); 
  
  // Registration Specific States
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [unitCategory, setUnitCategory] = useState<UnitCategory | ''>(''); 
  const [unitName, setUnitName] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Role Availability States
  const [isPKTaken, setIsPKTaken] = useState(false);
  const [isSUTaken, setIsSUTaken] = useState(false);

  // Helper: Clear Login Form completely
  const clearLoginForm = () => {
      setEmail('');
      setPassword('');
      setLoginSchoolCode('');
  };

  // Helper: Clear Registration Form completely
  const clearRegisterForm = () => {
      setFullName('');
      setEmail('');
      setRole('');
      setSchoolName('');
      setSchoolCode('');
      setUnitCategory('');
      setUnitName('');
      setPassword('');
      setConfirmPassword('');
  };

  // Clear errors when switching views
  useEffect(() => {
    setError('');
    setSuccessMsg('');
    setIsLoading(false);
    if (view === 'LOGIN') clearRegisterForm();
    if (view === 'REGISTER') clearLoginForm();
  }, [view]);

  // --- ASYNC CHECK ROLE AVAILABILITY ---
  useEffect(() => {
      const checkRoles = async () => {
          if (view === 'REGISTER' && schoolCode.length >= 4 && db) {
              try {
                  const code = schoolCode.trim().toUpperCase();
                  const q = query(collection(db, "users"), where("schoolId", "==", code));
                  const snapshot = await getDocs(q);
                  const users = snapshot.docs.map(d => d.data() as User);

                  const pkExists = users.some(u => u.role === UserRole.PK_KOKU);
                  const suExists = users.some(u => u.role === UserRole.SU_KOKU);

                  setIsPKTaken(pkExists);
                  setIsSUTaken(suExists);
              } catch (e) {
                  console.error("Error checking roles", e);
              }
          } else {
              setIsPKTaken(false);
              setIsSUTaken(false);
          }
      };
      checkRoles();
  }, [schoolCode, view]);

  // --- HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!db) {
        setError("Ralat sambungan database. Sila semak config.");
        return;
    }

    if (!loginSchoolCode.trim()) {
        setError("Sila masukkan Kod Sekolah.");
        return;
    }
    if (!email.trim() || !password.trim()) {
        setError("Sila masukkan Emel dan Kata Laluan.");
        return;
    }

    setIsLoading(true);

    try {
        const lowerEmail = email.trim().toLowerCase();
        const inputSchoolCode = loginSchoolCode.trim().toUpperCase();

        const q = query(collection(db, "users"), where("id", "==", lowerEmail));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            setError('Log masuk gagal. Emel tidak ditemui.');
            setIsLoading(false);
            return;
        }

        const userData = snapshot.docs[0].data() as User;

        if (userData.password !== password) {
            setError('Kata laluan salah.');
            setIsLoading(false);
            return;
        }

        if (userData.schoolId !== inputSchoolCode) {
            setError(`Akaun ini berdaftar untuk sekolah lain (${userData.schoolId}).`);
            setIsLoading(false);
            return;
        }

        onLoginSuccess(userData);

    } catch (err) {
        console.error(err);
        setError("Ralat semasa log masuk. Sila cuba lagi.");
        setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!db) {
        setError("Ralat database. Sila semak config.");
        return;
    }

    if (!fullName || !email || !role || !schoolName || !schoolCode) {
        setError("Sila lengkapkan maklumat sekolah dan diri.");
        return;
    }

    if (role === UserRole.GURU_PENASIHAT) {
        if (!unitCategory) {
            setError("Sila pilih Jenis Kokurikulum.");
            return;
        }
        if (!unitName.trim()) {
            setError("Sila nyatakan Nama Unit.");
            return;
        }
    }

    if (!password || !confirmPassword) {
        setError("Sila isi kata laluan.");
        return;
    }
    if (password !== confirmPassword) {
        setError("Kata laluan tidak sepadan.");
        return;
    }
    if (password.length < 6) {
        setError("Kata laluan mestilah sekurang-kurangnya 6 aksara.");
        return;
    }

    setIsLoading(true);

    const code = schoolCode.trim().toUpperCase();
    const lowerEmail = email.trim().toLowerCase();

    try {
        const userQ = query(collection(db, "users"), where("id", "==", lowerEmail));
        const userSnap = await getDocs(userQ);
        if (!userSnap.empty) {
            setError("Emel telah digunakan. Sila gunakan emel lain.");
            setIsLoading(false);
            return;
        }

        if (role === UserRole.GURU_PENASIHAT) {
            const unitQ = query(
                collection(db, "users"), 
                where("schoolId", "==", code),
                where("role", "==", UserRole.GURU_PENASIHAT),
                where("registeredUnitName", "==", unitName.trim())
            );
            const unitSnap = await getDocs(unitQ);
            
            if (!unitSnap.empty) {
                setError(`Maaf, Unit "${unitName}" telah didaftarkan oleh guru lain.`);
                setIsLoading(false);
                return;
            }
        }

        const newUser: User = {
            id: lowerEmail,
            name: fullName,
            role: role as UserRole,
            schoolId: code, 
            schoolName: schoolName,
            password: password 
        };

        if (role === UserRole.GURU_PENASIHAT) {
             newUser.assignedUnitId = `temp_${Date.now()}`;
             newUser.registeredUnitName = unitName.trim();
             if (unitCategory) {
                 newUser.registeredUnitCategory = unitCategory;
             }
        }
        
        await setDoc(doc(db, "users", lowerEmail), newUser);
        
        setIsLoading(false);
        setSuccessMsg("Pendaftaran berjaya! Sila log masuk.");
        
        clearRegisterForm();
        setLoginSchoolCode(code);
        
        setTimeout(() => {
            setView('LOGIN');
        }, 2000);

    } catch (err) {
        console.error(err);
        setIsLoading(false);
        setError("Ralat sistem penyimpanan awan.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');
      
      if (!email) {
          setError("Sila masukkan emel anda.");
          return;
      }

      setIsLoading(true);

      try {
          // Check if user exists in DB first
          const lowerEmail = email.trim().toLowerCase();
          const docRef = doc(db, "users", lowerEmail);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
              // Simulate Sending Email
              setTimeout(() => {
                  setIsLoading(false);
                  setSuccessMsg(`Pautan tetapan semula kata laluan telah dihantar ke ${email}.`);
                  // In a real app with Firebase Auth, you would call: await sendPasswordResetEmail(auth, email);
                  setTimeout(() => {
                      setSuccessMsg("");
                      // For this demo without backend email service, we allow them to reset here immediately for testing
                      // In production, this would direct them to check email
                      setView('RESET_PASSWORD_FORM');
                  }, 2500);
              }, 1500);
          } else {
              setIsLoading(false);
              setError("Emel ini tidak berdaftar dalam sistem kami.");
          }
      } catch (e) {
          console.error(e);
          setIsLoading(false);
          setError("Ralat menyemak emel.");
      }
  };

  const handleResetPassword = (e: React.FormEvent) => {
      e.preventDefault();
      if(password !== confirmPassword) {
          setError("Kata laluan tidak sepadan.");
          return;
      }
      
      setIsLoading(true);
      // Simulate password update
      setTimeout(() => {
          setSuccessMsg("Kata laluan berjaya dikemaskini. Sila log masuk.");
          setIsLoading(false);
          setTimeout(() => {
              setView('LOGIN');
              clearLoginForm();
          }, 1500);
      }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-200">
        
        {/* RIGHT SIDE (Branding - Moved to Left for Desktop, Top for Mobile) */}
        <div className="md:w-5/12 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden order-1 md:order-2">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-20 -ml-16 -mb-16 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-white">KokuLite</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cloud System</p>
                    </div>
                </div>
                
                <h2 className="text-3xl font-bold leading-tight mb-4 text-slate-50">Pengurusan Kokurikulum Digital.</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    Sistem bersepadu untuk sekolah rendah. Rekod kehadiran, laporan aktiviti, dan pencapaian murid kini lebih mudah dan pantas.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 size={18} className="text-blue-500" /> 
                        <span>Akses Data Real-time</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 size={18} className="text-blue-500" /> 
                        <span>Jana Laporan Automatik</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 size={18} className="text-blue-500" /> 
                        <span>Selamat & Terjamin</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-12 md:mt-0 text-[10px] text-slate-500 font-medium">
                &copy; 2026 KokuLite System. Hak Cipta Terpelihara.
            </div>
        </div>

        {/* LEFT SIDE (Form) - Moved to Right for Desktop */}
        <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white order-2 md:order-1 relative">
            
            {/* Navigation Back Button (For sub-views) */}
            {view !== 'LOGIN' && (
                <button 
                    onClick={() => setView('LOGIN')}
                    className="absolute top-6 left-6 text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1 text-sm font-bold"
                >
                    <ChevronLeft size={16} /> Kembali
                </button>
            )}

            <div className="max-w-md mx-auto w-full">
                <div className="mb-8 mt-6 md:mt-0">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                        {view === 'LOGIN' && 'Log Masuk Akaun'}
                        {view === 'REGISTER' && 'Pendaftaran Baru'}
                        {view === 'FORGOT_PASSWORD' && 'Set Semula Kata Laluan'}
                        {view === 'RESET_PASSWORD_FORM' && 'Kata Laluan Baru'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {view === 'LOGIN' && 'Sila masukkan butiran anda untuk meneruskan.'}
                        {view === 'REGISTER' && 'Lengkapkan maklumat sekolah untuk akses sistem.'}
                        {view === 'FORGOT_PASSWORD' && 'Masukkan emel yang didaftarkan untuk kami hantar pautan.'}
                    </p>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 shadow-sm">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 shadow-sm">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                        <span className="font-medium">{successMsg}</span>
                    </div>
                )}

                {/* --- VIEW: LOGIN --- */}
                {view === 'LOGIN' && (
                    <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in duration-300">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kod Sekolah</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <School className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={loginSchoolCode}
                                    onChange={(e) => setLoginSchoolCode(e.target.value.toUpperCase())}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 uppercase placeholder-slate-300"
                                    placeholder="Cth: MBA1234"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Emel Rasmi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium placeholder-slate-300"
                                    placeholder="nama@sekolah.edu.my"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Kata Laluan</label>
                                <button type="button" onClick={() => setView('FORGOT_PASSWORD')} className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                                    Lupa Kata Laluan?
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium placeholder-slate-300"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-700/20 hover:shadow-blue-700/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Log Masuk Sistem <ArrowRight size={18} /></>}
                        </button>

                        <div className="pt-4 text-center">
                            <p className="text-slate-500 text-sm">
                                Belum mempunyai akaun? <button type="button" onClick={() => setView('REGISTER')} className="text-blue-700 font-bold hover:underline ml-1">Daftar Sekolah</button>
                            </p>
                        </div>
                    </form>
                )}

                {/* --- VIEW: FORGOT PASSWORD --- */}
                {view === 'FORGOT_PASSWORD' && (
                    <form onSubmit={handleForgotPassword} className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm">
                            Masukkan emel rasmi yang anda gunakan semasa pendaftaran. Sistem akan menghantar pautan tetapan semula jika emel sah.
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Emel Berdaftar</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                                    placeholder="nama@sekolah.edu.my"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : "Hantar Pautan"}
                        </button>
                    </form>
                )}

                {/* --- VIEW: REGISTER --- */}
                {view === 'REGISTER' && (
                    <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-300">
                        {/* School Info Group */}
                        <div className="space-y-3 pb-4 border-b border-slate-100">
                            <label className="text-xs font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1"><School size={14}/> Maklumat Sekolah</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={schoolCode}
                                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-blue-600 outline-none font-semibold uppercase text-slate-700 text-sm"
                                    placeholder="KOD (MBA1234)"
                                />
                                <input
                                    type="text"
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-blue-600 outline-none text-slate-700 text-sm font-medium"
                                    placeholder="Nama Sekolah"
                                />
                            </div>
                        </div>

                        {/* User Info Group */}
                        <div className="space-y-3">
                            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1"><UserIcon size={14}/> Maklumat Diri</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 text-sm font-medium"
                                placeholder="Nama Penuh"
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 text-sm font-medium"
                                placeholder="Emel Rasmi"
                            />
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => {
                                        setRole(e.target.value as UserRole);
                                        if (e.target.value !== UserRole.GURU_PENASIHAT) {
                                            setUnitCategory('');
                                            setUnitName('');
                                        }
                                    }}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 text-sm font-medium appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Pilih Jawatan...</option>
                                    <option value={UserRole.GURU_PENASIHAT}>Guru Penasihat Unit</option>
                                    {!isSUTaken && <option value={UserRole.SU_KOKU}>Setiausaha Kokurikulum</option>}
                                    {!isPKTaken && <option value={UserRole.PK_KOKU}>Penolong Kanan Kokurikulum</option>}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                                    <ChevronLeft className="-rotate-90" size={16}/>
                                </div>
                            </div>
                        </div>

                        {/* Guru Specific Fields */}
                        {role === UserRole.GURU_PENASIHAT && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Pendaftaran Unit</label>
                                <select
                                    value={unitCategory}
                                    onChange={(e) => {
                                        setUnitCategory(e.target.value as UnitCategory);
                                        setUnitName('');
                                    }}
                                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="" disabled>-- Kategori --</option>
                                    <option value={UnitCategory.BADAN_BERUNIFORM}>Unit Beruniform</option>
                                    <option value={UnitCategory.KELAB_PERSATUAN}>Kelab & Persatuan</option>
                                    <option value={UnitCategory.SUKAN_PERMAINAN}>Sukan & Permainan</option>
                                </select>
                                
                                {unitCategory && (
                                    <input
                                        type="text"
                                        value={unitName}
                                        onChange={(e) => setUnitName(e.target.value)}
                                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Nama Unit (Cth: Pengakap)"
                                    />
                                )}
                            </div>
                        )}

                        {/* Password Group */}
                        {(role !== UserRole.GURU_PENASIHAT || (role === UserRole.GURU_PENASIHAT && unitName.length > 2)) && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 text-sm placeholder-slate-400"
                                    placeholder="Kata Laluan"
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700 text-sm placeholder-slate-400"
                                    placeholder="Ulang Laluan"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || (role === UserRole.GURU_PENASIHAT && (!unitCategory || !unitName))}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold shadow-lg transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : 'Daftar Akaun Baru'}
                        </button>
                    </form>
                )}

                {/* --- VIEW: RESET PASSWORD --- */}
                {view === 'RESET_PASSWORD_FORM' && (
                    <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in duration-300">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full text-green-700"><CheckCircle2 size={18}/></div>
                            <div className="text-sm text-green-800">
                                <p className="font-bold">Emel Sah!</p>
                                <p>Sila tetapkan kata laluan baru.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kata Laluan Baru</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700"
                                placeholder="Minima 6 aksara"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Sahkan Kata Laluan</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-slate-700"
                                placeholder="Ulang semula"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl font-bold shadow-lg transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : "Simpan & Log Masuk"}
                        </button>
                    </form>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};