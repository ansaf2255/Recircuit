import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineChip, HiOutlineLogout, HiOutlineCog, HiOutlineClipboardList, HiOutlinePlusCircle, HiOutlineHome } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-primary-500/15 text-primary-600'
        : 'text-text-muted hover:text-text-primary hover:bg-surface-lighter'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-surface/80 backdrop-blur-2xl">
      <div className="page-container !py-0">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <HiOutlineChip className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">ReCircuit</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link to="/" className={linkClass('/')}>
              <HiOutlineHome className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {user.role === 'seller' && (
              <Link to="/devices/new" className={linkClass('/devices/new')}>
                <HiOutlinePlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">List Device</span>
              </Link>
            )}

            {user.role !== 'seller' && (
              <Link to="/marketplace" className={linkClass('/marketplace')}>
                <HiOutlineClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Marketplace</span>
              </Link>
            )}

            <Link to="/requests" className={linkClass('/requests')}>
              <HiOutlineClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
            </Link>

            {user.role === 'admin' && (
              <Link to="/admin" className={linkClass('/admin')}>
                <HiOutlineCog className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* User info + Logout */}
            <div className="flex items-center gap-3 ml-3 pl-3 border-l border-border/60">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary leading-tight">{user.name}</p>
                  <p className="text-[11px] text-text-muted capitalize leading-tight">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
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
