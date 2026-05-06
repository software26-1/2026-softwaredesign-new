import React from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--primary-blue)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--border-gray)', color: 'var(--text-dark)', border: 'none' },
  success: { background: 'var(--success-green)', color: '#fff', border: 'none' },
  danger: { background: 'var(--danger-red)', color: '#fff', border: 'none' },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '13px' },
  md: { padding: '10px 20px', fontSize: '14px' },
};

export function Button({ variant = 'primary', size = 'md', style, children, ...props }: ButtonProps) {
  return (
    <button
      style={{
        borderRadius: '4px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: 'all 0.2s',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
