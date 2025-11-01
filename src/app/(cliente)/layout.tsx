import React from "react";
import Header from "@/components/cliente/Header";
import Footer from "@/components/cliente/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}