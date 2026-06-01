import React, { useState, ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Banknote,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  User,
  Landmark,
  ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Retrieve current user details from local storage
  const userString = localStorage.getItem('epms_user');
  const user = userString ? JSON.parse(userString) : { username: 'Admin', role: 'System Admin' };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Employee', path: '/employees', icon: Users },
    { name: 'Department', path: '/departments', icon: Building2 },
    { name: 'Salary', path: '/salaries', icon: Banknote },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  ];

  const handleLogout = () => {
    localStorage.removeItem('epms_token');
    localStorage.removeItem('epms_user');
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
    window.location.reload();
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950">
          <Landmark className="h-5 w-5 text-indigo-400 shrink-0" />
          <div>
            <span className="block font-semibold text-white text-sm tracking-tight">PayMaster Ltd</span>
            <span className="block text-[10px] text-slate-500 font-mono tracking-wider -mt-0.5">EPMS v1.0.4</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                id={`sidebar-link-${item.name.toLowerCase()}`}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition duration-200 ${
                  active
                    ? 'bg-slate-800 text-white border-l-2 border-indigo-500 pl-2.5'
                    : 'hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Badge Info / Log out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-md mb-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="h-4 w-4 text-slate-300" />
            </div>
            <div className="truncate">
              <span className="block text-xs font-semibold text-white truncate">{user.username}</span>
              <span className="block text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> {user.role || 'Admin'}
              </span>
            </div>
          </div>
          <button
            id="sidebar-logout-button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition duration-150 cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAVIGATION BAR --- */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 text-slate-300 h-16 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-indigo-400" />
          <span className="font-semibold text-white text-sm tracking-tight">PayMaster Ltd</span>
        </div>
        <button
          id="mobile-menu-toggle-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 hover:bg-slate-800 rounded-md transition"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 text-slate-300 border-b border-slate-800 flex flex-col z-40 select-none animate-slide-in">
          <nav className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition ${
                    active ? 'bg-slate-800 text-white' : 'hover:bg-slate-850'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 text-slate-400" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-rose-400 hover:bg-rose-950/20 transition cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5 text-rose-400" />
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* --- MAIN PAGE VIEW CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-x-hidden min-h-0 bg-slate-50">
        <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
