'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MenuSidebar } from './MenuSidebar';
import { ProductGrid } from './ProductGrid';
import { ProductDialog } from './ProductDialog';

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  category: string;
  imageUrl: string;
  status: string;
  isVisible: boolean;
  isFeatured: boolean;
  isTopSeller: boolean;
  outOfStock: boolean;
  availableUntil: Date | null;
  isHot: boolean;
  isHalal: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  isDairyFree: boolean;
  isRaw: boolean;
  isGlutenFree: boolean;
  isNutFree: boolean;
  ingredients: string | null;
  additives: string | null;
  allergens: string[];
  tags: string[];
  nutritionPer: string | null;
  calories: number | null;
  carbs: number | null;
  totalFat: number | null;
  protein: number | null;
  sugar: number | null;
  salt: number | null;
  orderCount: number;
  productOptions: any[];
};

interface MenuPageContentProps {
  initialProducts: Product[];
  categories: string[];
}

export function MenuPageContent({ initialProducts, categories }: MenuPageContentProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filtrar produtos
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleProductSaved = async () => {
    // Recarregar produtos
    const response = await fetch('/api/admin/menu/products');
    if (response.ok) {
      const data = await response.json();
      setProducts(data.products);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar de categorias */}
      <MenuSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 p-6 lg:p-10">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-black text-[#FF6B00]">Cardápio</h1>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a16b45]" />
              <Input
                type="text"
                placeholder="Buscar por nome ou SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10"
              />
            </div>
          </div>
          <Button
            onClick={handleAddProduct}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </header>

        {/* Grid de produtos */}
        <ProductGrid
          products={filteredProducts}
          onEditProduct={handleEditProduct}
          onProductsChange={setProducts}
        />
      </div>

      {/* Dialog de adicionar/editar produto */}
      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        categories={categories}
        onSave={handleProductSaved}
      />
    </div>
  );
}

