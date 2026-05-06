import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)' }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid var(--border-gray)',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: "'Noto Sans KR', sans-serif",
          outline: 'none',
          ...style,
        }}
        {...props}
      />
    </div>
  );
}
