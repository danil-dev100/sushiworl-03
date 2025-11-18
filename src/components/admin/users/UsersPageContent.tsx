'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'ADMIN' | 'MANAGER';
type ManagerLevel = 'BASIC' | 'INTERMEDIATE' | 'FULL';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  managerLevel: ManagerLevel | null;
  isActive: boolean;
  firstLogin: boolean;
  createdAt: string | Date;
};

type UsersPageContentProps = {
  initialUsers: AdminUser[];
  currentUserId: string;
};

const managerLevelOptions: {
  value: ManagerLevel;
  label: string;
  description: string;
}[] = [
  {
    value: 'BASIC',
    label: 'Básico',
    description: 'Aceitar, cancelar e imprimir pedidos.',
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermediário',
    description: 'Permite alterar pedidos além das ações básicas.',
  },
  {
    value: 'FULL',
    label: 'Acesso Total',
    description: 'Acesso completo ao painel (exceto área financeira).',
  },
];

const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
};

const managerLevelLabels: Record<ManagerLevel, string> = {
  BASIC: 'Básico',
  INTERMEDIATE: 'Intermediário',
  FULL: 'Acesso Total',
};

const managerLevelSchema = z.enum(['BASIC', 'INTERMEDIATE', 'FULL']);

const userFormBaseSchema = z.object({
  name: z.string().min(3, 'Informe o nome completo'),
  email: z.string().email('Informe um email válido'),
  role: z.enum(['ADMIN', 'MANAGER']),
  managerLevel: managerLevelSchema.nullable(),
  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormBaseSchema>;

const buildUserFormSchema = (isEditing: boolean) =>
  userFormBaseSchema.superRefine((data, ctx) => {
    const trimmedPassword = data.password?.trim() ?? '';

    if (data.role === 'MANAGER' && !data.managerLevel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['managerLevel'],
        message: 'Selecione o nível de acesso do gerente',
      });
    }

    if (!isEditing && trimmedPassword.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Defina uma senha inicial para o usuário',
      });
    }

    if (trimmedPassword.length > 0 && trimmedPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'A senha deve ter no mínimo 8 caracteres',
      });
    }
  });

export function UsersPageContent({
  initialUsers,
  currentUserId,
}: UsersPageContentProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    const normalized = searchTerm.toLowerCase();

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        roleLabels[user.role].toLowerCase().includes(normalized) ||
        (user.managerLevel &&
          managerLevelLabels[user.managerLevel]
            .toLowerCase()
            .includes(normalized))
      );
    });
  }, [searchTerm, users]);

  const handleDialogOpen = (user: AdminUser | null = null) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (user: AdminUser) => {
    if (user.id === currentUserId) {
      toast.warning('Você não pode desativar o seu próprio usuário.');
      return;
    }

    setStatusLoadingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível atualizar o usuário');
      }

      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? data.user : item))
      );

      toast.success(
        `Usuário ${!user.isActive ? 'reativado' : 'desativado'} com sucesso!`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar status do usuário'
      );
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleSubmit = async (values: UserFormValues) => {
    setIsSaving(true);

    const formattedManagerLevel =
      values.role === 'MANAGER' ? values.managerLevel : null;
    const trimmedPassword = values.password?.trim() ?? '';

    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      managerLevel: formattedManagerLevel,
    };

    if (trimmedPassword.length > 0) {
      payload.password = trimmedPassword;
    }

    try {
      let response: Response;
      if (editingUser) {
        response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/admin/users', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            password: trimmedPassword,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao salvar usuário');
      }

      const savedUser: AdminUser = data.user;

      setUsers((prev) => {
        if (editingUser) {
          return prev.map((item) => (item.id === savedUser.id ? savedUser : item));
        }
        return [savedUser, ...prev];
      });

      toast.success(
        editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!'
      );

      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao salvar usuário'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao remover usuário');
      }

      setUsers((prev) => prev.filter((user) => user.id !== deleteTarget.id));
      toast.success('Usuário removido com sucesso!');
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao remover usuário'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-[#FF6B00]">Usuários</h1>
          <p className="text-sm text-[#a16b45]">
            Gerencie administradores e gerentes com diferentes níveis de acesso.
          </p>
        </div>
        <Button
          onClick={() => handleDialogOpen(null)}
          className="flex items-center gap-2 bg-[#FF6B00] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#FF6B00]/90"
        >
          <Plus className="h-4 w-4" />
          Adicionar Usuário
        </Button>
      </header>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a16b45]" />
          <Input
            type="text"
            placeholder="Buscar por nome, email ou nível..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-white pl-10 text-sm shadow-sm"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#ead9cd] bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-[#f5f1e9]">
            <TableRow className="border-[#ead9cd]">
              <TableHead className="px-6 py-4 text-[#a16b45]">Nome</TableHead>
              <TableHead className="px-6 py-4 text-[#a16b45]">Email</TableHead>
              <TableHead className="px-6 py-4 text-[#a16b45]">
                Nível de Acesso
              </TableHead>
              <TableHead className="px-6 py-4 text-[#a16b45]">
                Primeiro acesso
              </TableHead>
              <TableHead className="px-6 py-4 text-[#a16b45]">Status</TableHead>
              <TableHead className="px-6 py-4 text-right text-[#a16b45]">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const isLoading = statusLoadingId === user.id;

              return (
                <TableRow
                  key={user.id}
                  className="border-[#ead9cd] hover:bg-[#fefaf3]"
                >
                  <TableCell className="px-6 py-4 text-sm font-semibold text-[#333333]">
                    {user.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-[#a16b45]">
                    {user.email}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <Badge
                        className={cn(
                          'w-fit gap-1 bg-[#FF6B00]/10 text-[#FF6B00]',
                          user.role === 'ADMIN' && 'bg-[#FF6B00] text-white'
                        )}
                      >
                        {user.role === 'ADMIN' ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Administrador
                          </>
                        ) : (
                          <>
                            <Shield className="h-3.5 w-3.5" />
                            Gerente
                          </>
                        )}
                      </Badge>

                      {user.role === 'MANAGER' && user.managerLevel && (
                        <span className="text-xs font-medium text-[#a16b45]">
                          {managerLevelLabels[user.managerLevel]}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    {user.firstLogin ? (
                      <Badge className="w-fit bg-[#FF6B00]/10 text-[#FF6B00]">
                        Aguardando redefinição
                      </Badge>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600">
                        Concluído
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={user.isActive}
                        disabled={isCurrentUser || isLoading}
                        onCheckedChange={() => handleToggleActive(user)}
                      />
                      <span className="text-sm font-medium text-[#333333]">
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                      {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-[#FF6B00]" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDialogOpen(user)}
                        className="text-[#a16b45] hover:bg-[#FF6B00]/10 hover:text-[#FF6B00]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isCurrentUser}
                        onClick={() => {
                          if (isCurrentUser) return;
                          setDeleteTarget(user);
                        }}
                        className={cn(
                          'text-red-500 hover:bg-red-50 hover:text-red-600',
                          isCurrentUser && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <UserFormDialog
        open={isDialogOpen}
        isSaving={isSaving}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUser(null);
          }
        }}
        onSubmit={handleSubmit}
        user={editingUser}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é permanente e removerá o acesso de{' '}
              <strong>{deleteTarget?.name}</strong> ao painel administrativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </span>
              ) : (
                'Remover Usuário'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isSaving: boolean;
  user: AdminUser | null;
};

function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSaving,
  user,
}: UserFormDialogProps) {
  const isEditing = Boolean(user);
  const schema = useMemo(() => buildUserFormSchema(isEditing), [isEditing]);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'MANAGER',
      managerLevel:
        user?.role === 'MANAGER'
          ? user.managerLevel ?? 'BASIC'
          : 'BASIC',
      password: '',
    },
  });

  const role = form.watch('role');

  useEffect(() => {
    if (open) {
      form.reset({
        name: user?.name ?? '',
        email: user?.email ?? '',
        role: user?.role ?? 'MANAGER',
        managerLevel:
          user?.role === 'MANAGER'
            ? user.managerLevel ?? 'BASIC'
            : 'BASIC',
        password: '',
      });
      setShowPassword(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar usuário' : 'Adicionar novo usuário'}
          </DialogTitle>
          <DialogDescription>
            Defina nome, email, cargo e permissões do usuário. Para o primeiro acesso, informe uma senha temporária.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ana Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@sushiworld.pt"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: Role) => field.onChange(value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="MANAGER">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {role === 'MANAGER' && (
              <FormField
                control={form.control}
                name="managerLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de acesso do gerente</FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(value: ManagerLevel) =>
                        field.onChange(value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managerLevelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex flex-col">
                              <span className="font-semibold">
                                {option.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing ? 'Nova senha (opcional)' : 'Senha temporária'}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={
                          isEditing
                            ? 'Informe apenas se deseja redefinir a senha'
                            : 'Mínimo de 8 caracteres'
                        }
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-[#a16b45] transition hover:text-[#FF6B00]"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </span>
                ) : isEditing ? (
                  'Salvar alterações'
                ) : (
                  'Criar usuário'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

