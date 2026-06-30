/**
 * Small spinner used for in-page loading states (full-page loads,
 * button pending states, suspense fallbacks).
 */
const Loader = ({ size = "md" }) => {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-surface-border border-t-accent`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Loader;
