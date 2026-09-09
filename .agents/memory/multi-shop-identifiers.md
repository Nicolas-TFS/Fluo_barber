---
name: IDs multi-barbearia
description: Regra para criar dados iniciais e importar registros relacionados sem colisões entre barbearias.
---

Serviços, clientes e atendimentos pertencentes a uma nova barbearia devem receber identificadores globais exclusivos; nomes fixos de modelos iniciais nunca devem ser usados como chaves persistentes.

**Why:** Novas barbearias tentavam inserir os mesmos IDs dos serviços padrão. Como as chaves são globais, dados antigos de outra barbearia faziam o cadastro inteiro falhar.

**How to apply:** Gerar novos IDs no servidor por conjunto criado. Ao importar dados relacionados, manter mapas entre IDs recebidos e IDs novos para preservar os vínculos de atendimento com serviço e cliente.