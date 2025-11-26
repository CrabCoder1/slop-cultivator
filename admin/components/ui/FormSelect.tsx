import { SelectHTMLAttributes } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function FormSelect({ label, className = '', children, ...props }: FormSelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-emerald-400 mb-2">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 rounded-lg border border-emerald-800 focus:border-emerald-500 focus:outline-none ${className}`}
        style={{ backgroundColor: '#020617', color: '#ffffff', colorScheme: 'dark' }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
