import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Award,
  Clock,
  DollarSign,
  BarChart3,
  PiggyBank,
  Smartphone,
  Headphones,
  FileText,
  Sparkles,
  Building2,
  Globe,
  ChevronRight,
  Quote,
  Star,
  Play,
  Zap,
  Lock,
  Heart,
  HandshakeIcon,
  Wallet,
  Calendar,
  Phone,
  MapPin,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from 'lucide-react';

const heroImages = [
  { src: '/manager.jpg', alt: 'Big God Susu Branch Office', label: 'Our Main Branch' },
  { src: '/accountant.png', alt: 'Big God Susu Team', label: 'Dedicated Staff' },
  { src: '/sales_manager.png', alt: 'Happy Clients', label: 'Serving Our Community' },
  { src: '/it-1.png', alt: 'Daily Operations', label: 'Efficient Operations' },
];

const Home: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Customer-focused features - benefits for savers
  const features = [
    {
      icon: Shield,
      title: 'Your Money is Safe',
      description: 'We use secure banking practices and transparent record-keeping to protect every cedi you save with us.',
      gradient: 'from-emerald-600 to-teal-600'
    },
    {
      icon: TrendingUp,
      title: 'Watch Your Savings Grow',
      description: 'Regular contributions add up fast. Our daily susu system helps you build substantial savings over time.',
      gradient: 'from-blue-600 to-cyan-600'
    },
    {
      icon: Clock,
      title: 'Flexible Daily Savings',
      description: 'Save as little as ¢5 per day. Choose contribution amounts that work with your budget and schedule.',
      gradient: 'from-purple-600 to-indigo-600'
    },
    {
      icon: PiggyBank,
      title: 'Reach Your Goals',
      description: 'Whether it\'s school fees, business capital, or a family event - we help you save for what matters.',
      gradient: 'from-amber-600 to-orange-600'
    },
    {
      icon: HandshakeIcon,
      title: 'Trusted Since 2026',
      description: 'Over a decade of serving our community with integrity, transparency, and reliable service.',
      gradient: 'from-rose-600 to-pink-600'
    },
    {
      icon: Smartphone,
      title: 'Easy Access',
      description: 'Check your balance, make contributions, and track your progress - anytime, anywhere.',
      gradient: 'from-green-600 to-emerald-600'
    }
  ];

  // Stats about the company's success
  const stats = [
    { label: 'Active Savers', value: '2,847+', change: '+23%', icon: Users },
    { label: 'Total Savings', value: '¢30.2K+', change: '+18%', icon: DollarSign },
    { label: 'Monthly Payouts', value: '¢342K+', change: '+12%', icon: TrendingUp },
    { label: 'Client Satisfaction', value: '99%', change: '+0.2%', icon: Award }
  ];

  const testimonials = [
    {
      name: 'Sarah Mensah',
      role: 'Market Trader',
      location: 'Accra Central',
      content: 'Big God Susu helped me save enough to expand my business. The daily collection is convenient, and the staff are always friendly.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
    },
    {
      name: 'Michael Osei',
      role: 'Taxi Driver',
      location: 'Kumasi',
      content: 'I never thought I could save this much. The daily reminders and easy payment system made it possible for me to save for my children\'s school fees.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop'
    },
    {
      name: 'Dr. Ama Serwaa',
      role: 'Small Business Owner',
      location: 'Tema',
      content: 'The transparency and regular statements give me peace of mind. I\'ve recommended Big God Susu to all my family members.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop'
    }
  ];

  // Benefits for customers
  const benefits = [
    'Daily collection at your convenience',
    'Transparent record keeping with regular statements',
    'Emergency withdrawal options',
    'Free financial advisory services',
    'Mobile money and cash payment options',
    'Special savings plans for specific goals'
  ];

  const savingPlans = [
    { name: 'Starter Plan', min: '¢5', daily: 'From ¢5/day', target: 'Perfect for daily workers' },
    { name: 'Business Plan', min: '¢20', daily: 'From ¢20/day', target: 'For small business owners' },
    { name: 'Premium Plan', min: '¢50', daily: 'From ¢50/day', target: 'For serious investors' },
    { name: 'Custom Plan', min: 'Custom', daily: 'Tailored to you', target: 'Contact us for special arrangements' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Company Introduction */}
      <section className="relative overflow-hidden min-h-[600px] lg:min-h-[750px]">
        {/* Background Image Slider */}
        <div className="absolute inset-0">
          {heroImages.map((image, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                activeImage === idx ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#25391f]/70 via-[#344a2e]/60 to-[#2d5a3f]/70 z-10" />
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Slider Controls */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveImage(idx);
                setIsPlaying(false);
              }}
              className={`transition-all duration-300 rounded-full ${
                activeImage === idx 
                  ? 'w-8 h-2 bg-teal-400' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`View slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 min-h-[600px] lg:min-h-[700px] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            {/* Left content - Company messaging */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-teal-300" />
                <span className="text-sm font-medium">Trusted by over 400+ Ghanaians</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Big God
                <span className="block text-teal-300 mt-2">Susu Enterprise</span>
              </h1>
              
              <p className="text-lg text-gray-100 mb-8 leading-relaxed">
                Building financial security together. Join Ghana's most trusted susu provider 
                and watch your savings grow with daily contributions, transparent records, 
                and reliable service.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Access Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/contact"
                  className="border-2 border-white/30 hover:border-white text-white hover:bg-white/10 px-8 py-3.5 rounded-xl font-semibold text-center transition-all duration-300 backdrop-blur-sm"
                >
                  Learn About Our Services
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/20">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-teal-400 border-2 border-white flex items-center justify-center text-xs font-bold text-[#344a2e]">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-200">
                  <span className="font-bold text-white">1 year</span> of trusted service
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-teal-400 text-teal-400" />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right content - Welcome Card */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <Building2 className="h-12 w-12 text-teal-300 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">Welcome to Big God Susu</h3>
                  <p className="text-gray-200 text-sm">Your trusted partner in financial growth</p>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-teal-300" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-300">Start saving from as low as</div>
                        <div className="text-xl font-bold text-white">¢5 per day</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-teal-300" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-300">Join our community of</div>
                        <div className="text-xl font-bold text-white">400+ active savers</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-teal-300" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-300">Total savings distributed</div>
                        <div className="text-xl font-bold text-white">¢110.2 K+</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center text-xs text-gray-300">
                  <span className="inline-flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Open an account in 5 minutes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 32L48 42.7C96 53.3 192 74.7 288 74.7C384 74.7 480 53.3 576 42.7C672 32 768 32 864 42.7C960 53.3 1056 74.7 1152 74.7C1248 74.7 1344 53.3 1392 42.7L1440 32V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V32Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section - Company achievements */}
      <section className="py-16 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="inline-flex p-3 bg-[#344a2e]/10 rounded-xl mb-4">
                    <Icon className="h-6 w-6 text-[#344a2e]" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">{stat.label}</div>
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change} growth
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Customer benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#344a2e]/10 rounded-full px-4 py-1.5 mb-4">
              <Heart className="h-4 w-4 text-[#344a2e]" />
              <span className="text-sm font-medium text-[#344a2e]">Why Choose Us</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Ghanaians Trust Big God Susu
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've been helping hardworking Ghanaians achieve their financial goals 
              through reliable, transparent susu savings for over a decade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent"
                >
                  <div className={`bg-gradient-to-r ${feature.gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
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

      {/* Saving Plans Section - What we offer */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-1.5 mb-4">
              <PiggyBank className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-600">Our Plans</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Savings Plans for Every Budget
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose a plan that fits your income and savings goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {savingPlans.map((plan, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-teal-600 mb-2">{plan.min}</div>
                  <p className="text-sm text-gray-500 mb-3">{plan.daily}</p>
                  <p className="text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1 inline-block">{plan.target}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-[#344a2e] font-semibold hover:gap-3 transition-all duration-300"
            >
              Need a custom plan? Contact us for personalized options
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section - Detailed customer value */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-50 rounded-full px-4 py-1.5 mb-4">
                <Zap className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-600">What We Offer</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                More Than Just Savings
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                When you save with Big God Susu, you get access to a range of benefits 
                designed to help you achieve financial freedom and security.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-all duration-300"
              >
                Start Your Savings Journey
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-teal-100 rounded-2xl -z-10" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#344a2e]/10 rounded-2xl -z-10" />
              
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">How It Works</h3>
                    <p className="text-xs text-gray-500">Simple 3-step process</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <div className="font-medium text-gray-900">Visit our office or register online</div>
                      <div className="text-sm text-gray-500">Fill out our simple registration form</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <div className="font-medium text-gray-900">Choose your savings plan</div>
                      <div className="text-sm text-gray-500">Select daily amount that works for you</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <div className="font-medium text-gray-900">Start saving daily</div>
                      <div className="text-sm text-gray-500">Watch your savings grow over time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Social proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#344a2e]/10 rounded-full px-4 py-1.5 mb-4">
              <Quote className="h-4 w-4 text-[#344a2e]" />
              <span className="text-sm font-medium text-[#344a2e]">Success Stories</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Savers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from real people who achieved their goals with Big God Susu
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, idx) => (
                  <div key={idx} className="w-full flex-shrink-0 px-4">
                    <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
                      <div className="flex items-center gap-4 mb-6">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                          <p className="text-sm text-gray-500">{testimonial.role}</p>
                          <p className="text-xs text-teal-600">{testimonial.location}</p>
                        </div>
                        <div className="ml-auto flex gap-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <Quote className="h-8 w-8 text-teal-200 absolute -top-2 -left-2" />
                        <p className="text-gray-600 italic pl-6 leading-relaxed">
                          "{testimonial.content}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`transition-all duration-300 ${
                    activeTestimonial === idx 
                      ? 'w-8 h-2 bg-[#344a2e] rounded-full' 
                      : 'w-2 h-2 bg-gray-300 rounded-full'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <Lock className="h-8 w-8 text-[#344a2e] mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Secure & Transparent</h4>
                  <p className="text-sm text-gray-500">Your savings are tracked with precision</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <Users className="h-8 w-8 text-teal-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Community Focused</h4>
                  <p className="text-sm text-gray-500">We're invested in your success</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <Clock className="h-8 w-8 text-[#344a2e] mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">1 Year Experience</h4>
                  <p className="text-sm text-gray-500">Decade of trusted service</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <HandshakeIcon className="h-8 w-8 text-teal-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Fair & Honest</h4>
                  <p className="text-sm text-gray-500">No hidden fees or surprises</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-[#344a2e]/10 rounded-full px-4 py-1.5 mb-4">
                <Shield className="h-4 w-4 text-[#344a2e]" />
                <span className="text-sm font-medium text-[#344a2e]">Your Trust Matters</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Safe, Secure, and Reliable
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We take our responsibility to protect your hard-earned money seriously. 
                Our systems and processes are designed with your security and peace of mind as the top priority.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-teal-600" />
                  <span className="text-gray-700">Regular account statements provided</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-teal-600" />
                  <span className="text-gray-700">24/7 access to your savings information</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-teal-600" />
                  <span className="text-gray-700">Professional, trained staff at all branches</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Strong call to action */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-r from-[#25391f] via-[#344a2e] to-teal-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Headphones className="h-4 w-4 text-teal-300" />
            <span className="text-sm font-medium text-white">Start Your Journey Today</span>
          </div>
          
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Saving?
          </h2>
          
          <p className="text-xl text-gray-100 mb-8 leading-relaxed">
            Join thousands of Ghanaians who trust Big God Susu with their savings goals. 
            Open your account today and take the first step toward financial security.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg"
            >
              Open an Account
            </Link>
            <Link
              to="/contact"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 border border-white/20"
            >
              Contact Us
            </Link>
          </div>
          
          <p className="text-sm text-gray-200 mt-6">
            Have questions? Call us at <span className="font-semibold">+233 54 238 4752</span> our office
          </p>
        </div>
      </section>

      
    </div>
  );
};

export default Home;