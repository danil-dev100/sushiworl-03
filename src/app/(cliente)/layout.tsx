import React from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Header and Footer will be added here
  return <main>{children}</main>;
}