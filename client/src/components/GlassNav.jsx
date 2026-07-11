import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, Sun, Moon } from 'lucide-react';

export default function GlassNav() {
  const { user, name, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(
    typeof window !== 'undefined' ? document.documentElement.dataset.theme || 'dark' : 'dark'
  );
  const location = useLocation();
  const panelRef = useRef(null);
  const dotRef = useRef(null);

  // Close panel on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle outside click and Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        dotRef.current &&
        !dotRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        // Return focus to the trigger
        if (dotRef.current) dotRef.current.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const togglePanel = () => setIsOpen((v) => !v);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem('ledgerx-theme', newTheme);
  };

  const links = [
    { to: '/receipt', label: 'Receipt' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/deck', label: 'Deck Studio' },
    { to: '/account', label: name || user?.email || 'Account' },
  ];

  const focusRingClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff0000] focus-visible:ring-offset-2";

  return (
    <>
      {/* --- DESKTOP BAR (md: and up) --- */}
      <nav className="hidden md:flex fixed top-5 left-1/2 -translate-x-1/2 z-[40] bg-bg/85 backdrop-blur-md border border-border px-2 py-2 items-center gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `whitespace-nowrap px-4 py-2 font-mono uppercase tracking-[0.12em] text-[11px] font-semibold transition-colors border ${
                isActive
                  ? 'border-text bg-text text-bg'
                  : 'border-transparent text-text-secondary hover:text-text hover:bg-text/5'
              } ${focusRingClasses}`
            }
          >
            {link.label}
          </NavLink>
        ))}
        <div className="w-[1px] h-5 bg-border mx-2"></div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`px-3 py-2 flex items-center justify-center text-text-secondary border border-transparent hover:text-text hover:bg-text/5 transition-colors ${focusRingClasses}`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          type="button"
          onClick={signOut}
          className={`whitespace-nowrap px-4 py-2 flex items-center gap-2 font-mono uppercase tracking-[0.12em] text-[11px] font-semibold text-text-secondary border border-transparent hover:text-accent-red hover:bg-accent-red/10 transition-colors ${focusRingClasses}`}
        >
          <LogOut size={14} />
          Logout
        </button>
      </nav>

      {/* --- MOBILE DOT & PANEL (< md) --- */}
      <div className="md:hidden z-[40]">
        {/* The Panel */}
        <div
          ref={panelRef}
          className={`fixed bottom-24 left-6 bg-bg/95 backdrop-blur-md border border-border p-2 flex flex-col gap-1 transition-all duration-200 transform origin-bottom-left ${
            isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          style={{ zIndex: 40 }}
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap px-5 py-3 font-mono uppercase tracking-[0.12em] text-xs font-semibold transition-colors border ${
                  isActive
                    ? 'border-text bg-text text-bg'
                    : 'border-transparent text-text-secondary hover:text-text hover:bg-text/5'
                } ${focusRingClasses}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="flex items-center gap-2 px-5 py-3">
            <span className="font-mono uppercase tracking-[0.12em] text-xs font-semibold text-text-secondary flex-1">Theme</span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-full border border-border bg-surface text-text hover:border-accent-red hover:text-accent-red transition-colors ${focusRingClasses}`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
          <div className="h-[1px] w-full bg-border my-1"></div>
          <button
            type="button"
            onClick={signOut}
            className={`whitespace-nowrap px-5 py-3 w-full text-left flex items-center gap-3 font-mono uppercase tracking-[0.12em] text-xs font-semibold text-text-secondary border border-transparent hover:text-accent-red hover:bg-accent-red/10 transition-colors ${focusRingClasses}`}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>

        {/* The Dot Trigger */}
        <button
          ref={dotRef}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={togglePanel}
          className={`fixed left-6 z-[40] w-14 h-14 rounded-full bg-bg/85 backdrop-blur-md border border-border flex items-center justify-center text-text hover:bg-bg transition-all ${
            isOpen ? 'bg-text text-bg hover:bg-text' : ''
          } ${focusRingClasses}`}
          style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </>
  );
}
