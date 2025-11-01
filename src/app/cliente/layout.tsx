// /src/app/layout.tsx
export const metadata = {
  title: 'SushiWorld Delivery',
  description: 'O melhor sushi de Santa Iria entregue na sua casa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}