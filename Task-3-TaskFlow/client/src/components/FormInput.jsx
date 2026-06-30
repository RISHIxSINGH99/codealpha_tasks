/**
 * Standardized labeled input used across auth and form pages so
 * label/spacing/error styling stays consistent everywhere.
 */
const FormInput = ({ label, error, ...inputProps }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input className="input-field" {...inputProps} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
};

export default FormInput;
