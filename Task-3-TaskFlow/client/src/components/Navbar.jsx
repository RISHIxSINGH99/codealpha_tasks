import { Link } from "react-router-dom";

/**
 * Top-level brand bar shown on public pages (login, register, 404) -
 * distinct from Header.jsx, which is the in-app authenticated top bar.
 */
const Navbar = () => {
  return (
    <nav className="h-16 flex items-center px-6 border-b border-surface-border">
      <Link to="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-white">
          T
        </div>
        <span className="font-display font-bold text-lg text-gray-100">TaskFlow</span>
      </Link>
    </nav>
  );
};

export default Navbar;
