import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Shield, 
  BarChart2, 
  Search, 
  FileText, 
  Users, 
  Settings, 
  ChevronDown,
  LogOut,
  Bell,
  Code
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { currentUser } from '../../data/mockData';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);
  
  const navItems = [
    { name: 'Dashboard', icon: <BarChart2 size={20} />, path: '/' },
    { name: 'Scan', icon: <Search size={20} />, path: '/scan' },
    { name: 'Reports', icon: <FileText size={20} />, path: '/reports' },
    { name: 'Team', icon: <Users size={20} />, path: '/team' },
    { name: 'Remediation', icon: <Code size={20} />, path: '/remediation' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold text-white">Vulnalyze</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-3 py-2 text-sm font-medium text-dark-300 rounded-md hover:bg-dark-700 hover:text-white transition-colors"
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Section - Notifications & Profile */}
          <div className="flex items-center">
            {/* Notifications */}
            <button className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-accent-500 ring-2 ring-dark-800"></span>
            </button>
            
            {/* Profile Dropdown */}
            <div className="ml-4 relative">
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-dark-700 focus:outline-none"
              >
                <Avatar 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  size="sm"
                  status="online"
                />
                <span className="hidden md:block text-sm font-medium text-white">{currentUser.name}</span>
                <ChevronDown className="h-4 w-4 text-dark-400" />
              </button>
              
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-dark-800 border border-dark-700 shadow-lg">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-dark-700">
                      <p className="text-sm font-medium text-white">{currentUser.name}</p>
                      <p className="text-xs text-dark-400">{currentUser.email}</p>
                    </div>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-dark-300 hover:bg-dark-700 hover:text-white">
                      Your Profile
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-dark-300 hover:bg-dark-700 hover:text-white">
                      Settings
                    </Link>
                    <button className="w-full text-left px-4 py-2 text-sm text-dark-300 hover:bg-dark-700 hover:text-white flex items-center">
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="ml-2 -mr-2 flex md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-dark-400 hover:text-white hover:bg-dark-700 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-dark-300 hover:bg-dark-700 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}