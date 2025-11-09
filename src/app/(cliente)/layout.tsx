import Header from '@/components/cliente/Header';
import Footer from '@/components/cliente/Footer';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

