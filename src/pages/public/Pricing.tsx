import React from 'react';
import { Check, X, Star, ArrowRight } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '${99',
      period: '/month',
      description: 'Perfect for very small susu groups and startups',
      features: [
        'Up to 50 clients',
        'Basic contribution tracking',
        'Monthly reports',
        'Email support',
        'Mobile access',
        'Data backup'
      ],
      limitations: [
        'Advanced analytics',
        'SMS notifications',
        'Custom branding',
        'API access'
      ],
      popular: false,
      buttonText: 'Start Free Trial',
      buttonClass: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
    },
    {
      name: 'Professional',
      price: '${299',
      period: '/month',
      description: 'Ideal for established microfinance institutions',
      features: [
        'Up to 500 clients',
        'Advanced contribution tracking',
        'Automated SMS notifications',
        'Custom reports & analytics',
        'Priority support',
        'Mobile access',
        'Data backup',
        'Multi-user access',
        'Withdrawal management',
        'Custom branding'
      ],
      limitations: [
        'API access',
        'White-label solution'
      ],
      popular: true,
      buttonText: 'Start Free Trial',
      buttonClass: 'bg-indigo-600 text-white hover:bg-indigo-700'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with specific requirements',
      features: [
        'Unlimited clients',
        'Full feature access',
        'Custom integrations',
        'API access',
        'White-label solution',
        'Dedicated support',
        'Training & onboarding',
        'Custom reports',
        'Advanced security',
        'SLA guarantee'
      ],
      limitations: [],
      popular: false,
      buttonText: 'Contact Sales',
      buttonClass: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white'
    }
  ];

  const faqs = [
    {
      question: 'Is there a free trial available?',
      answer: 'Yes! We offer a 30-day free trial for all plans. No credit card required to start.'
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Absolutely. You can change your plan at any time from your account settings. Changes take effect immediately.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, mobile money payments, and bank transfers for Ghanaian customers.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use bank-grade encryption and security measures. Your data is backed up daily and stored securely in the cloud.'
    },
    {
      question: 'Do you offer customer support?',
      answer: 'Yes, we provide email support for all plans, with priority support for Professional and Enterprise customers.'
    },
    {
      question: 'Can I import my existing client data?',
      answer: 'Yes, we provide data migration tools and assistance to help you import your existing client information.'
    }
  ];

  return (
    <div className="py-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-teal-50 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Choose the perfect plan for your susu operations. Start with a free trial, 
            no commitment required.
          </p>
          <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-lg">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">30-day free trial on all plans</span>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl shadow-xl border-2 transition-transform duration-300 hover:scale-105 ${
                plan.popular ? 'border-indigo-500' : 'border-gray-200'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      {plan.period && <span className="text-gray-600 ml-1">{plan.period}</span>}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 mb-4">What's included:</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-semibold text-gray-900 mb-4">Not included:</h4>
                      <ul className="space-y-3">
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <li key={limitationIndex} className="flex items-center">
                            <X className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                            <span className="text-gray-500">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button className={`w-full py-4 rounded-lg font-semibold transition-colors ${plan.buttonClass}`}>
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Compare All Features
            </h2>
            <p className="text-lg text-gray-600">
              See exactly what's included in each plan to make the best choice for your needs.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Features</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Starter</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900 bg-indigo-50">Professional</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { feature: 'Number of Clients', starter: '50', pro: '500', enterprise: 'Unlimited' },
                    { feature: 'Contribution Tracking', starter: true, pro: true, enterprise: true },
                    { feature: 'Mobile Access', starter: true, pro: true, enterprise: true },
                    { feature: 'Basic Reports', starter: true, pro: true, enterprise: true },
                    { feature: 'SMS Notifications', starter: false, pro: true, enterprise: true },
                    { feature: 'Advanced Analytics', starter: false, pro: true, enterprise: true },
                    { feature: 'Multi-user Access', starter: false, pro: true, enterprise: true },
                    { feature: 'Custom Branding', starter: false, pro: true, enterprise: true },
                    { feature: 'API Access', starter: false, pro: false, enterprise: true },
                    { feature: 'White-label Solution', starter: false, pro: false, enterprise: true },
                    { feature: 'Dedicated Support', starter: false, pro: false, enterprise: true },
                  ].map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="px-6 py-4 font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-gray-400 mx-auto" />
                        ) : (
                          <span className="text-gray-700">{row.starter}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center bg-indigo-25">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-gray-400 mx-auto" />
                        ) : (
                          <span className="text-gray-700">{row.pro}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-gray-400 mx-auto" />
                        ) : (
                          <span className="text-gray-700">{row.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Get answers to common questions about our pricing and plans.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
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
            Start your 30-day free trial today. No credit card required, 
            cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Schedule Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;