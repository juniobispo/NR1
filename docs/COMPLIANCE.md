# Compliance: gravação de ambientes de trabalho, LGPD e CLT

Este documento resume **considerações de design** incorporadas à plataforma para reduzir risco jurídico do uso
pretendido (documentação probatória para NR1). **Não é aconselhamento jurídico.** Valide a política de
monitoramento da empresa cliente com um advogado trabalhista/DPO antes de operar em produção — o tema envolve
tensão entre o dever de prevenção de riscos psicossociais (NR1) e os direitos de privacidade e proteção de
dados dos colaboradores (LGPD, e princípios de boa-fé/proporcionalidade da CLT e jurisprudência do TST sobre
monitoramento no ambiente de trabalho).

## O que a NR-1 exige, de fato

O texto oficial da norma está em `gov.br` — nesta sessão de desenvolvimento o acesso direto a esse domínio
foi bloqueado pela política de rede do ambiente, então o que segue vem de fontes secundárias especializadas em
SST (pesquisa de set/2026), **não da leitura direta da norma**. Antes de basear qualquer decisão de produto ou
comercial nisso, valide contra o texto publicado no DOU e em
[gov.br/trabalho-e-emprego — Normas Regulamentadoras Vigentes](https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-1).

- **O que mudou e quando.** A Portaria MTE nº 1.419/2024 atualizou a NR-1 incluindo expressamente os
  **Fatores de Risco Psicossociais Relacionados ao Trabalho (FRPRT)** no Gerenciamento de Riscos Ocupacionais
  (GRO). A nova redação entrou em vigor em 26/05/2025, com um ano de transição sem multas — ou seja, **a
  exigência passou a ser fiscalizável de fato a partir de 25-26/05/2026**, poucos meses antes desta sessão.
  Isso é relevante comercialmente: o mercado está na janela em que a obrigação passou a valer de verdade.
- **FRPRT — o que é.** Elementos das condições e da organização do trabalho que podem prejudicar a saúde
  psicológica, física ou social do trabalhador: sobrecarga de trabalho, assédio moral, assédio sexual,
  violência, falta de clareza de função, má gestão de mudanças e relações interpessoais prejudiciais, entre
  outros — fatores associados a ansiedade, depressão e burnout.
- **Onde isso entra no documento oficial.** Os FRPRT não geram um documento à parte: eles entram no mesmo
  **Inventário de Riscos** do **PGR (Programa de Gerenciamento de Riscos)**, classificados pela mesma lógica
  de **probabilidade × severidade** já usada para risco físico/químico/biológico — não como um "score" livre.
  A norma **não prescreve uma tabela numérica única** de probabilidade/severidade; cada PGR define seus
  próprios critérios.
- **Quem pode elaborar/assinar o PGR.** Diferente do que se costuma supor, a NR-1 (fora do caso específico de
  canteiros de obra, regido pela NR-18) **não exige um engenheiro de segurança do trabalho**. A empresa
  designa o profissional de SST que julgar adequado (engenheiro, técnico ou tecnólogo em segurança do
  trabalho). Isso é relevante para o público-alvo (varejo/comércio de porte médio, sem estrutura de SST
  grande): a barreira de entrada para ter um PGR minimamente formalizado é menor do que parece.

### O que a plataforma faz e o que ela não faz

- **Faz:** gera evidência documentada (gravação + transcrição + triagem humana) e uma **matriz de risco por
  fator (probabilidade × severidade × nível de risco)**, no formato do Inventário de Riscos, pronta para
  alimentar o PGR da empresa (ver `src/lib/risk-matrix.ts` e o relatório NR-1 em `/relatorios`).
- **Não faz:** não elabora nem assina o PGR — isso continua sendo responsabilidade da empresa e do profissional
  de SST que ela designar. A matriz gerada é um **ponto de partida documentado com metodologia própria e
  explícita** (não a metodologia oficial prescrita, porque não existe uma única); ela precisa ser validada ou
  ajustada pelo responsável pelo PGR antes de virar o documento formal apresentado em fiscalização.
- Evite, em material comercial, frases que insinuem "compliance automática" ou "PGR pronto" — o correto é
  "gera os insumos/evidências para o Inventário de Riscos Psicossociais do seu PGR".

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
