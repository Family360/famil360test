import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'url' | 'search';
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
  error?: string;
  success?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

const Input = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  className = '',
  icon,
  error,
  success,
  disabled = false,
  min,
  max,
  step,
  autoComplete,
  autoFocus = false,
  name,
  id,
  onBlur,
  onFocus,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const getInputType = () => {
    if (type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium transition-colors duration-200',
            error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-700 dark:text-gray-300',
            disabled && 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
          )}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div
            className={cn(
              'absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 z-10',
              error ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-400 dark:text-gray-500',
              disabled && 'text-gray-300 dark:text-gray-600'
            )}
          >
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          name={name}
          type={getInputType()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'w-full px-4 py-3 border rounded-xl transition-all duration-200',
            'focus:ring-2 focus:outline-none',
            icon ? 'pl-10' : 'pl-4',
            type === 'password' ? 'pr-10' : error || success ? 'pr-10' : '',
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/50'
              : success
              ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50/50'
              : 'border-gray-200 dark:border-gray-700 focus:ring-orange-500 focus:border-transparent',
            disabled && 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed',
            !disabled && 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            isFocused && !error && !success && 'ring-2 ring-orange-500/50 shadow-md' // Use isFocused for styling
          )}
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff size={18} className={disabled ? 'opacity-50' : ''} />
            ) : (
              <Eye size={18} className={disabled ? 'opacity-50' : ''} />
            )}
          </button>
        )}

        {error && type !== 'password' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle size={18} />
          </div>
        )}
        
        {success && type !== 'password' && !error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <CheckCircle size={18} />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {success && !error && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle size={14} />
          {success}
        </p>
      )}
    </div>
  );
};

export default Input;