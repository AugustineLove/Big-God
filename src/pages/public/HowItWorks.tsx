import React from 'react';
import { UserPlus, PiggyBank, TrendingUp, FileText, ArrowRight } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
  icon: UserPlus,
  title: 'Client Registration',
  description: 'Quickly onboard clients with smart digital forms. Capture vital information and create secure profiles with ease.',
  features: ['Essential client details', 'Set contribution rates', 'Profile management']
}
,
{
  icon: PiggyBank,
  title: 'Contribution Management',
  description: 'Designed to support flexible savings schedules. Easily track client contributions and prepare for future integration with payment systems.',
  features: [
    'Support for daily, weekly, or monthly plans',
    'Manual cash tracking',
    'Mobile money integration (in development)',
    'Automated reminders (planned)'
  ]
}
,
    {
  icon: TrendingUp,
  title: 'Growth & Analytics',
  description: 'Planned tools for visualizing client savings growth. Dashboards will help identify trends and measure performance across clients.',
  features: [
    'Growth tracking (planned)',
    'Basic performance metrics',
    'Dashboard design prototypes',
    'Trend analysis (future release)'
  ]
},

    {
  icon: FileText,
  title: 'Reporting & Compliance',
  description: 'Designed to support future compliance needs with structured reports and traceable activities. Features aim to streamline audits and stakeholder reporting.',
  features: [
    'Report generation (planned)',
    'Audit trail logging',
    'Basic export features',
    'Compliance framework (in development)'
  ]
}

  ];

 const traditionalVsDigital = [
  {
    aspect: 'Record Keeping',
    traditional: 'Manual ledger books, prone to errors',
    digital: 'Structured digital records with planned backup systems'
  },
  {
    aspect: 'Client Communication',
    traditional: 'In-person visits or phone calls',
    digital: 'SMS updates and planned mobile notifications'
  },
  {
    aspect: 'Payment Collection',
    traditional: 'Cash only, manual tracking',
    digital: 'Support for mobile money and automated logging (in development)'
  },
  {
    aspect: 'Reporting',
    traditional: 'Time-consuming manual calculations',
    digital: 'Auto-generated reports and analytics (coming soon)'
  },
  {
    aspect: 'Security',
    traditional: 'Physical storage risks',
    digital: 'Cloud-first design with data protection features'
  }
];


  return (
    <div className="py-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-teal-50 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            How SusuPro Works
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Discover how our platform transforms traditional susu contribution schemes 
            into modern, efficient, and transparent financial operations.
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-lg text-gray-600">
              From client onboarding to comprehensive reporting, SusuPro streamlines every aspect of your operation.
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div key={index} className={`flex flex-col lg:flex-row items-center gap-12 ${isEven ? '' : 'lg:flex-row-reverse'}`}>
                  <div className="flex-1">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-indigo-600 to-teal-600 w-16 h-16 rounded-full flex items-center justify-center mr-4">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-indigo-600">Step {index + 1}</span>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {step.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 h-64 flex items-center justify-center">
                        <Icon className="h-24 w-24 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Traditional vs Digital Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Traditional vs Digital Susu
            </h2>
            <p className="text-lg text-gray-600">
              See how digital transformation improves every aspect of susu operations.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              <div className="bg-gray-50 p-6 font-semibold text-gray-900 text-center">
                Aspect
              </div>
              <div className="bg-red-50 p-6 font-semibold text-red-900 text-center">
                Traditional Method
              </div>
              <div className="bg-green-50 p-6 font-semibold text-green-900 text-center">
                SusuPro Digital
              </div>
            </div>
            
            {traditionalVsDigital.map((comparison, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-3 gap-0 ${index % 2 === 0 ? 'bg-gray-25' : 'bg-white'}`}>
                <div className="p-6 font-medium text-gray-900 border-t border-gray-200">
                  {comparison.aspect}
                </div>
                <div className="p-6 text-gray-700 border-t border-gray-200 bg-red-25">
                  {comparison.traditional}
                </div>
                <div className="p-6 text-gray-700 border-t border-gray-200 bg-green-25">
                  {comparison.digital}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Overview */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
            The SusuPro Advantage
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-indigo-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-indigo-900 mb-4">For Administrators</h3>
            <ul className="text-left space-y-2 text-indigo-800">
              <li>• Reduce operational costs through digitization</li>
              <li>• Minimize manual data entry errors</li>
              <li>• Generate insightful reports with ease</li>
              <li>• Designed to scale as your institution grows</li>
            </ul>
          </div>
          
          <div className="bg-teal-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-teal-900 mb-4">For Clients</h3>
            <ul className="text-left space-y-2 text-teal-800">
              <li>• View balances in real time (feature in progress)</li>
              <li>• Receive timely payment reminders</li>
              <li>• Track transparent contribution history</li>
              <li>• Enjoy secure, 24/7 digital access (coming soon)</li>
            </ul>
          </div>
        </div>


          <div className="bg-gradient-to-r from-indigo-600 to-teal-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-indigo-100 mb-6">
              Join the digital revolution in microfinance. Start your free trial today.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;