'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Upload,
  Users,
  Trash2,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Download,
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ContactList {
  id: string;
  name: string;
  description?: string;
  totalContacts: number;
  validContacts: number;
  invalidContacts: number;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  isValid: boolean;
  isOptedOut: boolean;
  messagesSent: number;
  messagesDelivered: number;
  lastMessageAt?: string;
  createdAt: string;
}

export default function ContactListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    valid: number;
    invalid: number;
    inserted: number;
    updated: number;
    duplicates: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const response = await fetch('/api/sms/contact-lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data.lists || []);
      }
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
      toast.error('Erro ao carregar listas de contatos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error('Nome da lista é obrigatório');
      return;
    }

    try {
      const response = await fetch('/api/sms/contact-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Lista criada com sucesso!');
        setShowNewListDialog(false);
        setNewListName('');
        setNewListDescription('');
        loadLists();

        // Abrir dialog de upload automaticamente
        setSelectedList(data.list);
        setShowUploadDialog(true);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao criar lista');
      }
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      toast.error('Erro ao criar lista');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista? Todos os contatos serão removidos.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sms/contact-lists/${listId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Lista excluída com sucesso!');
        loadLists();
      } else {
        toast.error('Erro ao excluir lista');
      }
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      toast.error('Erro ao excluir lista');
    }
  };

  const handleUploadClick = (list: ContactList) => {
    setSelectedList(list);
    setUploadStats(null);
    setShowUploadDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedList) return;

    setUploading(true);
    setUploadStats(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/sms/contact-lists/${selectedList.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Upload concluído!');
        setUploadStats(data.stats);
        loadLists();
      } else {
        toast.error(data.error || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewContacts = async (list: ContactList) => {
    setSelectedList(list);
    setLoadingContacts(true);
    setShowContactsDialog(true);

    try {
      const response = await fetch(`/api/sms/contact-lists/${list.id}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.list?.contacts || []);
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoadingContacts(false);
    }
  };

  const filteredLists = lists.filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/marketing/sms-marketing')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#FF6B00]">Listas de Contatos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie suas listas de contatos para campanhas SMS
            </p>
          </div>
        </div>
        <Dialog open={showNewListDialog} onOpenChange={setShowNewListDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Lista</DialogTitle>
              <DialogDescription>
                Crie uma nova lista de contatos para suas campanhas de SMS.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="listName">Nome da Lista *</Label>
                <Input
                  id="listName"
                  placeholder="Ex: Clientes VIP, Novos Clientes..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="listDescription">Descrição (opcional)</Label>
                <Textarea
                  id="listDescription"
                  placeholder="Descreva o propósito desta lista..."
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewListDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateList} className="bg-[#FF6B00] hover:bg-[#FF6B00]/90">
                Criar e Importar Contatos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Formato do CSV</p>
              <p className="text-sm text-blue-800 mt-1">
                O arquivo CSV deve ter uma coluna de telefone. Colunas aceitas: <strong>phone</strong>, <strong>telefone</strong>, <strong>telemóvel</strong>, <strong>celular</strong>, <strong>mobile</strong> ou <strong>numero</strong>.
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Colunas opcionais: <strong>name/nome</strong> (nome do contato), <strong>email</strong> (e-mail).
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Exemplo: phone;name;email<br/>
                934841148;João Silva;joao@email.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar listas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lists Grid */}
      {filteredLists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhuma lista encontrada
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm
                ? 'Tente ajustar sua busca'
                : 'Crie sua primeira lista de contatos para começar'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowNewListDialog(true)}
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Lista
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map((list) => (
            <Card key={list.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    {list.description && (
                      <CardDescription className="mt-1">{list.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {list.contactCount || list.totalContacts} contatos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{list.validContacts} válidos</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{list.invalidContacts} inválidos</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Criada em {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUploadClick(list)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Importar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewContacts(list)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteList(list.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Contatos</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo CSV para adicionar contatos à lista "{selectedList?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-[#FF6B00] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="h-10 w-10 text-[#FF6B00] animate-spin mb-3" />
                  <p className="text-gray-600">Processando arquivo...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p className="text-sm text-gray-400">
                    Apenas arquivos CSV
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>

            {uploadStats && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Resultado do Upload</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total processados: <strong>{uploadStats.total}</strong></div>
                  <div>Novos inseridos: <strong className="text-green-600">{uploadStats.inserted}</strong></div>
                  <div>Atualizados: <strong className="text-blue-600">{uploadStats.updated}</strong></div>
                  <div>Duplicados: <strong className="text-yellow-600">{uploadStats.duplicates}</strong></div>
                  <div>Válidos: <strong className="text-green-600">{uploadStats.valid}</strong></div>
                  <div>Inválidos: <strong className="text-red-600">{uploadStats.invalid}</strong></div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contacts Dialog */}
      <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Contatos - {selectedList?.name}</DialogTitle>
            <DialogDescription>
              {selectedList?.totalContacts || 0} contatos na lista
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[50vh]">
            {loadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-[#FF6B00]" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum contato nesta lista</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-mono">{contact.phoneNumber}</TableCell>
                      <TableCell>{contact.name || '-'}</TableCell>
                      <TableCell>{contact.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {contact.isValid ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Válido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Inválido
                            </Badge>
                          )}
                          {contact.isOptedOut && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Opt-out
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500">
                          {contact.messagesSent} enviados / {contact.messagesDelivered} entregues
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
