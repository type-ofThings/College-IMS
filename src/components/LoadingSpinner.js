'use client';

export default function LoadingSpinner({ size = 'md', color = 'primary' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4'
  };

  const colors = {
    primary: 'border-[var(--color-primary)]',
    white: 'border-white',
    secondary: 'border-[var(--color-secondary)]'
  };

  return (
    <div className={`${sizes[size]} ${colors[color]} border-t-transparent rounded-full animate-spin`} />
  );
}
