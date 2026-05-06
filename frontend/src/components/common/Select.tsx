import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export function Select({ label, options, placeholder, style, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)' }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid var(--border-gray)',
          borderRadius: '4px',
          fontSize: '14px',
          fontFamily: "'Noto Sans KR', sans-serif",
          background: 'white',
          cursor: 'pointer',
          outline: 'none',
          ...style,
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
