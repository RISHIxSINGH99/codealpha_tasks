import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Top bar: hamburger toggle (mobile), search shortcut, and the
 * user menu (profile / logout).
 */
const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-surface-border bg-surface-raised flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-gray-100 p-2"
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className="flex-1 max-w-md hidden sm:block">
        {/* Search lives on its own dedicated flow; this is a quick-access shortcut */}
        <input
          type="text"
          placeholder="Search projects and tasks..."
          className="input-field"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              navigate(`/dashboard?q=${encodeURIComponent(e.target.value.trim())}`);
            }
          }}
        />
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-overlay transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-accent-muted text-accent-hover flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-200">{user?.name}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 card p-1.5 animate-fadeIn">
            <button
              onClick={() => { setMenuOpen(false); navigate("/profile"); }}
              className="w-full text-left text-sm px-3 py-2 rounded-md text-gray-300 hover:bg-surface-overlay transition-colors"
            >
              View profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm px-3 py-2 rounded-md text-danger hover:bg-surface-overlay transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
