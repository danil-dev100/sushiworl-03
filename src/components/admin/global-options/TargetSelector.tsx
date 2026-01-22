'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Globe, FolderOpen, Package } from 'lucide-react';

type AssignmentType = 'SITE_WIDE' | 'CATEGORY' | 'PRODUCT';

interface TargetSelectorProps {
  assignmentType: AssignmentType;
  targetId: string | null;
  onAssignmentTypeChange: (type: AssignmentType) => void;
  onTargetIdChange: (id: string | null) => void;
}

export function TargetSelector({
  assignmentType,
  targetId,
  onAssignmentTypeChange,
  onTargetIdChange,
}: TargetSelectorProps) {
  const [categories, setCategories] = useState<{ id: string; name: string; emoji: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar categorias
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    }
    fetchCategories();
  }, []);

  // Buscar produtos
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/products-list');
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleTypeChange = (type: AssignmentType) => {
    onAssignmentTypeChange(type);

    // Limpar targetId ao mudar tipo
    if (type === 'SITE_WIDE') {
      onTargetIdChange(null);
    } else {
      onTargetIdChange(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tipo de Atribuição */}
      <div className="space-y-2">
        <Label>Aplicar em</Label>
        <Select value={assignmentType} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SITE_WIDE">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Todo o Site</span>
              </div>
            </SelectItem>
            <SelectItem value="CATEGORY">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>Categoria Específica</span>
              </div>
            </SelectItem>
            <SelectItem value="PRODUCT">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Produto Específico</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {assignmentType === 'SITE_WIDE' && 'Esta opção será aplicada em todos os produtos do site'}
          {assignmentType === 'CATEGORY' && 'Esta opção será aplicada apenas em produtos da categoria selecionada'}
          {assignmentType === 'PRODUCT' && 'Esta opção será aplicada apenas no produto selecionado'}
        </p>
      </div>

      {/* Seletor de Categoria */}
      {assignmentType === 'CATEGORY' && (
        <div className="space-y-2">
          <Label>Selecione a Categoria</Label>
          <Select value={targetId || ''} onValueChange={onTargetIdChange}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma categoria..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  <div className="flex items-center gap-2">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Seletor de Produto */}
      {assignmentType === 'PRODUCT' && (
        <div className="space-y-2">
          <Label>Selecione o Produto</Label>
          <Select value={targetId || ''} onValueChange={onTargetIdChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Carregando...' : 'Escolha um produto...'} />
            </SelectTrigger>
            <SelectContent>
              {products.map((prod) => (
                <SelectItem key={prod.id} value={prod.id}>
                  <div className="flex flex-col">
                    <span>{prod.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {prod.category} - €{prod.price.toFixed(2)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
