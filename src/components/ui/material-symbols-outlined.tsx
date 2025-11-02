import React from 'react';

interface MaterialSymbolsOutlinedProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MaterialSymbolsOutlined({
  name,
  className = '',
  style = {}
}: MaterialSymbolsOutlinedProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={style}
    >
      {name}
    </span>
  );
}