import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, LogIn, ArrowLeft, Shield } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { saveCompanyToken } from '../../constants/firebase';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

const STAFF_MEMBERS = [
  { id: 1, name: 'Austin Love Stephens', role: 'General Manager', image: '/manager.jpg' },
  { id: 2, name: 'Oscar Love Stephens', role: 'Accountant', image: '/accountant.png' },
  { id: 3, name: 'Isaac Kwamena Brace', role: 'Sales Manager', image: '/sales_manager-1.png' },
  { id: 4, name: 'Augustine Love Stephens', role: 'Systems Administrator', image: '/it-1.png' },
  { id: 5, name: 'Janet Ninson', role: 'Teller', image: '/teller.jpg' },
];

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

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
    } catch {
      setError('Something went wrong. Try again.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#eeecea] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden relative">

      {/* ── Page-level logo watermark tiled across the whole background ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/logo.png)',
          backgroundSize: '590px 590px',
          backgroundRepeat: 'repeat',
          opacity: 0.04,
          filter: 'grayscale(100%)',
        }}
      />

      {/* ── Main card ── */}
      <div className="relative z-10 w-full max-w-5xl rounded-[28px] overflow-hidden shadow-2xl shadow-black/10 border border-white/80 grid grid-cols-1 lg:grid-cols-2 min-h-[580px] lg:h-[88vh] lg:max-h-[760px]">

        {/* ══════════════════════════════
            LEFT — FORM PANE
        ══════════════════════════════ */}
        <div className="relative bg-white flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-12 md:px-14 overflow-hidden">

          {/* Corner logo watermark (single large ghost) */}
          <img
            src="/logo.jpg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-10 w-64 h-64 object-contain opacity-[0.045] select-none"
          />

          {/* Brand */}
          <div className="flex items-center gap-3 mb-9 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#1a2e1a] flex items-center justify-center shadow-md shadow-black/10 shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="font-bold text-[15px] text-[#111810] tracking-tight leading-none">Big God</p>
              <p className="text-[9.5px] uppercase tracking-[0.15em] text-[#8a9490] font-semibold mt-0.5">Susu Enterprise</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7 relative z-10">
            <h1 className="text-[2rem] sm:text-[2.4rem] font-extrabold text-[#111810] tracking-tight leading-[1.1] mb-2">
              Welcome<br className="hidden sm:block" /> back.
            </h1>
            <p className="text-sm text-[#8a9490] font-medium">Sign in to manage your daily collections.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-2.5 items-start bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-5 text-sm animate-shake relative z-10">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6b7b72] uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="name@gmail.com"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl bg-[#f6f6f4] border border-transparent focus:border-[#1a2e1a] focus:ring-2 focus:ring-[#1a2e1a]/10 outline-none transition-all text-[#111810] placeholder:text-[#c2c9c5] text-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#6b7b72] uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-semibold text-[#8a9490] hover:text-[#1a2e1a] transition uppercase tracking-wider">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-[#f6f6f4] border border-transparent focus:border-[#1a2e1a] focus:ring-2 focus:ring-[#1a2e1a]/10 outline-none transition-all text-[#111810] placeholder:text-[#c2c9c5] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bcc6c0] hover:text-[#1a2e1a] transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#1a2e1a] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition-all hover:bg-[#243d24] active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-[#1a2e1a]/20"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>Sign In <LogIn size={16} /></>
              )}
            </button>
          </form>

          {/* Back link */}
          <div className="mt-7 relative z-10">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[#a0a8a4] hover:text-[#1a2e1a] transition group">
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to home
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════
            RIGHT — SLIDER PANE
        ══════════════════════════════ */}
        <div className="hidden lg:block relative bg-[#111810] overflow-hidden">

          {/* Logo watermark centred behind the photo */}
          <img
            src="/logo.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto w-[72%] h-[72%] object-contain opacity-[0.07] select-none z-10 mix-blend-screen"
          />

          {/* Swiper */}
          <Swiper
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop
            onSlideChange={(swiper: SwiperType) => setActiveIndex(swiper.realIndex)}
            className="h-full w-full"
          >
            {STAFF_MEMBERS.map((staff) => (
              <SwiperSlide key={staff.id}>
                <div className="relative h-full w-full">
                  <img
                    src={staff.image}
                    alt={staff.name}
                    className="w-full h-full object-cover object-top"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

                  {/* Staff info */}
                  <div className="absolute bottom-10 left-9 right-9 text-white z-20">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full mb-4 shadow-lg">
                      <Shield size={11} className="text-emerald-400 shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/75">
                        Verified {staff.role}
                      </span>
                    </div>
                    <h3 className="text-[2.1rem] font-black tracking-tight leading-none mb-1">{staff.name}</h3>
                    <p className="text-white/50 text-base font-medium">{staff.role}</p>

                    <div className="mt-5 flex items-center gap-2.5">
                      <div className="flex -space-x-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-[#111810] bg-[#3a4a3a]" />
                        ))}
                      </div>
                      <span className="text-[9px] text-white/35 uppercase font-bold tracking-wider">Team member online</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* ── Mobile: show current staff name below card ── */}
      {/* <div className="lg:hidden mt-4 text-center relative z-10">
        <p className="text-xs text-[#8a9490] font-medium">
          {STAFF_MEMBERS[activeIndex]?.name} · {STAFF_MEMBERS[activeIndex]?.role}
        </p>
      </div> */}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.35s ease-in-out; }

        .swiper-pagination {
          bottom: 16px !important;
        }
        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.3 !important;
          width: 7px !important;
          height: 7px !important;
          transition: all 0.3s ease !important;
        }
        .swiper-pagination-bullet-active {
          opacity: 1 !important;
          width: 22px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
};

export default Login;
