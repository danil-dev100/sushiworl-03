-- ============================================
-- CONFIGURAÇÃO DE SEGURANÇA SUPABASE STORAGE
-- Row Level Security (RLS) para Buckets
-- ============================================
--
-- ⚠️ IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole este código > Run
--
-- Este script configura políticas de segurança para os buckets
-- do Supabase Storage, protegendo contra acesso não autorizado.
-- ============================================

-- ============================================
-- SOLUÇÃO SIMPLIFICADA QUE FUNCIONA
-- ============================================

-- Criar política de leitura pública (qualquer um pode ler)
CREATE POLICY "public_read" ON storage.objects
FOR SELECT USING (true);

-- Criar política de admin (apenas service_role pode fazer tudo)
CREATE POLICY "admin_all" ON storage.objects
FOR ALL USING (auth.role() = 'service_role');


-- ============================================
-- VERIFICAÇÃO: Confirmar que as políticas foram criadas
-- ============================================

-- Execute este SELECT para verificar:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- Resultado esperado:
-- policyname   | permissive | roles  | cmd
-- -------------+------------+--------+------
-- admin_all    | PERMISSIVE | public | ALL
-- public_read  | PERMISSIVE | public | SELECT


-- ============================================
-- REMOVER POLÍTICAS (SE NECESSÁRIO)
-- ============================================

-- ⚠️ Use apenas se precisar resetar as políticas
-- Descomente as linhas abaixo conforme necessário:

-- DROP POLICY IF EXISTS "public_read" ON storage.objects;
-- DROP POLICY IF EXISTS "admin_all" ON storage.objects;


-- ============================================
-- TESTES DE SEGURANÇA
-- ============================================

/*
  Após configurar, teste no console do navegador:

  1. LEITURA PÚBLICA (deve funcionar):
  ```javascript
  const { data } = await supabase.storage
    .from('products')
    .list('');
  console.log(data); // Deve listar arquivos
  ```

  2. UPLOAD PÚBLICO (deve FALHAR):
  ```javascript
  const file = new File(['test'], 'test.jpg');
  const { error } = await supabase.storage
    .from('products')
    .upload('test.jpg', file);
  console.log(error); // Deve retornar erro de permissão
  ```

  3. DELETE PÚBLICO (deve FALHAR):
  ```javascript
  const { error } = await supabase.storage
    .from('products')
    .remove(['algum-arquivo.webp']);
  console.log(error); // Deve retornar erro de permissão
  ```

  ✅ Se os testes 1 passarem e 2 e 3 falharem, RLS está funcionando!
*/


-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- ✅ Após executar este script com sucesso:
--    1. Verifique que as políticas foram criadas (query de verificação acima)
--    2. Teste os endpoints no navegador
--    3. Configure uploads no backend para usar supabaseAdmin
