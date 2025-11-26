interface SelectableCardProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function SelectableCard({
  isSelected,
  onClick,
  children,
  className = '',
}: SelectableCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl font-semibold transition-all text-left relative
        ${
          isSelected
            ? 'text-white ring-2 ring-amber-500 shadow-lg shadow-amber-500/50 border-2 border-amber-500'
            : 'text-slate-300 hover:bg-slate-700 border-2 border-slate-700 hover:border-emerald-600'
        }
        ${className}
      `}
      style={
        isSelected
          ? { background: 'linear-gradient(to bottom right, #047857, #065f46)' }
          : { backgroundColor: '#1e293b' }
      }
    >
      {children}
    </button>
  );
}
