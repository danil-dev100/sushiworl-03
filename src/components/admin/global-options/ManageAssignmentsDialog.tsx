'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Globe, FolderOpen, Package } from 'lucide-react';
import { toast } from 'sonner';
import { TargetSelector } from './TargetSelector';

type AssignmentType = 'SITE_WIDE' | 'CATEGORY' | 'PRODUCT';

interface Assignment {
  id: string;
  assignmentType: AssignmentType;
  targetId: string | null;
  minSelection: number;
  maxSelection: number;
  allowMultiple: boolean;
  sortOrder: number;
}

interface ManageAssignmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: any;
  onSuccess: () => void;
}

export function ManageAssignmentsDialog({
  open,
  onOpenChange,
  option,
  onSuccess,
}: ManageAssignmentsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Novo assignment
  const [newType, setNewType] = useState<AssignmentType>('SITE_WIDE');
  const [newTargetId, setNewTargetId] = useState<string | null>(null);
  const [newMinSelection, setNewMinSelection] = useState(0);
  const [newMaxSelection, setNewMaxSelection] = useState(1);
  const [newAllowMultiple, setNewAllowMultiple] = useState(false);

  useEffect(() => {
    if (open && option) {
      fetchAssignments();
    }
  }, [open, option]);

  const fetchAssignments = async () => {
    if (!option?.id) return;

    try {
      const res = await fetch(`/api/global-options/${option.id}/assignments`);
      const data = await res.json();

      if (data.success) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Erro ao buscar atribuições:', error);
    }
  };

  const addAssignment = async () => {
    if (!option?.id) return;

    // Validações
    if (newType !== 'SITE_WIDE' && !newTargetId) {
      toast.error('Selecione uma categoria ou produto');
      return;
    }

    if (newMinSelection < 0) {
      toast.error('Mínimo de seleções não pode ser negativo');
      return;
    }

    if (newMaxSelection < newMinSelection) {
      toast.error('Máximo deve ser maior ou igual ao mínimo');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/global-options/${option.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentType: newType,
          targetId: newType === 'SITE_WIDE' ? null : newTargetId,
          minSelection: newMinSelection,
          maxSelection: newMaxSelection,
          allowMultiple: newAllowMultiple,
          sortOrder: assignments.length,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Atribuição criada com sucesso!');
        fetchAssignments();
        resetForm();
        onSuccess();
      } else {
        toast.error(data.error || 'Erro ao criar atribuição');
      }
    } catch (error) {
      toast.error('Erro ao criar atribuição');
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!option?.id) return;
    if (!confirm('Deseja realmente remover esta atribuição?')) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/global-options/${option.id}/assignments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: id }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Atribuição removida!');
        fetchAssignments();
        onSuccess();
      } else {
        toast.error(data.error || 'Erro ao remover atribuição');
      }
    } catch (error) {
      toast.error('Erro ao remover atribuição');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewType('SITE_WIDE');
    setNewTargetId(null);
    setNewMinSelection(0);
    setNewMaxSelection(1);
    setNewAllowMultiple(false);
  };

  const getAssignmentIcon = (type: AssignmentType) => {
    switch (type) {
      case 'SITE_WIDE':
        return <Globe className="w-4 h-4" />;
      case 'CATEGORY':
        return <FolderOpen className="w-4 h-4" />;
      case 'PRODUCT':
        return <Package className="w-4 h-4" />;
    }
  };

  const getAssignmentLabel = (type: AssignmentType) => {
    switch (type) {
      case 'SITE_WIDE':
        return 'Todo o Site';
      case 'CATEGORY':
        return 'Categoria';
      case 'PRODUCT':
        return 'Produto';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Atribuições</DialogTitle>
          <DialogDescription>
            Configure onde a opção &quot;{option?.name}&quot; será aplicada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de Atribuições Existentes */}
          {assignments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Atribuições Ativas ({assignments.length})</h3>
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getAssignmentIcon(assignment.assignmentType)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {getAssignmentLabel(assignment.assignmentType)}
                            </span>
                            {assignment.targetId && (
                              <Badge variant="secondary">{assignment.targetId}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Min: {assignment.minSelection} | Max: {assignment.maxSelection}
                            {assignment.allowMultiple && ' | Múltipla escolha'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAssignment(assignment.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Formulário de Nova Atribuição */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Nova Atribuição</h3>

            <TargetSelector
              assignmentType={newType}
              targetId={newTargetId}
              onAssignmentTypeChange={setNewType}
              onTargetIdChange={setNewTargetId}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mínimo de Seleções</Label>
                <Input
                  type="number"
                  min={0}
                  value={newMinSelection}
                  onChange={(e) => setNewMinSelection(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Quantas escolhas são obrigatórias (0 = opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Máximo de Seleções</Label>
                <Input
                  type="number"
                  min={1}
                  value={newMaxSelection}
                  onChange={(e) => setNewMaxSelection(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Quantas escolhas são permitidas
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Permitir Múltipla Escolha</Label>
                <p className="text-sm text-muted-foreground">
                  Cliente pode selecionar várias opções simultaneamente
                </p>
              </div>
              <Switch
                checked={newAllowMultiple}
                onCheckedChange={setNewAllowMultiple}
              />
            </div>

            <Button
              onClick={addAssignment}
              disabled={loading || (newType !== 'SITE_WIDE' && !newTargetId)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Atribuição
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
