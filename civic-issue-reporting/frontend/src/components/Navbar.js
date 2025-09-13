import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  UserIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  MapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: t('nav.home'), href: '/', icon: HomeIcon },
    { name: t('nav.complaints'), href: '/complaints', icon: ClipboardDocumentListIcon },
    { name: t('nav.communities'), href: '/communities', icon: UserGroupIcon },
    { name: t('nav.map'), href: '/map', icon: MapIcon },
  ];

  const protectedNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: ChartBarIcon },
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ];

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const NavLink = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const activeClass = isActive(item.href)
      ? 'bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300';

    const baseClass = mobile
      ? 'block px-3 py-2 text-base font-medium rounded-md'
      : 'inline-flex items-center px-1 pt-1 pb-4 border-b-2 text-sm font-medium';

    return (
      <Link
        to={item.href}
        className={`${baseClass} ${activeClass} transition-colors duration-200`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon className="h-5 w-5 mr-2" />
        {item.name}
      </Link>
    );
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <div className="bg-primary-600 rounded-lg p-2">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  CivicConnect
                </span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
              {isAuthenticated && protectedNavigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>
          </div>

          {/* Right side items */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {/* Language selector */}
            <Menu as="div" className="relative">
              <Menu.Button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <LanguageIcon className="h-6 w-6" />
              </Menu.Button>
              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  {languages.map((language) => (
                    <Menu.Item key={language.code}>
                      {({ active }) => (
                        <button
                          onClick={() => changeLanguage(language.code)}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                        >
                          <span className="mr-2">{language.flag}</span>
                          {language.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {darkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user?.avatar || 'https://via.placeholder.com/150x150/009688/ffffff?text=User'}
                    alt={user?.name}
                  />
                </Menu.Button>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } block px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                        >
                          {t('nav.profile')}
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                        >
                          {t('nav.logout')}
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary px-4 py-2 text-sm font-medium rounded-md"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <Transition
        show={isMobileMenuOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} mobile />
            ))}
            {isAuthenticated && protectedNavigation.map((item) => (
              <NavLink key={item.name} item={item} mobile />
            ))}
          </div>
          
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={user?.avatar || 'https://via.placeholder.com/150x150/009688/ffffff?text=User'}
                    alt={user?.name}
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">
                    {user?.name}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4 px-4">
                <Link
                  to="/login"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary px-4 py-2 text-base font-medium rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('nav.signup')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </Transition>
    </nav>
  );
};

export default Navbar;