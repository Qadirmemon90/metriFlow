import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixText?: string;
  suffixText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefixText, suffixText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {prefixText && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-xs font-medium text-slate-500">{prefixText}</span>
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block w-full rounded-lg border text-sm transition-all py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              prefixText ? 'pl-12' : ''
            } ${suffixText ? 'pr-12' : ''} ${
              error
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-300 text-slate-900 placeholder-slate-400 bg-white hover:border-slate-400'
            } ${className}`}
            {...props}
          />
          {suffixText && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-xs font-medium text-slate-500">{suffixText}</span>
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
