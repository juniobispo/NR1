# Compliance: gravação de ambientes de trabalho, LGPD e CLT

Este documento resume **considerações de design** incorporadas à plataforma para reduzir risco jurídico do uso
pretendido (documentação probatória para NR1). **Não é aconselhamento jurídico.** Valide a política de
monitoramento da empresa cliente com um advogado trabalhista/DPO antes de operar em produção — o tema envolve
tensão entre o dever de prevenção de riscos psicossociais (NR1) e os direitos de privacidade e proteção de
dados dos colaboradores (LGPD, e princípios de boa-fé/proporcionalidade da CLT e jurisprudência do TST sobre
monitoramento no ambiente de trabalho).

## Princípios de design adotados

1. **Nenhuma gravação é "prova" sem consentimento registrado.** O modelo `ConsentRecord`
   (`prisma/schema.prisma`) exige um registro explícito, por colaborador (e opcionalmente por ambiente), antes
   de a gravação daquele ambiente poder ser tratada como base para uma ocorrência formal. A tela
   **Colaboradores** centraliza esse controle.
2. **Transparência.** A gravação de ambientes de trabalho para fins de segurança/conformidade deve ser
   comunicada de forma clara aos colaboradores (aviso visível no ambiente, política interna assinada) — isso é
   um requisito prático, não só legal, para que as gravações tenham valor probatório.
3. **Minimização e retenção limitada.** `Organization.retentionDays` define por quanto tempo mídia bruta e
   transcrições são mantidas por padrão. Ocorrências **confirmadas** (que viram documentação formal de um caso)
   tipicamente precisam de retenção mais longa, alinhada ao prazo prescricional trabalhista — trate isso como
   uma política separada, definida com jurídico, e não apague evidência de um caso em apuração.
4. **Triagem humana obrigatória antes de qualquer efeito formal.** A detecção automática de incidentes
   (`src/lib/incident-detection.ts`) é uma heurística de léxico — ela **sinaliza**, nunca **confirma**. Um
   `Incident` só se torna documentação de um caso real (`status: CONFIRMED`) após revisão humana por RH/gestor,
   que também formaliza quem são ofensor(es), vítima(s) e testemunhas.
5. **Controle de acesso por papel.** `UserRole` (ADMIN/RH/GESTOR/VISUALIZADOR) limita quem pode confirmar ou
   descartar uma ocorrência — evitando que qualquer pessoa da empresa acesse ou altere unilateralmente o
   histórico probatório.
6. **Auditoria.** O modelo `AuditLog` existe para registrar ações sensíveis (ex.: quem confirmou uma
   ocorrência, quem alterou um consentimento) — recomenda-se instrumentar todas as rotas de escrita sensíveis
   com esse log antes de ir a produção real.

## Recomendações operacionais para o cliente (empresa que usa a plataforma)

- Formalizar uma **política de monitoramento** interna, comunicada a todos os colaboradores, cobrindo: quais
  ambientes são gravados, finalidade (conformidade NR1, prevenção/apuração de assédio e ofensas), quem acessa
  os dados, por quanto tempo são mantidos e como solicitar informações (direitos do titular sob a LGPD).
- Evitar gravar áreas de expectativa de privacidade elevada (banheiros, vestiários) — a plataforma não
  restringe isso tecnicamente; é uma decisão de onde instalar os dispositivos de captação.
- Designar um responsável (RH ou DPO) pela triagem de ocorrências sinalizadas automaticamente, para evitar uso
  de falsos positivos contra colaboradores.
- Restringir o papel `VISUALIZADOR`/acesso à mídia bruta ao mínimo necessário (ex.: jurídico em um caso
  específico), não à liderança de forma geral.

## Base legal (LGPD) mais provável para este tratamento

Em geral, o tratamento de voz/imagem de colaboradores no ambiente de trabalho para fins de segurança e
cumprimento de obrigação regulatória (NR1) tende a se apoiar em **cumprimento de obrigação legal/regulatória**
(art. 7º, II) e/ou **legítimo interesse** (art. 7º, IX) do empregador, combinados com **transparência** e
**consentimento informado** sempre que viável — especialmente relevante porque a gravação pode capturar dados
de terceiros (visitantes, clientes) além dos colaboradores. A escolha da base legal correta depende do caso
concreto da empresa cliente e deve ser definida com apoio jurídico.
