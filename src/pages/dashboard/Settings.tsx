import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Save, User, Lock, Bell, CreditCard, Shield, Eye, EyeOff, Users } from 'lucide-react';
import { companyId, userRole } from '../../constants/appConstants';
import { useStaff } from '../../contexts/dashboard/Staff';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { company } = useAuth();
  const { refreshStaff } = useStaff();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = React.useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(company?.two_factor_enabled);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  console.log(company?.two_factor_enabled);
  const [profileData, setProfileData] = useState({
    name: company?.staffName || company?.companyName || '',
    email: company?.email || '',
    company: company?.address || '',
    phone: company?.phone || '',
    address: company?.address,
    timezone: 'GMT',
    website: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [staffData, setStaffData] = useState({
  full_name: "",
  email: "",
  phone: "",
  role: "",
  password: "",
  staff_id: "",
  address: "",
});


  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    contributionReminders: true,
    withdrawalAlerts: true,
    systemUpdates: false
  });

  const [companySettings, setCompanySettings] = useState({
    companyName: company?.companyName || '',
    registrationNumber: '',
    contactEmail: company?.parentCompanyEmail || company?.email,
    supportPhone: company?.parentPhone || company?.phone,
    currency: 'GHS',
    language: 'English'
  });

  const start2FASetup = async () => {
  const res = await fetch("https://susu-pro-backend.onrender.com/api/companies/toggle-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId: companyId }),
  });

  const data = await res.json();
  console.log(data);
  if (res.ok) {
    setQrCode(data.qrCode);
    setSecret(data.secret);
  } else {
    alert(data.error);
  }
};

  
  const handleChangePassword = async () => {
  const { currentPassword, newPassword, confirmPassword } = passwordData;
  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('Please fill all password fields.');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('New password and confirmation do not match.');
    return;
  }
  const data = { 
        "currentPassword" : currentPassword,
        "newPassword": newPassword,
        "companyId": companyId, 
      }

      console.log(data);
  try {
    const res = await fetch('https://susu-pro-backend.onrender.com/api/companies/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert('Password changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to change password.');
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong.');
  }
};

const verifyOtp = async () => {
  const res = await fetch("https://susu-pro-backend.onrender.com/api/companies/verify-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId: companyId, token: otp }),
  });

  const data = await res.json();

  if (res.ok) {
    alert("✅ 2FA enabled successfully!");
    setQrCode(null);
    setSecret(null);
    setOtp("");
  } else {
    alert("❌ " + data.error);
  }
};


  const handleAddStaff = async () => {
    console.log(`Adding staff ${companyId}`);
    try {
      const toastId= toast.loading('Adding staff...');
      const res = await fetch('https://susu-pro-backend.onrender.com/api/staff/create-agent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          "full_name": staffData.full_name,
          "email": staffData.email,
          "phone": staffData.phone,
          "role": staffData.role,
          "password": staffData.password,
          "staff_id": staffData.staff_id,
          "company_id": companyId
      })
      });
      const resData = await res.json();
      if(res.ok){
        setStaffData({
          full_name: "",
          email: "",
          phone: "",
          role: "",
          password: "",
          staff_id: "",
          address: "",
        });
        toast.success('Staff added successfully!', {id: toastId});
        refreshStaff();
      }
      if(!res.ok){
        toast.error(`${JSON.stringify(resData.message)}`, {id: toastId});
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleSaveProfile = async () => {
     const requestBody = {
      id: companyId,
    name: profileData.name,
    email: profileData.email,
    phone: profileData.phone,
    address: profileData.company || profileData.address, // Fix the field
    website: profileData.website || '',
  };
  try {
    const res = await fetch('https://susu-pro-backend.onrender.com/api/companies/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    console.log(profileData);

    if (res.ok) {
      refreshStaff();
      alert('Profile updated successfully!');
    } else {
      alert('Failed to update profile.');
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Something went wrong.');
  }
};

  const handleSaveNotifications = async (logNotStat: boolean) => {
    try{
      const res = await fetch('https://susu-pro-backend.onrender.com/api/companies/login-notifications', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({companyId: companyId, logNotStat: logNotStat})
      });
      if(res.ok){
        alert('Notification preferences saved successfully!');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Something went wrong.');
    }
  };

  const handleSmsOrEmailNotifications = async (smsEnabled: boolean, emailEnabled: boolean, showWithdrawalAlerts: boolean, systemUpdates: boolean) => {
    try {
      const res = await fetch('https://susu-pro-backend.onrender.com/api/companies/sms-email-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: companyId, smsEnabled: smsEnabled, emailEnabled: emailEnabled, showWithdrawalAlerts: showWithdrawalAlerts, systemUpdates: systemUpdates })
      });

      if (res.ok) {
        alert('Notification preferences saved successfully!');
      }
    } catch (error) {
      console.error('Error saving SMS and Email notification preferences:', error);
      alert('Something went wrong.');
    }
  }

  const handleSaveCompany = () => {
    // Mock save functionality
    alert('Company settings updated!');
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    ...( userRole?.toLowerCase() === 'admin' ? [{ id: 'staff', name: 'Staff', icon: User }] : []),   
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'company', name: 'Company', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={profileData.timezone}
                      onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="GMT">GMT (Greenwich Mean Time)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="WAT">WAT (West Africa Time)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Your address"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          
          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Staff Member</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={staffData.full_name}
                      onChange={(e) => setStaffData({ ...staffData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter staff full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={staffData.email}
                      onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter staff email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={staffData.phone}
                      onChange={(e) => setStaffData({ ...staffData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={staffData.role}
                      onChange={(e) => setStaffData({ ...staffData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select role</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="mobile_banker">Mobile Banker</option>
                      <option value="financial_advisor">Financial Advisor</option>
                      <option value="teller">Teller</option>
                      <option value="loan_officer">Loan Officer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={staffData.password}
                      onChange={(e) => setStaffData({ ...staffData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Id
                    </label>
                    <input
                      type="text"
                      value={staffData.staff_id}
                      onChange={(e) => setStaffData({ ...staffData, staff_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter staff ID"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={staffData.address}
                      onChange={(e) => setStaffData({ ...staffData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Enter staff address"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleAddStaff}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Add Staff
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    Change Password
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                    </div>
                    <button
                      onClick={start2FASetup}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>

                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Login Notifications</div>
                      <div className="text-sm text-gray-600">Get notified when someone logs into your account</div>
                    </div>
                   <input
  type="checkbox"
  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
  checked={loginNotificationsEnabled}
  onChange={async (e) => {
    const enabled = e.target.checked;
    setLoginNotificationsEnabled(enabled);
    console.log(`Enabled: ${enabled}`);
    handleSaveNotifications(enabled);
  }}
/>

                  </div>
                </div>
              </div>
            </div>
          )}


              {qrCode && (
              <div className="space-y-4">
                <p>Scan this QR code with Google Authenticator or Authy:</p>
                <img src={qrCode} alt="QR Code" />
                <p>Or enter this secret manually: <strong>{secret}</strong></p>

                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="border p-2 rounded"
                />

                <button
                  onClick={verifyOtp}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Verify
                </button>
              </div>
            )}


          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-600">Receive notifications via email</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => {
                        setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked });
                        handleSmsOrEmailNotifications(notificationSettings.smsNotifications, e.target.checked, notificationSettings.withdrawalAlerts, notificationSettings.systemUpdates);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">SMS Notifications</div>
                      <div className="text-sm text-gray-600">Receive notifications via SMS</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => {
                        setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked });
                        handleSmsOrEmailNotifications(e.target.checked, notificationSettings.emailNotifications, notificationSettings.withdrawalAlerts, notificationSettings.systemUpdates);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Withdrawal Alerts</div>
                      <div className="text-sm text-gray-600">Get notified about new withdrawal requests</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.withdrawalAlerts}
                      onChange={(e) => {
                        setNotificationSettings({ ...notificationSettings, withdrawalAlerts: e.target.checked });
                        handleSmsOrEmailNotifications(notificationSettings.smsNotifications, notificationSettings.emailNotifications, e.target.checked, notificationSettings.systemUpdates);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">System Updates</div>
                      <div className="text-sm text-gray-600">Receive updates about new features and improvements</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemUpdates}
                      onChange={(e) => {
                        setNotificationSettings({ ...notificationSettings, systemUpdates: e.target.checked });
                        handleSmsOrEmailNotifications(notificationSettings.smsNotifications, notificationSettings.emailNotifications, notificationSettings.withdrawalAlerts, e.target.checked);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => handleSaveNotifications(loginNotificationsEnabled)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companySettings.companyName}
                      onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={companySettings.registrationNumber}
                      onChange={(e) => setCompanySettings({ ...companySettings, registrationNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Company registration number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={companySettings.contactEmail}
                      onChange={(e) => setCompanySettings({ ...companySettings, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="company@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Support Phone
                    </label>
                    <input
                      type="tel"
                      value={companySettings.supportPhone}
                      onChange={(e) => setCompanySettings({ ...companySettings, supportPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={companySettings.currency}
                      onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="GHS">GHS (Ghana Cedi)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={companySettings.language}
                      onChange={(e) => setCompanySettings({ ...companySettings, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="English">English</option>
                      <option value="French">French</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  { userRole === 'admin' ? <button
                    onClick={handleSaveCompany}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save Settings
                  </button>: null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
