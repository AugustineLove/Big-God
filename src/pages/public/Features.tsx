import React from 'react';
import { 
  Users, 
  PiggyBank, 
  FileText, 
  Shield, 
  Smartphone, 
  BarChart3,
  Bell,
  CreditCard,
  Clock,
  TrendingUp,
  Database,
  Download
} from 'lucide-react';

const Features: React.FC = () => {
  const mainFeatures = [
  {
    icon: Users,
    title: 'Client Management',
    description: 'Designing a centralized system to register and manage clients, with support for digital onboarding and profile handling.',
    features: [
      'Basic digital onboarding forms',
      'Planned KYC documentation support',
      'Client profile structure',
      'Future integration of messaging tools'
    ]
  },
  {
    icon: PiggyBank,
    title: 'Contribution Tracking',
    description: 'Building a module to track savings and contributions, with support for manual entries and future mobile money integration.',
    features: [
      'Manual and cash tracking',
      'Basic balance updates',
      'Scheduled contributions setup (planned)',
      'Transaction logging structure'
    ]
  },
  {
    icon: FileText,
    title: 'Reporting Tools',
    description: 'Implementing basic reporting features to support administrative tasks and provide summaries of contributions.',
    features: [
      'Basic report generation',
      'PDF or CSV export options (planned)',
      'Admin summaries for accounts',
      'Visual reporting planned for later phase'
    ]
  },
  {
    icon: Shield,
    title: 'Security & Data Protection',
    description: 'Laying the groundwork for secure data handling, with future plans for full compliance and role-based access controls.',
    features: [
      'Secure data storage setup',
      'Limited access by user role (in progress)',
      'Audit trail design',
      'Compliance features to be added'
    ]
  }
];



  const additionalFeatures = [
  {
    icon: Smartphone,
    title: 'Mobile Optimized (Planned)',
    description: 'Designing a mobile-friendly interface to allow clients to access the platform from any device.'
  },
  {
    icon: Bell,
    title: 'Smart Notifications (Upcoming)',
    description: 'Preparing support for automated SMS and email alerts to keep users informed of due contributions and updates.'
  },
  {
    icon: CreditCard,
    title: 'Payment Integration (Future Scope)',
    description: 'Intending to integrate mobile money, bank, and cash options to simplify contribution tracking and deposits.'
  },
  {
    icon: Clock,
    title: 'Real-time Updates (In Progress)',
    description: 'Working on real-time balance and transaction updates to enhance user transparency and reduce errors.'
  },
  {
    icon: TrendingUp,
    title: 'Growth Analytics (Planned)',
    description: 'Planning visual tools to help analyze savings patterns and measure client growth over time.'
  },
  {
    icon: Database,
    title: 'Data Backup (Proposed)',
    description: 'Laying groundwork for secure cloud backups to protect and restore client and transaction data if needed.'
  }
];


  return (
    <div className="py-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-teal-50 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for Modern Susu
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Everything you need to manage your microfinance operations efficiently, 
            securely, and transparently in one comprehensive platform.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Core Features
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive tools designed specifically for susu contribution schemes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex flex-col">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="bg-gradient-to-r from-indigo-600 to-teal-600 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 ml-16">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Capabilities:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {feature.features.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Additional Capabilities
            </h2>
            <p className="text-lg text-gray-600">
              More features to enhance your susu operations and client experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-indigo-600 to-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why SusuPro Stands Out
            </h2>
            <p className="text-lg text-gray-600">
              Compare our comprehensive feature set with traditional methods.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="p-8 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Manual Process</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li>Paper-based records</li>
                  <li>Manual calculations</li>
                  <li>Limited reporting</li>
                  <li>No automation</li>
                  <li>Security risks</li>
                </ul>
              </div>
              <div className="p-8 text-center bg-indigo-50">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Basic Software</h3>
                <ul className="space-y-3 text-sm text-indigo-700">
                  <li>Basic digital records</li>
                  <li>Simple calculations</li>
                  <li>Limited features</li>
                  <li>No mobile access</li>
                  <li>Minimal support</li>
                </ul>
              </div>
              <div className="p-8 text-center bg-gradient-to-br from-indigo-50 to-teal-50">
                <h3 className="text-xl font-bold text-gray-900 mb-4">SusuPro</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li>✅ Complete digital platform</li>
                  <li>✅ Advanced automation</li>
                  <li>✅ Comprehensive reporting</li>
                  <li>✅ Mobile optimized</li>
                  <li>✅ 24/7 support</li>
                </ul>
                <div className="mt-6">
                  <a
                    href="/signup"
                    className="bg-gradient-to-r from-indigo-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-teal-700 transition-colors"
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Seamless Integration
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            SusuPro integrates with your existing systems and processes, 
            making the transition to digital smooth and efficient.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <Download className="h-8 w-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Easy Data Import</h3>
              <p className="text-indigo-100 text-sm">Import existing client data with our migration tools</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <BarChart3 className="h-8 w-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">API Access</h3>
              <p className="text-indigo-100 text-sm">Connect with third-party tools and services</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <Shield className="h-8 w-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Secure Migration</h3>
              <p className="text-indigo-100 text-sm">Bank-grade security during data transfer</p>
            </div>
          </div>

          <a
            href="/contact"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Schedule Integration Demo
          </a>
        </div>
      </section>
    </div>
  );
};

export default Features;