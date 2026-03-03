import React, { forwardRef } from 'react';
import './CustomInput.css';

const CustomInput = forwardRef(({
  type = 'text',
  placeholder,
  icon,
  error,
  disabled,
  ...props
}, ref) => {
  return (
    <div className={`custom-input-wrapper ${error ? 'has-error' : ''}`}>
      {icon && (
        <div className="input-icon">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        className={`custom-input ${icon ? 'has-icon' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
      {error && <div className="input-error">{error}</div>}
    </div>
  );
});

CustomInput.displayName = 'CustomInput';

export default CustomInput; 