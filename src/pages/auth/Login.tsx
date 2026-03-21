import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, LogIn, ArrowLeft } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Company } from '../../data/mockData';
import { db } from '../../firebaseConfig';
import { resetPassword } from '../../constants/appConstants';
import { saveCompanyToken } from '../../constants/firebase';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const saveCompany = async (company: Company) => {
    const docRef = doc(db, 'companies', company.id);
    await setDoc(docRef, {
      name: company.name,
      email: company.email,
      createdAt: serverTimestamp(),
    }, { merge: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const response = await login(formData.email, formData.password);
    const companyJSON = localStorage.getItem('susupro_company');
    const company = companyJSON ? JSON.parse(companyJSON) : null;
    if (response) {
      await saveCompany({ id: company.id, name: company.companyName, email: formData.email });
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
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#344a2e] flex items-center justify-center p-4">

      <div className="w-full max-w-sm bg-white p-5 rounded-2xl">

        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#344a2e] rounded-xl flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="SusuPro" className="w-7 h-7 object-cover rounded-lg" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900 leading-none">Big God</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Susu Enterprise</p>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-gray-900 leading-tight mb-2">Welcome back</h1>
          <p className="text-[14px] text-gray-400 leading-relaxed">
            Sign in to continue managing your customers and transactions.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-100 rounded-[22px] p-8">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-[13px] text-red-600">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-[14px] bg-gray-50 focus:bg-white focus:border-[#344a2e] focus:ring-2 focus:ring-[#344a2e]/10 focus:outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[12px] font-semibold text-gray-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl text-[14px] bg-gray-50 focus:bg-white focus:border-[#344a2e] focus:ring-2 focus:ring-[#344a2e]/10 focus:outline-none transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#344a2e] focus:ring-[#344a2e] accent-[#344a2e]"
                />
                <span className="text-[13px] text-gray-600">Remember me</span>
              </label>
              <a
                href="#"
                className="text-[13px] font-medium text-[#344a2e] hover:text-[#588c4a] transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-[14px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-[13px] text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#344a2e] hover:text-[#588c4a] transition-colors">
              Sign up here
            </Link>
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to homepage
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
