import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, LogIn, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { saveCompanyToken } from '../../constants/firebase';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

// Added 'themeColor' to each staff member to drive the left-side UI
const STAFF_MEMBERS = [
  { id: 1, name: 'Austin Love Stephens', role: 'General Manager', image: '/manager.jpg', emoji: '🌟', themeColor: 'bg-[#2e1a11]' },
  { id: 2, name: 'Oscar Love Stephens', role: 'Accountant', image: '/accountant.png', emoji: '💫', themeColor: 'bg-[#393867]' },
  { id: 3, name: 'Janet Ninson', role: 'Teller', image: '/teller.jpg', emoji: '🚀', themeColor: 'bg-[#1b1c21]' },
  { id: 4, name: 'Isaac Kwamena Brace', role: 'Sales Manager', image: '/sales_manager-1.png', emoji: '🚀', themeColor: 'bg-[#2f333c]' },
  { id: 5, name: 'Augustine Love Stephens', role: 'Human Resource', image: '/it-1.png', emoji: '🚀', themeColor: 'bg-[#2f605d]' },
];

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0); // Track active slide
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await login(formData.email, formData.password);
      const companyJSON = localStorage.getItem('susupro_company');
      const company = companyJSON ? JSON.parse(companyJSON) : null;

      if (response && company) {
        await setDoc(doc(db, 'companies', company.id), {
          name: company.companyName,
          email: formData.email,
          lastLogin: serverTimestamp(),
        }, { merge: true });

        await saveCompanyToken(company.id);

        if (response.requires2FA) {
          navigate('/two-factor', { state: { companyId: response.companyId } });
        } else if (response.requireSignIn) {
          navigate('/reset-password', {
            state: { currentPassword: formData.password, staff_id: company.id, companyId: company.companyId },
          });
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Invalid credentials.');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    }
  };

  // Get the current color based on the active slide index
  const currentTheme = STAFF_MEMBERS[activeIndex]?.themeColor || 'bg-[#398078]';

  return (
    <div className="h-screen w-screen bg-[#f3f4f1] flex items-center justify-center p-4 overflow-hidden">
      
      {/* Container: Background color transitions here */}
      <div className={`w-full max-w-6xl ${currentTheme} transition-colors duration-1000 ease-in-out backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 h-full max-h-[90vh]`}>

        {/* LEFT: LOGIN FORM */}
        <div className="p-6 md:p-12 flex flex-col justify-center relative overflow-hidden group">
          {/* Subtle background decoration to keep it "cute" */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16 blur-2xl" />
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 animate-fade-in">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/10 transform transition hover:scale-110">
                <img src="/logo.png" className="w-7 h-7" alt="Logo" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white tracking-tight">Big God</h2>
                <p className="text-[10px] uppercase tracking-widest text-white/70 font-semibold">Susu Enterprise</p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8 animate-slide-up">
              <h1 className="text-4xl font-extrabold mb-2 text-white tracking-tight">
                Welcome back
              </h1>
              <p className="text-white/60 text-sm font-medium">Please sign in to manage your daily collections.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-2 bg-red-500/10 border border-red-500/20 text-red-100 p-4 rounded-2xl mb-6 text-sm animate-shake backdrop-blur-md">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/80 ml-1 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@susupro.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-4 rounded-2xl border-none focus:ring-4 focus:ring-white/20 outline-none transition-all bg-white/10 backdrop-blur-md text-white placeholder:text-white/40 shadow-inner"
                />
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-white/80 ml-1 uppercase tracking-wider">Password</label>
                  <button type="button" className="text-[10px] font-bold text-white/50 hover:text-white transition uppercase">Forgot?</button>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-4 rounded-2xl border-none focus:ring-4 focus:ring-white/20 outline-none transition-all bg-white/10 backdrop-blur-md text-white placeholder:text-white/40 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-[#2a3d25] py-4 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-2xl mt-4"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-3 border-[#2a3d25] border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>Sign In <LogIn size={18} /></>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <Link to="/" className="text-xs text-white/60 flex items-center gap-2 hover:text-white transition group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition" />
                <span>Back to home</span>
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT: SLIDER */}
        <div className="hidden lg:block relative h-full bg-black overflow-hidden">
          <Swiper
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={true}
            onSlideChange={(swiper: SwiperType) => setActiveIndex(swiper.realIndex)}
            className="h-full w-full"
          >
            {STAFF_MEMBERS.map((staff) => (
              <SwiperSlide key={staff.id}>
                <div className="relative h-full w-full group">
                  <img
                    src={staff.image.replace('/public', '')} // Clean path if needed
                    alt={staff.name}
                    className="w-full h-full object-cover transition-transform duration-[5000ms] group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Staff Info Overlay */}
                  <div className="absolute bottom-12 left-10 right-10 text-white animate-fade-in-up">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full mb-4 w-fit shadow-xl">
                      <Shield size={14} className="text-green-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Verified {staff.role}</span>
                      {/* <span className="text-lg ml-1">{staff.emoji}</span> */}
                    </div>

                    <h3 className="text-4xl font-black mb-1 tracking-tighter leading-none">{staff.name}</h3>
                    <p className="text-white/60 text-lg font-medium">{staff.role}</p>
                    
                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex -space-x-2">
                           {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-gray-400" />)}
                        </div>
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Team member online</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in-up { animation: slide-up 0.8s ease-out; }
        .animate-shake { animation: shake 0.4s ease-in-out; }

        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.3 !important;
          width: 8px !important;
          height: 8px !important;
          transition: all 0.3s ease !important;
        }
        .swiper-pagination-bullet-active {
          opacity: 1 !important;
          width: 24px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
};

export default Login;