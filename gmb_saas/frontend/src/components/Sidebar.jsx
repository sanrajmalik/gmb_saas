import { LayoutDashboard, Map, BarChart3, Settings, Database, TrendingUp, LogOut, Coins } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const links = [
        { icon: LayoutDashboard, label: 'Overview', path: '/' },
        { icon: Database, label: 'Listing Management', path: '/listings' },
        { icon: BarChart3, label: 'Rank Tracking', path: '/rankings' },
        { icon: Map, label: 'Geo Grid', path: '/geogrid' },
        { icon: TrendingUp, label: 'Competitors', path: '/competitors' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '8px' }}></div>
                Local AI
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {links.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            div 
                            ${isActive ? 'bg-primary' : 'hover:bg-gray-800'}
                        `}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            color: isActive ? 'white' : '#9ca3af',
                            backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.2s'
                        })}
                    >
                        <item.icon size={20} style={{ marginRight: '0.75rem' }} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile Section */}
            {user && (
                <div className="mt-auto pt-4 border-t border-slate-700">
                    {/* Credits Display */}
                    <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-slate-800/50 rounded-lg">
                        <Coins size={18} className="text-yellow-500" />
                        <span className="text-sm text-slate-300">
                            <span className="font-semibold text-white">{user.credits ?? 0}</span> Credits
                        </span>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                            {user.tier || 'Free'}
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 px-3 py-2">
                        <img
                            src={user.pictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6366f1&color=fff`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;

