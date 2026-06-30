import { Link } from "react-router-dom";

/**
 * Catch-all 404 page for any unmatched route.
 */
const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-display font-bold text-accent mb-3">404</p>
      <h1 className="text-xl font-display font-semibold text-gray-100 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/dashboard" className="btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
};

export default NotFound;
