'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Globe, FolderOpen, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  assignmentType: 'SITE_WIDE' | 'CATEGORY' | 'PRODUCT';
  targetId: string | null;
  minSelection: number;
  maxSelection: number;
  allowMultiple: boolean;
  sortOrder: number;
}

interface AssignmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: any;
  onSuccess: () => void;
}

export function AssignmentsDialog({
  open,
  onOpenChange,
  option,
  onSuccess,
}: AssignmentsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newType, setNewType] = useState<'SITE_WIDE' | 'CATEGORY' | 'PRODUCT'>(
    'SITE_WIDE'
  );

  useEffect(() => {
    if (option?.assignments) {
      setAssignments(option.assignments);
    }
  }, [option]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'SITE_WIDE':
        return <Globe className="w-4 h-4" />;
      case 'CATEGORY':
        return <FolderOpen className="w-4 h-4" />;
      case 'PRODUCT':
        return <Package className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'SITE_WIDE':
        return 'Todo o Site';
      case 'CATEGORY':
        return 'Categoria';
      case 'PRODUCT':
        return 'Produto Específico';
      default:
        return type;
    }
  };

  const addAssignment = async () => {
    if (!option?.id) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/global-options/${option.id}/assignments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentType: newType,
            targetId: null, // Por enquanto sempre null
            minSelection: 0,
            maxSelection: 1,
            allowMultiple: false,
            sortOrder: assignments.length,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success('Atribuição criada com sucesso!');
        setAssignments([...assignments, data.assignment]);
        onSuccess();
      } else {
        toast.error(data.error || 'Erro ao criar atribuição');
      }
    } catch (error) {
      console.error('Erro ao criar atribuição:', error);
      toast.error('Erro ao criar atribuição');
    } finally {
      setLoading(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!option?.id) return;
    if (!confirm('Deseja realmente remover esta atribuição?')) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/global-options/${option.id}/assignments/${assignmentId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success('Atribuição removida com sucesso!');
        setAssignments(assignments.filter((a) => a.id !== assignmentId));
        onSuccess();
      } else {
        toast.error(data.error || 'Erro ao remover atribuição');
      }
    } catch (error) {
      console.error('Erro ao remover atribuição:', error);
      toast.error('Erro ao remover atribuição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Atribuições</DialogTitle>
          <DialogDescription>
            Configure onde esta opção "{option?.name}" será aplicada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar Nova Atribuição */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="assignmentType" className="sr-only">
                    Tipo de Atribuição
                  </Label>
                  <Select
                    value={newType}
                    onValueChange={(v: any) => setNewType(v)}
                  >
                    <SelectTrigger id="assignmentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SITE_WIDE">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Todo o Site
                        </div>
                      </SelectItem>
                      <SelectItem value="CATEGORY">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          Categoria
                        </div>
                      </SelectItem>
                      <SelectItem value="PRODUCT">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Produto Específico
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={addAssignment} disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {(newType === 'CATEGORY' || newType === 'PRODUCT') && (
                <p className="text-sm text-muted-foreground mt-3">
                  ℹ️ Seleção de categoria/produto será implementada em breve.
                  Por enquanto, use SITE_WIDE para aplicar em todos os
                  produtos.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Lista de Atribuições */}
          <div className="space-y-3">
            <Label>Atribuições Ativas ({assignments.length})</Label>

            {assignments.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>Nenhuma atribuição configurada.</p>
                  <p className="text-sm mt-1">
                    Adicione uma atribuição para aplicar esta opção.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getIcon(assignment.assignmentType)}
                          <div>
                            <p className="font-medium">
                              {getLabel(assignment.assignmentType)}
                            </p>
                            {assignment.targetId && (
                              <p className="text-sm text-muted-foreground">
                                ID: {assignment.targetId}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              Min: {assignment.minSelection}
                            </Badge>
                            <Badge variant="outline">
                              Max: {assignment.maxSelection}
                            </Badge>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAssignment(assignment.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
