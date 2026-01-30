import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, canManageMarketing } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Função para validar e formatar número de telefone
function formatPhoneNumber(phone: string): { valid: boolean; formatted: string } {
  // Remover espaços e caracteres especiais
  let cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '');

  // Se o número estiver vazio após limpar
  if (!cleaned || cleaned.length < 9) {
    return { valid: false, formatted: '' };
  }

  // Se começar com 00, substituir por nada (já é código de país)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Se começar com 351 (Portugal), adicionar +
  if (cleaned.startsWith('351')) {
    cleaned = '+' + cleaned;
  }
  // Se começar com 9 e tiver 9 dígitos (número português), adicionar +351
  else if (cleaned.startsWith('9') && cleaned.length === 9) {
    cleaned = '+351' + cleaned;
  }
  // Se não tiver código de país mas tiver 9+ dígitos, assumir Portugal
  else if (cleaned.length >= 9 && !cleaned.startsWith('+')) {
    // Se tiver exatamente 9 dígitos, adicionar +351
    if (cleaned.length === 9) {
      cleaned = '+351' + cleaned;
    } else {
      // Caso contrário, adicionar +
      cleaned = '+' + cleaned;
    }
  }

  // Adicionar + se não tiver
  if (!cleaned.startsWith('+')) {
    cleaned = '+351' + cleaned;
  }

  // Validar formato final (deve ter pelo menos 10 dígitos após o +)
  const isValid = cleaned.length >= 11 && /^\+[0-9]+$/.test(cleaned);

  return { valid: isValid, formatted: cleaned };
}

// Função para parsear CSV
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Detectar delimitador (vírgula ou ponto-e-vírgula)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ''));
  const rows = lines.slice(1).map(line =>
    line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );

  return { headers, rows };
}

// POST - Upload CSV de contatos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canManageMarketing(session.user.role, session.user.managerLevel ?? null)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id: listId } = await params;

    // Verificar se a lista existe
    const list = await prisma.smsContactList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      );
    }

    // Obter dados do formulário
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Verificar tipo do arquivo
    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      return NextResponse.json(
        { error: 'Apenas arquivos CSV são aceitos' },
        { status: 400 }
      );
    }

    // Ler conteúdo do arquivo
    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Arquivo CSV vazio' },
        { status: 400 }
      );
    }

    // Parsear CSV
    const { headers, rows } = parseCSV(content);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum contato encontrado no arquivo' },
        { status: 400 }
      );
    }

    // Encontrar índices das colunas importantes
    const phoneIndex = headers.findIndex(h =>
      ['phone', 'telefone', 'telemóvel', 'telemovel', 'celular', 'mobile', 'numero', 'número', 'phonenumber', 'phone_number'].includes(h)
    );
    const nameIndex = headers.findIndex(h =>
      ['name', 'nome', 'fullname', 'full_name', 'cliente'].includes(h)
    );
    const emailIndex = headers.findIndex(h =>
      ['email', 'e-mail', 'mail', 'correio'].includes(h)
    );

    if (phoneIndex === -1) {
      return NextResponse.json(
        { error: 'Coluna de telefone não encontrada. Use: phone, telefone, telemóvel, celular, mobile ou numero' },
        { status: 400 }
      );
    }

    // Processar contatos
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    const contactsToCreate: {
      listId: string;
      phoneNumber: string;
      name: string | null;
      email: string | null;
      isValid: boolean;
    }[] = [];
    const processedPhones = new Set<string>();

    for (const row of rows) {
      if (row.length <= phoneIndex) continue;

      const rawPhone = row[phoneIndex];
      if (!rawPhone) continue;

      const { valid, formatted } = formatPhoneNumber(rawPhone);

      // Verificar duplicata no lote atual
      if (processedPhones.has(formatted)) {
        duplicateCount++;
        continue;
      }

      processedPhones.add(formatted);

      const name = nameIndex >= 0 && row[nameIndex] ? row[nameIndex] : null;
      const email = emailIndex >= 0 && row[emailIndex] ? row[emailIndex] : null;

      if (valid) {
        validCount++;
      } else {
        invalidCount++;
      }

      contactsToCreate.push({
        listId,
        phoneNumber: formatted || rawPhone,
        name,
        email,
        isValid: valid,
      });
    }

    if (contactsToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum contato válido encontrado no arquivo' },
        { status: 400 }
      );
    }

    // Inserir contatos no banco (usando upsert para evitar duplicatas)
    let insertedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Usar transação para batch insert
    await prisma.$transaction(async (tx) => {
      for (const contact of contactsToCreate) {
        try {
          const existing = await tx.smsContact.findUnique({
            where: {
              listId_phoneNumber: {
                listId: contact.listId,
                phoneNumber: contact.phoneNumber,
              },
            },
          });

          if (existing) {
            // Atualizar se existir
            await tx.smsContact.update({
              where: { id: existing.id },
              data: {
                name: contact.name || existing.name,
                email: contact.email || existing.email,
                isValid: contact.isValid,
              },
            });
            updatedCount++;
          } else {
            // Criar novo
            await tx.smsContact.create({
              data: contact,
            });
            insertedCount++;
          }
        } catch (err) {
          console.error('[Upload CSV] Erro ao processar contato:', contact.phoneNumber, err);
          errors.push(contact.phoneNumber);
        }
      }

      // Atualizar contadores da lista
      const counts = await tx.smsContact.groupBy({
        by: ['isValid'],
        where: { listId },
        _count: true,
      });

      const validTotal = counts.find(c => c.isValid)?._count || 0;
      const invalidTotal = counts.find(c => !c.isValid)?._count || 0;
      const total = validTotal + invalidTotal;

      await tx.smsContactList.update({
        where: { id: listId },
        data: {
          totalContacts: total,
          validContacts: validTotal,
          invalidContacts: invalidTotal,
        },
      });
    });

    console.log('[Upload CSV] Upload concluído:', {
      listId,
      listName: list.name,
      total: contactsToCreate.length,
      inserted: insertedCount,
      updated: updatedCount,
      duplicates: duplicateCount,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      message: `Upload concluído! ${insertedCount} novos contatos adicionados, ${updatedCount} atualizados.`,
      stats: {
        total: contactsToCreate.length,
        valid: validCount,
        invalid: invalidCount,
        inserted: insertedCount,
        updated: updatedCount,
        duplicates: duplicateCount,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error('[Upload CSV] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upload do CSV' },
      { status: 500 }
    );
  }
}
