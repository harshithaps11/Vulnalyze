import { Github, Mail, Globe } from 'lucide-react';

interface FooterProps {
  isDarkMode: boolean;
}

export const Footer = ({ isDarkMode }: FooterProps) => {
  return (
    <footer className={`mt-8 py-6 border-t ${
      isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>MANGO</h2>
            <p className={`text-sm mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Security Analysis & Remediation Platform</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <a
              href="/about"
              className={`flex items-center ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-4 h-4 mr-2" />
              About
            </a>
            <a
              href="/contact"
              className={`flex items-center ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact
            </a>
            <a
              href="https://github.com/mango-security"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </a>
          </div>
        </div>
        
        <div className={`mt-6 text-center text-sm ${
          isDarkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>
          © {new Date().getFullYear()} MANGO Security. All rights reserved.
        </div>
      </div>
    </footer>
  );
}; 