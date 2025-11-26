import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger';
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const variantStyles = {
    primary: 'bg-gradient-to-br from-purple-900 to-indigo-900 text-amber-200 border-2 border-amber-500 hover:from-purple-800 hover:to-indigo-800',
    success: 'bg-emerald-700 hover:bg-emerald-600 text-amber-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-semibold transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
