import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { userUUID } from '../../constants/appConstants';
import { useSettings } from '../../contexts/dashboard/Settings';

const ForcePasswordChange = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { forceResetPassword } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const { currentPassword, staff_id, companyId } = location.state || {};
  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Validate Password Strength
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(passwordForm.newPassword);
  const isPasswordValid = Object.values(passwordRequirements).every(req => req);

  // Handle Password Change Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    // Validate password strength
    if (!isPasswordValid) {
      setErrorMessage('Password does not meet all requirements');
      return;
    }

    // Check if new password is same as current password
    if (currentPassword === passwordForm.newPassword) {
      setErrorMessage('New password must be different from current password');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(`Current password: ${currentPassword}`)
      
      const resetStatus = await forceResetPassword(staff_id, currentPassword, passwordForm.newPassword, companyId);

      if (!resetStatus) {
        throw new Error('Failed to change password');
      }

      // Update user data in localStorage to mark password as changed
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.change_password_after_signin = false;
      localStorage.setItem('user', JSON.stringify(userData));
      navigate("/dashboard");
    } catch (error) {
      console.error('Error changing password:', error);
      setErrorMessage(error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header Card */}
        <div className="bg-white rounded-t-2xl border border-gray-200 border-b-0 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="text-blue-600" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Password Change Required
          </h1>
          <p className="text-gray-600 text-center">
            For security reasons, you must change your password before continuing
          </p>
        </div>

        {/* Alert Banner */}
        <div className="bg-yellow-50 border-x border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                This is a mandatory security step
              </p>
              <p className="text-sm text-yellow-700">
                You're required to create a new, secure password to protect your account. 
                This is likely your first login or your password has expired.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-b-2xl border border-gray-200 shadow-xl">
          <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800 text-sm">{errorMessage}</p>
              </div>
            )}

            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Create New Password</span>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="text-blue-600" size={18} />
                <p className="text-sm font-semibold text-gray-800">Password Requirements</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    passwordRequirements.length ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {passwordRequirements.length && <CheckCircle className="text-white" size={14} />}
                  </div>
                  <span className={`text-sm font-medium ${
                    passwordRequirements.length ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    passwordRequirements.uppercase ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {passwordRequirements.uppercase && <CheckCircle className="text-white" size={14} />}
                  </div>
                  <span className={`text-sm font-medium ${
                    passwordRequirements.uppercase ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    One uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    passwordRequirements.lowercase ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {passwordRequirements.lowercase && <CheckCircle className="text-white" size={14} />}
                  </div>
                  <span className={`text-sm font-medium ${
                    passwordRequirements.lowercase ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    One lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    passwordRequirements.number ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {passwordRequirements.number && <CheckCircle className="text-white" size={14} />}
                  </div>
                  <span className={`text-sm font-medium ${
                    passwordRequirements.number ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    One number
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    passwordRequirements.special ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {passwordRequirements.special && <CheckCircle className="text-white" size={14} />}
                  </div>
                  <span className={`text-sm font-medium ${
                    passwordRequirements.special ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    One special character
                  </span>
                </div>
              </div>
            </div>

            {/* Password Match Indicator */}
            {passwordForm.confirmPassword && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                passwordForm.newPassword === passwordForm.confirmPassword
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {passwordForm.newPassword === passwordForm.confirmPassword ? (
                  <>
                    <CheckCircle className="text-green-600" size={18} />
                    <span className="text-sm font-medium text-green-700">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-red-600" size={18} />
                    <span className="text-sm font-medium text-red-700">Passwords do not match</span>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                disabled={isSubmitting || !isPasswordValid || passwordForm.newPassword !== passwordForm.confirmPassword}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Key size={20} />
                    Change Password & Continue
                  </>
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 text-center">
                <span className="font-semibold">Security Note:</span> Your new password will be encrypted and stored securely. 
                Make sure to remember it as you'll need it for future logins.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;