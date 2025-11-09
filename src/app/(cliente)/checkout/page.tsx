'use client';

import { useState } from 'react';
import Image from 'next/image';

// TODO: Integrar com API de pedidos e Context do carrinho
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

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [valorEntregue, setValorEntregue] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const subtotal = carrinhoMock.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxaEntrega = 5.00;
  const total = subtotal + taxaEntrega;
  const iva = total * 0.13;

  const troco = valorEntregue ? parseFloat(valorEntregue) - total : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar lógica de envio do pedido
    setShowSuccessModal(true);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f1e9] dark:bg-[#23170f]">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 py-10 sm:px-10 md:px-20 lg:px-40">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-[#333333] dark:text-[#f5f1e9]">
                Finalizar Pedido
              </h1>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <main className="col-span-1 flex flex-col gap-8 md:col-span-2">
                  {/* Dados do Cliente */}
                  <div className="flex flex-col">
                    <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#333333] dark:text-[#f5f1e9]">
                      Seus Dados
                    </h2>
                    <div className="grid grid-cols-1 gap-4 px-4 py-3 sm:grid-cols-2">
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Nome*
                        </p>
                        <input
                          required
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Digite seu nome"
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Sobrenome*
                        </p>
                        <input
                          required
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Digite seu sobrenome"
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          E-mail*
                        </p>
                        <input
                          required
                          type="email"
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="seu.email@exemplo.com"
                        />
                      </label>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Telefone*
                        </p>
                        <input
                          required
                          type="tel"
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="+351 XXX XXX XXX"
                        />
                      </label>
                      <label className="flex flex-col sm:col-span-2">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Endereço Completo*
                        </p>
                        <input
                          required
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Rua, Número, Bairro, Cidade"
                        />
                      </label>
                      <label className="flex flex-col sm:col-span-2">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          NIF <span className="text-sm font-normal text-[#333333]/70 dark:text-[#f5f1e9]/70">(Opcional)</span>
                        </p>
                        <input
                          className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Digite seu NIF"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Forma de Pagamento */}
                  <div className="flex flex-col">
                    <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#333333] dark:text-[#f5f1e9]">
                      Forma de Pagamento
                    </h2>
                    <div className="space-y-4 px-4 py-3">
                      <div className={`flex flex-col gap-4 rounded-lg border p-4 ${paymentMethod === 'cash' ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/50' : 'border-[#ead9cd] dark:border-[#5a4a3e]'}`}>
                        <div className="flex items-center gap-4">
                          <input
                            checked={paymentMethod === 'cash'}
                            onChange={() => setPaymentMethod('cash')}
                            className="h-5 w-5 border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00]"
                            id="payment-cash"
                            name="payment-method"
                            type="radio"
                          />
                          <label className="flex-1 text-base font-medium cursor-pointer text-[#333333] dark:text-[#f5f1e9]" htmlFor="payment-cash">
                            Dinheiro
                          </label>
                        </div>
                        {paymentMethod === 'cash' && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                            <label className="flex flex-1 flex-col">
                              <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                                Valor entregue <span className="text-sm font-normal text-[#333333]/70 dark:text-[#f5f1e9]/70">(Opcional)</span>
                              </p>
                              <input
                                type="number"
                                step="0.01"
                                value={valorEntregue}
                                onChange={(e) => setValorEntregue(e.target.value)}
                                className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                                placeholder="Ex: €50,00"
                              />
                            </label>
                            {valorEntregue && troco >= 0 && (
                              <div className="flex h-14 items-center rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9]/50 dark:bg-[#23170f]/50 px-4">
                                <p className="text-base text-[#333333] dark:text-[#f5f1e9]">
                                  Troco: <span className="font-bold">€{troco.toFixed(2)}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-4 rounded-lg border p-4 ${paymentMethod === 'card' ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/50' : 'border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f]'}`}>
                        <input
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          className="h-5 w-5 border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00]"
                          id="payment-card"
                          name="payment-method"
                          type="radio"
                        />
                        <label className="flex-1 text-base font-medium cursor-pointer text-[#333333] dark:text-[#f5f1e9]" htmlFor="payment-card">
                          Cartão
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do Pedido */}
                  <div className="flex flex-col">
                    <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#333333] dark:text-[#f5f1e9]">
                      Detalhes do Pedido
                    </h2>
                    <div className="space-y-4 px-4 py-3">
                      <div className="flex items-end gap-3">
                        <label className="flex flex-1 flex-col">
                          <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                            Cupom de Desconto
                          </p>
                          <input
                            className="form-input h-14 w-full flex-1 resize-none overflow-hidden rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-[15px] text-base font-normal leading-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                            placeholder="Insira seu cupom"
                          />
                        </label>
                        <button
                          type="button"
                          className="flex h-14 items-center justify-center rounded-lg bg-[#FF6B00]/20 px-6 text-base font-bold text-[#FF6B00] transition-colors hover:bg-[#FF6B00]/30 dark:bg-[#FF6B00]/30 dark:hover:bg-[#FF6B00]/40"
                        >
                          Aplicar
                        </button>
                      </div>
                      <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-[#333333] dark:text-[#f5f1e9]">
                          Observações
                        </p>
                        <textarea
                          className="form-textarea w-full resize-y rounded-lg border border-[#ead9cd] dark:border-[#5a4a3e] bg-[#f5f1e9] dark:bg-[#23170f] p-4 text-base font-normal placeholder-[#333333]/50 dark:placeholder-[#f5f1e9]/50 focus:border-[#FF6B00] focus:outline-0 focus:ring-0"
                          placeholder="Ex: Tirar a cebola, ponto da carne, etc."
                          rows={4}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Order Bump */}
                  <div className="flex flex-col gap-6 px-4 py-3">
                    <div className="flex items-start gap-4 rounded-lg border-2 border-dashed border-[#FF6B00]/50 bg-[#FF6B00]/10 dark:bg-[#FF6B00]/20 p-4">
                      <input
                        className="form-checkbox mt-1 h-5 w-5 rounded border-[#ead9cd] dark:border-[#5a4a3e] text-[#FF6B00] focus:ring-[#FF6B00]"
                        id="order-bump"
                        type="checkbox"
                      />
                      <label className="flex-1 cursor-pointer" htmlFor="order-bump">
                        <p className="text-base font-bold text-[#333333] dark:text-[#f5f1e9]">
                          Sim, quero adicionar molho extra por €2,50!
                        </p>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="h-14 w-full rounded-lg bg-[#FF6B00] text-lg font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Finalizar Pedido
                    </button>
                  </div>
                </main>

                {/* Resumo */}
                <aside className="col-span-1 hidden md:block">
                  <div className="sticky top-10 rounded-xl border border-[#ead9cd] dark:border-[#5a4a3e] bg-white dark:bg-[#23170f]/50 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-[#333333] dark:text-[#f5f1e9]">Resumo do Pedido</h3>
                    <div className="mt-6 space-y-4 border-b border-[#ead9cd] dark:border-[#5a4a3e] pb-4">
                      {carrinhoMock.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="rounded-md object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                                {item.quantity}x {item.name}
                              </span>
                            </div>
                          </div>
                          <span className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                            €{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>Subtotal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#333333]/80 dark:text-[#f5f1e9]/80">
                        <span>Taxa de Entrega</span>
                        <span>€{taxaEntrega.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
                        <span>Total</span>
                        <span>€{total.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex justify-end text-sm text-[#333333]/70 dark:text-[#f5f1e9]/70">
                        <span>(Inclui €{iva.toFixed(2)} de IVA a 13%)</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl bg-[#f5f1e9] dark:bg-[#23170f] p-8 text-center shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <span className="text-4xl text-green-600 dark:text-green-400">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">Pedido Recebido!</h2>
            <p className="text-[#333333]/80 dark:text-[#f5f1e9]/80">
              Seu pedido está aguardando confirmação do restaurante. Você receberá uma notificação assim que for aceito.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 h-12 w-full rounded-lg bg-[#FF6B00] font-bold text-white hover:opacity-90 transition-opacity"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Erro */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl bg-[#f5f1e9] dark:bg-[#23170f] p-8 text-center shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <span className="text-4xl text-red-600 dark:text-red-400">✕</span>
            </div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-[#f5f1e9]">Pedido Não Confirmado</h2>
            <p className="text-[#333333]/80 dark:text-[#f5f1e9]/80">
              Lamentamos, mas não podemos aceitar seu pedido no momento devido à alta demanda.
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="mt-4 h-12 w-full rounded-lg bg-[#FF6B00] font-bold text-white hover:opacity-90 transition-opacity"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

