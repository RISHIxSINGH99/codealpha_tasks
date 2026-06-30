import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/projects", label: "Projects", icon: "▤" },
  { to: "/profile", label: "Profile", icon: "◍" },
];

/**
 * Persistent left navigation. Collapses off-canvas on small screens
 * and is toggled by Header's menu button via the `open` prop.
 */
const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-surface-raised border-r border-surface-border
        transform transition-transform duration-200 lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-6 py-5 flex items-center gap-2 border-b border-surface-border">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-white">
            T
          </div>
          <span className="font-display font-bold text-lg text-gray-100">TaskFlow</span>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                ${isActive
                  ? "bg-accent-muted text-accent-hover"
                  : "text-gray-400 hover:bg-surface-overlay hover:text-gray-100"}`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
