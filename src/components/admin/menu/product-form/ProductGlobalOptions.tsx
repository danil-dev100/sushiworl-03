'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Trash2, Plus, Loader2 } from 'lucide-react';
import { GlobalOptionsSelector } from './GlobalOptionsSelector';
import { toast } from 'sonner';

interface GlobalOptionAssignment {
  id: string;
  globalOptionId: string;
  assignmentType: 'SITE_WIDE' | 'CATEGORY' | 'PRODUCT';
  targetId: string | null;
  globalOption: {
    id: string;
    name: string;
    type: string;
    displayAt: string;
    choices: { id: string; name: string }[];
  };
  minSelection: number;
  maxSelection: number;
  allowMultiple: boolean;
}

interface ProductGlobalOptionsProps {
  productId: string;
  categoryId?: string;
}

export function ProductGlobalOptions({ productId, categoryId }: ProductGlobalOptionsProps) {
  const [assignments, setAssignments] = useState<GlobalOptionAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadAssignments();
    }
  }, [productId]);

  const loadAssignments = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      console.log('[ProductGlobalOptions] 📡 Buscando atribuições globais...');

      // Buscar atribuições de opções globais para este produto
      const response = await fetch(`/api/admin/menu/products/${productId}/global-options`);

      if (!response.ok) {
        console.error('[ProductGlobalOptions] ❌ Erro na resposta:', response.status);
        return;
      }

      const data = await response.json();
      console.log('[ProductGlobalOptions] ✅ Atribuições carregadas:', data.assignments?.length || 0);

      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('[ProductGlobalOptions] ❌ Erro ao carregar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string, globalOptionName: string) => {
    if (!confirm(`Deseja remover a opção global "${globalOptionName}" deste produto?`)) {
      return;
    }

    setDeletingId(assignmentId);
    try {
      console.log('[ProductGlobalOptions] 🗑️ Removendo atribuição:', assignmentId);

      const response = await fetch(`/api/global-options/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao remover atribuição');
      }

      toast.success('Opção global removida com sucesso');
      loadAssignments(); // Recarregar lista
    } catch (error) {
      console.error('[ProductGlobalOptions] ❌ Erro ao remover:', error);
      toast.error('Erro ao remover opção global');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-[#FF6B00]" />
          <h3 className="text-lg font-bold text-[#333333] dark:text-[#f5f1e9]">
            Opções Globais Atribuídas
          </h3>
        </div>
        <Button
          type="button"
          onClick={() => setIsSelectorOpen(true)}
          className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Opção Global
        </Button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF6B00]" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-[#ead9cd] dark:border-[#4a3c30] rounded-lg">
          <Globe className="h-12 w-12 mx-auto text-[#a16b45] opacity-50 mb-3" />
          <p className="text-[#a16b45] mb-2">
            Nenhuma opção global atribuída
          </p>
          <p className="text-sm text-[#a16b45]">
            Clique em "Adicionar Opção Global" para vincular opções reutilizáveis
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const isSiteWide = assignment.assignmentType === 'SITE_WIDE';
            const isCategory = assignment.assignmentType === 'CATEGORY';
            const canDelete = !isSiteWide && !isCategory; // Só pode deletar atribuições diretas ao produto

            return (
              <div
                key={assignment.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  isSiteWide
                    ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10'
                    : isCategory
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                    : 'border-[#ead9cd] dark:border-[#4a3c30] bg-white dark:bg-[#2a1e14]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#FF6B00]" />
                    <h4 className="font-medium text-[#333333] dark:text-[#f5f1e9]">
                      {assignment.globalOption.name}
                    </h4>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {isSiteWide && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded font-medium">
                        🌐 Todo o Site
                      </span>
                    )}
                    {isCategory && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded font-medium">
                        📁 Categoria
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] rounded">
                      {assignment.globalOption.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                      {assignment.globalOption.displayAt === 'SITE' ? 'Site (Popup)' : 'Carrinho'}
                    </span>
                    <span className="text-xs text-[#a16b45]">
                      {assignment.globalOption.choices.length} escolhas
                    </span>
                  </div>
                </div>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(assignment.id, assignment.globalOption.name)}
                    disabled={deletingId === assignment.id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {deletingId === assignment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="text-xs text-[#a16b45] px-3">
                    Herdada
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selector Dialog */}
      <GlobalOptionsSelector
        open={isSelectorOpen}
        onOpenChange={setIsSelectorOpen}
        productId={productId}
        categoryId={categoryId}
        onAssigned={loadAssignments}
      />
    </div>
  );
}
