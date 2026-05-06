import React from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  primary: { background: 'var(--primary-light)', color: '#fff' },
  success: { background: 'var(--success-green)', color: '#fff' },
  warning: { background: 'var(--warning-yellow)', color: '#fff' },
  danger: { background: 'var(--danger-red)', color: '#fff' },
  gray: { background: 'var(--border-gray)', color: 'var(--text-dark)' },
};

export function Badge({ variant = 'primary', children }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
}
