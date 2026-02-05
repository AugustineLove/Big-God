import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, TrendingUp, Users, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
  icon: Shield,
  title: 'Built for Security',
  description: 'Designed with security and transparency in mind for future transactions'
}
,
    {
      icon: TrendingUp,
      title: 'Growth Tracking',
      description: 'Monitor savings growth and contribution patterns with detailed analytics'
    },
    {
      icon: Users,
      title: 'Client Management',
      description: 'Comprehensive client database with contribution history and profiles'
    }
  ];

  const stats = [
    { label: 'Active Clients', value: '10,000+' },
    { label: 'Customers Served', value: '5,000+' },
    { label: 'Success Rate', value: '99.9%' },
    { label: 'Years Experience', value: '2+' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-teal-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Microfinance
                <span className="block text-teal-300">Simplified</span>
              </h1>
              <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                Transform traditional susu contribution schemes with modern digital efficiency. 
                Manage clients, track progress, and generate reports all in one secure platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="border-2 border-white text-white hover:bg-white hover:text-indigo-900 px-8 py-4 rounded-lg font-semibold text-center transition-all duration-300"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-200">Total Balance</span>
                    <span className="text-2xl font-bold">¢45,230</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-200">Active Clients</span>
                    <span className="text-xl font-semibold">128</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-200">This Month</span>
                    <span className="text-xl font-semibold text-teal-300">+12.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SusuPro?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for microfinance institutions running traditional susu schemes, 
              with modern technology and user-friendly interfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-indigo-600 to-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Streamline Your Susu Operations
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Say goodbye to manual record-keeping and embrace digital efficiency. 
                Our platform automates routine tasks while maintaining the personal 
                touch your clients expect.
              </p>
              
              <div className="space-y-4">
                {[
                  'Automated contribution tracking and reminders',
                  'Real-time balance updates and transaction history',
                  'Comprehensive reporting and analytics',
                  'Secure client data management',
                  'Mobile-friendly interface for on-the-go access'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-teal-50 rounded-2xl p-8">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 text-sm font-medium">PL</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Priscilla Love</div>
                        <div className="text-xs text-gray-500">Contribution received</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">+$500</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-600 text-sm font-medium">DD</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Daniel De-Graft</div>
                        <div className="text-xs text-gray-500">Withdrawal approved</div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-orange-600">-$200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Susu Operations?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of microfinance institutions already using SusuPro to 
            streamline their operations and serve their clients better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Get started
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;