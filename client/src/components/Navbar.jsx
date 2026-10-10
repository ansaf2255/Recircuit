import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineChip, 
  HiOutlineLogout, 
  HiOutlineCog, 
  HiOutlineShoppingBag, 
  HiOutlineInbox,
  HiOutlinePlusCircle, 
  HiOutlineHome 
} from 'react-icons/hi';

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
    `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
      isActive(path)
        ? 'bg-primary-50 text-primary-700 font-semibold'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-lighter'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.06)]">
      <div className="page-container !py-0">
        <div className="flex items-center justify-between min-h-16 py-1">
          {/* Logo */}
          <Link to={user.role === 'admin' ? '/admin' : user.role === 'recycler' ? '/marketplace' : '/'} className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <HiOutlineChip className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-text-primary tracking-tight leading-none">ReCircuit</span>
              <span className="text-[10px] text-text-muted font-medium tracking-wider uppercase mt-0.5">
                {user.role === 'admin' ? 'Executive Suite' : 'Circular Tech'}
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {user.role === 'admin' ? (
              <Link to="/admin" className={linkClass('/admin')}>
                <HiOutlineCog className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            ) : user.role === 'recycler' ? (
              <>
                <Link to="/marketplace" className={linkClass('/marketplace')}>
                  <HiOutlineShoppingBag className="w-4 h-4" />
                  <span className="hidden md:inline">Recycling Stream</span>
                </Link>

                <Link to="/requests" className={linkClass('/requests')}>
                  <HiOutlineInbox className="w-4 h-4" />
                  <span className="hidden md:inline">Orders & Pickups</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className={linkClass('/')}>
                  <HiOutlineHome className="w-4 h-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>

                {(user.role === 'seller' || user.role === 'refurbisher') && (
                  <Link to="/devices/new" className={linkClass('/devices/new')}>
                    <HiOutlinePlusCircle className="w-4 h-4 text-primary-700" />
                    <span className="hidden md:inline">List Device</span>
                  </Link>
                )}

                <Link to="/marketplace" className={linkClass('/marketplace')}>
                  <HiOutlineShoppingBag className="w-4 h-4" />
                  <span className="hidden md:inline">Marketplace</span>
                </Link>

                <Link to="/requests" className={linkClass('/requests')}>
                  <HiOutlineInbox className="w-4 h-4" />
                  <span className="hidden md:inline">Orders & Requests</span>
                </Link>
              </>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#d3e3fd] text-[#041e49] flex items-center justify-center text-xs font-bold border border-primary-100">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-text-primary leading-tight truncate max-w-[140px]">{user.name}</p>
                  <p className="text-[11px] text-text-muted capitalize leading-tight whitespace-nowrap">
                    {(user.role === 'seller' || user.role === 'refurbisher') ? 'Refurbisher / Consumer' : user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-text-muted hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign out"
              >
                <HiOutlineLogout className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
