import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ title, children, style }: CardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-gray)',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}
