---
name: Dados entre aparelhos
description: Regra de autoridade dos dados para que a mesma conta funcione de forma consistente em aparelhos diferentes.
---

Após autenticar, o aplicativo deve considerar o PostgreSQL como fonte obrigatória para perfil, serviços, clientes, agenda e financeiro. O armazenamento local pode guardar uma cópia de desempenho, mas nunca decidir se a conta está configurada nem recriar silenciosamente dados remotos.

**Why:** Um aparelho com cache local podia parecer configurado mesmo quando a criação ou leitura no servidor havia falhado; outro aparelho, sem esse cache, parecia perder a conta ou seus dados.

**How to apply:** Toda entrada de sessão deve buscar o estado remoto pelo identificador Clerk autenticado. Falhas de autenticação ou sincronização devem ser mostradas e permitir nova tentativa; somente uma resposta remota de “não configurado” pode abrir o cadastro inicial.