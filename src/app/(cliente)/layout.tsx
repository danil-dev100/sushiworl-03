import Header from '@/components/cliente/Header';
import Footer from '@/components/cliente/Footer';
import { CartProvider } from '@/contexts/CartContext';

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      {children}
      <Footer />
    </CartProvider>
  );
}

