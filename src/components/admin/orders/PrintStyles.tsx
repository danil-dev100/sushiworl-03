'use client';

export default function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: 80mm auto;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
        }

        /* Ocultar tudo exceto o recibo durante impressão */
        body > *:not(.print-receipt) {
          display: none !important;
        }

        .print-receipt {
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }

        /* Garantir que cores sejam impressas */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Evitar quebras de página indesejadas */
        .no-page-break {
          page-break-inside: avoid;
        }
      }
    `}</style>
  );
}
