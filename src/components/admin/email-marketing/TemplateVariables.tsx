'use client';

import { Info, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VariableInfo {
  name: string;
  description: string;
  example: string;
  category: 'customer' | 'order' | 'coupon' | 'general';
}

const TEMPLATE_VARIABLES: VariableInfo[] = [
  // Cliente
  {
    name: '{{customer_name}}',
    description: 'Nome do cliente',
    example: 'João Silva',
    category: 'customer',
  },
  {
    name: '{{customer_email}}',
    description: 'Email do cliente',
    example: 'joao@example.com',
    category: 'customer',
  },
  {
    name: '{{customer_phone}}',
    description: 'Telefone do cliente',
    example: '(11) 98765-4321',
    category: 'customer',
  },

  // Pedido/Carrinho
  {
    name: '{{cart_total}}',
    description: 'Valor total do carrinho',
    example: 'R$ 89,90',
    category: 'order',
  },
  {
    name: '{{cart_items_count}}',
    description: 'Quantidade de itens no carrinho',
    example: '3',
    category: 'order',
  },
  {
    name: '{{cart_items_list}}',
    description: 'Lista de produtos do carrinho (HTML)',
    example: '<ul><li>Combo Sushi (2x)</li><li>Hot Roll</li></ul>',
    category: 'order',
  },

  // Cupom de desconto
  {
    name: '{{coupon_code}}',
    description: 'Código do cupom gerado',
    example: 'CART20OFF',
    category: 'coupon',
  },
  {
    name: '{{discount_percentage}}',
    description: 'Porcentagem de desconto',
    example: '20',
    category: 'coupon',
  },
  {
    name: '{{free_shipping}}',
    description: 'Se tem frete grátis (true/false)',
    example: 'true',
    category: 'coupon',
  },
  {
    name: '{{discount_link}}',
    description: 'Link direto para checkout com cupom aplicado',
    example: 'https://seusite.com/checkout?coupon=CART20OFF',
    category: 'coupon',
  },
  {
    name: '{{coupon_expiry}}',
    description: 'Data/hora de expiração do cupom',
    example: '28/12/2024 às 23:59',
    category: 'coupon',
  },

  // Geral
  {
    name: '{{site_name}}',
    description: 'Nome do site/restaurante',
    example: 'Sushi World',
    category: 'general',
  },
  {
    name: '{{site_url}}',
    description: 'URL do site',
    example: 'https://sushiworld.com',
    category: 'general',
  },
  {
    name: '{{support_email}}',
    description: 'Email de suporte',
    example: 'contato@sushiworld.com',
    category: 'general',
  },
  {
    name: '{{current_year}}',
    description: 'Ano atual',
    example: '2024',
    category: 'general',
  },
];

const CATEGORY_LABELS = {
  customer: '👤 Cliente',
  order: '🛒 Pedido/Carrinho',
  coupon: '🎟️ Cupom de Desconto',
  general: '⚙️ Geral',
};

const CATEGORY_COLORS = {
  customer: 'bg-blue-100 text-blue-800',
  order: 'bg-green-100 text-green-800',
  coupon: 'bg-orange-100 text-orange-800',
  general: 'bg-gray-100 text-gray-800',
};

export function TemplateVariables() {
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(varName);
    setCopiedVar(varName);
    toast.success('Variável copiada!');
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const groupedVariables = TEMPLATE_VARIABLES.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, VariableInfo[]>);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          Variáveis Dinâmicas Disponíveis
        </CardTitle>
        <p className="text-xs text-gray-500">
          Use estas variáveis nos seus templates de email. Elas serão substituídas automaticamente pelos valores reais.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedVariables).map(([category, variables]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}>
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </Badge>
            </div>
            <div className="space-y-1.5">
              {variables.map((variable) => (
                <div
                  key={variable.name}
                  className="flex items-start justify-between gap-2 p-2 rounded hover:bg-gray-50 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[#FF6B00]">
                        {variable.name}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyVariable(variable.name)}
                      >
                        {copiedVar === variable.name ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{variable.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Exemplo: <span className="font-medium">{variable.example}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-3 border-t">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">📌 Como usar:</h4>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Copie a variável clicando no ícone de copiar</li>
            <li>Cole no template de email onde deseja que o valor apareça</li>
            <li>As variáveis são case-sensitive (diferenciam maiúsculas/minúsculas)</li>
            <li>Variáveis de cupom só funcionam se desconto estiver configurado no nó Email</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
