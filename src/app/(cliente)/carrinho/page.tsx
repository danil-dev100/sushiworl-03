'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';

// TODO: Integrar com Context API ou Zustand para gerenciamento de estado do carrinho
const carrinhoMock = [
  {
    id: 1,
    name: 'Combinado SushiWorld',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJCduwNKfLI8-f3y_C2Au66G5WT16VFNY57DhKBjs1DlvcHdW_8ObjAGdjiq1goxCasQmysZJ0TR4PnW1zhiktWM_pOg2x_EkdiklmzoMB2HSF44uPbRGNgQQctJ-4Hnvma5M1xdjS5NU88h7DoEaLvw280A_quauKGE3Lwkk5eID_I4zfaIPEHFNgIy5rsKGUPEoM3Qiwp10X9NVIrrwisjtuL6ic6IiQTBd8OvL4U1E0Ezldh29WmRvAi1iosWezYFVGWrTbOjE',
    price: 39.90,
    quantity: 2,
  },
  {
    id: 2,
    name: 'Coca-Cola',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmOpkGwGt1cykkweVuAAPmSgnHURXDi5e-UTVzQ6GLPz471Ddzj12GC0V6cmBRCqjAjHByxPXr1N_gRWHSLisjSADCD7SjrwSYvEtizo0yETrSPnsOJ--M6UqDWn__nmrahDlH0EYeXBqpQWZ-4T5HU6qT12tH76Klz9PNpywdpPXLyBawY-VoHbvVnsWcONU_zl2KFSq_RGRzFlnofv4L4t1OxI9GrtmtYKT6q8laixZAxA2kdFyicycCd7R3QLd8l7xbMM5EkfQ',
    price: 2.50,
    quantity: 1,
  },
];

export default function CarrinhoPage() {
  const [items, setItems] = useState(carrinhoMock);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  // TODO: Buscar taxa de IVA das configurações do banco de dados
  const taxaIVA = 13; // Taxa de IVA em percentual (13% conforme especificado)
  
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxaEntrega = 5.00;
  
  // Calcular IVA incluído no subtotal (modo inclusive)
  // Fórmula: IVA = Subtotal - (Subtotal / (1 + Taxa/100))
  const ivaIncluido = subtotal - (subtotal / (1 + taxaIVA / 100));
  
  const total = subtotal + taxaEntrega;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 py-10 sm:px-10 md:px-20 lg:px-40">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#333333] dark:text-[#f5f1e9]">
                Carrinho
              </h1>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-xl text-[#333333]/70 dark:text-[#f5f1e9]/70 mb-6">
                  Seu carrinho está vazio
                </p>
                <Link
                  href="/cardapio"
                  className="flex items-center justify-center rounded-lg h-12 px-6 bg-[#FF6B00] text-white text-base font-bold hover:opacity-90 transition-opacity"
                >
                  Ver Cardápio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {/* Lista de Itens */}
                <main className="col-span-1 flex flex-col gap-6 md:col-span-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 bg-white dark:bg-[#23170f]/50 rounded-xl p-4 shadow-sm"
                    >
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-[#333333] dark:text-[#f5f1e9]">
                            {item.name}
                          </h3>
                          <p className="text-[#333333] dark:text-[#f5f1e9] font-bold mt-1">
                            €{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] hover:bg-[#FF6B00]/30 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium text-[#333333] dark:text-[#f5f1e9] min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] hover:bg-[#FF6B00]/30 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  {/* Order Bump */}
                  <div className="flex items-start gap-4 rounded-lg border-2 border-dashed border-[#FF6B00]/50 bg-[#FF6B00]/10 dark:bg-[#FF6B00]/20 p-4">
                    <input
                      type="checkbox"
                      className="form-checkbox mt-1 h-5 w-5 rounded border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00]"
                      id="order-bump"
                    />
                    <label className="flex-1 cursor-pointer" htmlFor="order-bump">
                      <p className="text-base font-bold text-[#333333] dark:text-[#f5f1e9]">
                        Sim, quero adicionar molho extra por €2,50!
                      </p>
                    </label>
                  </div>
                </main>

                {/* Resumo */}
                <aside className="col-span-1">
                  <div className="sticky top-24 rounded-xl border border-[#ead9cd] dark:border-[#5a4a3e] bg-white dark:bg-[#23170f]/50 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9] mb-6">
                      Resumo do Pedido
                    </h3>
                    <div className="space-y-3 border-b border-[#ead9cd] dark:border-[#5a4a3e] pb-4 mb-4">
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>Subtotal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>Taxa de Entrega</span>
                        <span>€{taxaEntrega.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>IVA ({taxaIVA}% incluído)</span>
                        <span>€{ivaIncluido.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-[#333333] dark:text-[#f5f1e9] mb-2">
                      <span>Total</span>
                      <span>€{total.toFixed(2)}</span>
                    </div>
                    <div className="mb-6 flex justify-end text-xs text-[#333333]/70 dark:text-[#f5f1e9]/70">
                      <span>(IVA incluído)</span>
                    </div>
                    <Link
                      href="/checkout"
                      className="w-full flex items-center justify-center rounded-lg h-12 px-6 bg-[#FF6B00] text-white text-base font-bold hover:opacity-90 transition-opacity"
                    >
                      Ir para o Checkout
                    </Link>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

