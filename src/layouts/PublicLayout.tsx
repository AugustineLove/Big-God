import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, CreditCard, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const PublicLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white fixed z-20 w-full shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-1">
              <Link to="/" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="SusuPro"
                  className="
                    h-10 sm:h-12 md:h-14 lg:h-16
                    w-auto
                    -mr-1
                    object-contain
                  "
                />
              </Link>

              <p className="text-sm sm:text-base md:text-lg font-medium">
                Big God
              </p>
            </div>


            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-[#1f8e01]'
                      : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/login"
                className="bg-[#344a2e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#367126] transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="border-2 border-[#344a2e] text-[#344a2e] hover:bg-[#344a2e] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-indigo-600"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'text-indigo-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="border-2 border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium text-center"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Big God Susu Enterprise</h3>
              <p className="text-sm">Building financial security together since 2010.</p>
              <div className="flex gap-3 mt-4">
                <Facebook className="h-5 w-5 hover:text-teal-400 cursor-pointer" />
                <Twitter className="h-5 w-5 hover:text-teal-400 cursor-pointer" />
                <Instagram className="h-5 w-5 hover:text-teal-400 cursor-pointer" />
                <Linkedin className="h-5 w-5 hover:text-teal-400 cursor-pointer" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-teal-400">About Us</Link></li>
                <li><Link to="/services" className="hover:text-teal-400">Our Services</Link></li>
                <li><Link to="/contact" className="hover:text-teal-400">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-teal-400">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Contact Info</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Agona-Nkwanta, Ghana</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +233 54 238 4752</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> bigodsusuenterprise@gmail.com</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Office Hours</h4>
              <ul className="space-y-2 text-sm">
                <li>Monday - Friday: 8am - 4pm</li>
                <li>Saturday: Closed</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Big God Susu Enterprise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;