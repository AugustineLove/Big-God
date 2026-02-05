import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_website: '',
    password_hash: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.company_email.trim()) {
      newErrors.company_email = 'Company email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
      newErrors.company_email = 'Please enter a valid email address';
    }

    if (!formData.company_phone.trim()) {
      newErrors.company_phone = 'Company phone is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.company_phone)) {
      newErrors.company_phone = 'Please enter a valid phone number';
    }

    if (!formData.company_address.trim()) {
      newErrors.company_address = 'Company address is required';
    }

    if (formData.company_website && !/^https?:\/\/.+\..+/.test(formData.company_website)) {
      newErrors.company_website = 'Please enter a valid website URL (include http:// or https://)';
    }

    if (!formData.password_hash) {
      newErrors.password_hash = 'Password is required';
    } else if (formData.password_hash.length < 8) {
      newErrors.password_hash = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password_hash !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const data = {
  companyName: formData.company_name,
  email: formData.company_email,
  phone: formData.company_phone,
  address: formData.company_address,
  website: formData.company_website,
  password: formData.confirmPassword,
  two_factor_enabled: false,
  login_notifications: false,
  has_paid: false
    };
    console.log(`Signing up with data: ${JSON.stringify(data)}`);
    const response = await signUp(data);

  if (response.success){
    alert('Successfully created company')
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful registration
    setIsLoading(false);
    setIsSuccess(true);
    
    // Redirect to login after success message
    setTimeout(() => {
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in with your credentials.',
          email: formData.company_email 
        }
      });
    }, 2000);
  }
  setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-teal-700 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        <div className="relative max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
            <p className="text-gray-600 mb-4">
              Your company account has been created successfully. You will be redirected to the login page shortly.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-teal-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <div className="relative max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-teal-600 rounded-full mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-600">Join SusuPro and digitize your microfinance operations</p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.company_name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  placeholder="Your company name"
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.company_name}
                  </p>
                )}
              </div>

              {/* Company Email */}
              <div>
                <label htmlFor="company_email" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email *
                </label>
                <input
                  type="email"
                  id="company_email"
                  name="company_email"
                  value={formData.company_email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.company_email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  placeholder="company@example.com"
                />
                {errors.company_email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.company_email}
                  </p>
                )}
              </div>

              {/* Company Phone */}
              <div>
                <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone *
                </label>
                <input
                  type="tel"
                  id="company_phone"
                  name="company_phone"
                  value={formData.company_phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.company_phone ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  placeholder="+233 XX XXX XXXX"
                />
                {errors.company_phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.company_phone}
                  </p>
                )}
              </div>

              {/* Company Website */}
              <div>
                <label htmlFor="company_website" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Website
                </label>
                <input
                  type="url"
                  id="company_website"
                  name="company_website"
                  value={formData.company_website}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.company_website ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  placeholder="https://www.yourcompany.com"
                />
                {errors.company_website && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.company_website}
                  </p>
                )}
              </div>
            </div>

            {/* Company Address */}
            <div>
              <label htmlFor="company_address" className="block text-sm font-medium text-gray-700 mb-2">
                Company Address *
              </label>
              <textarea
                id="company_address"
                name="company_address"
                value={formData.company_address}
                onChange={handleChange}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors resize-none ${
                  errors.company_address ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="Enter your complete company address"
              />
              {errors.company_address && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.company_address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label htmlFor="password_hash" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password_hash"
                    name="password_hash"
                    value={formData.password_hash}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.password_hash ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password_hash && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password_hash}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in here
              </Link>
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;