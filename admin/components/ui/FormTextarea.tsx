import { TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function FormTextarea({ label, className = '', ...props }: FormTextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-emerald-400 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 rounded-lg border border-emerald-800 focus:border-emerald-500 focus:outline-none ${className}`}
        style={{ backgroundColor: '#020617', color: '#ffffff' }}
        {...props}
      />
    </div>
  );
}
