import React from 'react';

export default function TrocarSenhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout vazio - apenas renderiza o children sem sidebar/header
  // Isso sobrescreve o layout pai (admin)
  return (
    <div className="min-h-screen bg-[#f5f1e9]">
      {children}
    </div>
  );
}

