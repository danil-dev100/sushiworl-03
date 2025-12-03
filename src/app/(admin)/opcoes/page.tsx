'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Link as LinkIcon, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { GlobalOptionDialog } from '@/components/admin/GlobalOptionDialog';
import { AssignmentsDialog } from '@/components/admin/AssignmentsDialog';

export default function GlobalOptionsPage() {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      console.log('🔍 [Opções Globais] Buscando opções...');
      const res = await fetch('/api/global-options');
      const data = await res.json();

      console.log('📦 [Opções Globais] Resposta:', data);

      if (data.success) {
        setOptions(data.options);
        console.log(`✅ [Opções Globais] ${data.options.length} opções carregadas`);
      } else {
        console.error('❌ [Opções Globais] Erro na resposta:', data.error);
        toast.error('Erro ao carregar opções');
      }
    } catch (error) {
      console.error('❌ [Opções Globais] Erro ao buscar opções:', error);
      toast.error('Erro ao carregar opções');
    } finally {
      setLoading(false);
    }
  };

  const deleteOption = async (id: string) => {
    if (!confirm('Deseja realmente deletar esta opção?')) return;

    try {
      const res = await fetch(`/api/global-options/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Opção deletada com sucesso!');
        fetchOptions();
      } else {
        toast.error('Erro ao deletar opção');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar opção');
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opções Globais</h1>
          <p className="text-muted-foreground mt-2">
            Crie opções reutilizáveis e aplique em produtos, categorias ou em todo o site
          </p>
        </div>
        <Button onClick={() => { setSelectedOption(null); setDialogOpen(true); }} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Nova Opção
        </Button>
      </div>

      {/* Status e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Opções</CardDescription>
            <CardTitle className="text-3xl">{options.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Opções Ativas</CardDescription>
            <CardTitle className="text-3xl">
              {options.filter(o => o.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Com Atribuições</CardDescription>
            <CardTitle className="text-3xl">
              {options.filter(o => o.assignments?.length > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de Opções */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Carregando opções...</span>
            </div>
          </CardContent>
        </Card>
      ) : options.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma opção criada ainda</h3>
            <p className="text-muted-foreground mb-6">
              Comece criando sua primeira opção global para usar em seus produtos
            </p>
            <Button onClick={() => { setSelectedOption(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Opção
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {options.map((option: any) => (
            <Card key={option.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    {/* Cabeçalho */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{option.name}</h3>

                      <Badge variant={option.type === 'REQUIRED' ? 'destructive' : 'secondary'}>
                        {option.type === 'REQUIRED' ? 'Obrigatório' : 'Opcional'}
                      </Badge>

                      <Badge variant={option.displayAt === 'SITE' ? 'default' : 'outline'}>
                        {option.displayAt === 'SITE' ? '🌐 Site' : '🛒 Carrinho'}
                      </Badge>

                      {!option.isActive && (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </div>

                    {/* Descrição */}
                    {option.description && (
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    )}

                    {/* Informações */}
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{option.choices?.length || 0}</span>
                        <span className="text-muted-foreground">escolha(s)</span>
                      </span>

                      {option.isPaid && (
                        <span className="flex items-center gap-2 text-green-600 font-medium">
                          <span>+€{option.basePrice.toFixed(2)}</span>
                        </span>
                      )}

                      <span className="flex items-center gap-2">
                        <span className="font-medium">{option.assignments?.length || 0}</span>
                        <span className="text-muted-foreground">atribuição(ões)</span>
                      </span>
                    </div>

                    {/* Escolhas */}
                    {option.choices?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {option.choices.slice(0, 5).map((choice: any) => (
                          <Badge key={choice.id} variant="outline" className="font-normal">
                            {choice.name}
                            {choice.price > 0 && (
                              <span className="ml-1 text-green-600">
                                +€{choice.price.toFixed(2)}
                              </span>
                            )}
                          </Badge>
                        ))}
                        {option.choices.length > 5 && (
                          <Badge variant="outline" className="font-normal">
                            +{option.choices.length - 5} mais
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { setSelectedOption(option); setAssignmentsOpen(true); }}
                      title="Gerenciar atribuições"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { setSelectedOption(option); setDialogOpen(true); }}
                      title="Editar opção"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteOption(option.id)}
                      title="Deletar opção"
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

      {/* Dialogs */}
      <GlobalOptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        option={selectedOption}
        onSuccess={fetchOptions}
      />

      <AssignmentsDialog
        open={assignmentsOpen}
        onOpenChange={setAssignmentsOpen}
        option={selectedOption}
        onSuccess={fetchOptions}
      />
    </div>
  );
}
