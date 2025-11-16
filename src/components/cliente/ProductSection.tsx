import ProductCard from './ProductCard';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price: string;
  discountPrice?: string;
  category: string;
  image: string;
}

interface ProductSectionProps {
  products: Product[];
}

export default function ProductSection({ products }: ProductSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          productId={typeof product.id === 'string' ? product.id : product.id.toString()}
          name={product.name}
          description={product.description}
          price={product.price}
          discountPrice={product.discountPrice}
          imageUrl={product.image}
        />
      ))}
    </div>
  );
}