import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      {/* Sidebar will be added here */}
      <aside className="w-64 bg-gray-100 p-4">
        <h2>Admin Menu</h2>
      </aside>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}