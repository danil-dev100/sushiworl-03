import ProductCard from './ProductCard';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
}

interface ProductSectionProps {
  title: string;
  products: Product[];
}

export default function ProductSection({ title, products }: ProductSectionProps) {
  const sectionId = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <section id={sectionId}>
      <h2 className="text-primary text-2xl font-bold tracking-tight pb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            description={product.description}
            price={product.price}
            imageUrl={product.image}
            sku={product.id.toString()}
          />
        ))}
      </div>
    </section>
  );
}