import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineChip, HiOutlineLogout, HiOutlineCog, HiOutlineClipboardList, HiOutlinePlusCircle, HiOutlineHome } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HiOutlineChip className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">ReCircuit</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all">
              <HiOutlineHome className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {user.role === 'seller' && (
              <Link to="/devices/new" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all">
                <HiOutlinePlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">List Device</span>
              </Link>
            )}

            <Link to="/requests" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all">
              <HiOutlineClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
            </Link>

            {user.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all">
                <HiOutlineCog className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* User info + Logout */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-text-primary">{user.name}</p>
                <p className="text-xs text-text-muted capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title="Logout"
              >
                <HiOutlineLogout className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
