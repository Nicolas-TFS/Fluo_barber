---
name: Rotas públicas no Expo
description: Como impedir que páginas públicas fiquem em branco enquanto a autenticação Clerk inicializa.
---

Rotas destinadas a visitantes sem conta devem ser renderizadas sem depender dos providers e bloqueios de carregamento da área autenticada.

**Why:** A página pública de agendamento respondia corretamente na API, mas permanecia em branco no navegador porque toda a árvore de navegação aguardava o Clerk carregar.

**How to apply:** Detectar o grupo de rotas públicas no layout raiz e montar apenas os providers neutros necessários. Manter Clerk e o estado autenticado na árvore usada pelas telas privadas. Quando o link for servido pelo artifact da API, usar o prefixo público `/api` no endereço compartilhado.