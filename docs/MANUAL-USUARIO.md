# Manual do Usuário — Sistema de Gestão de Frotas

**DLOG · Universidade Federal de Goiás**

---

## 1. Acesso ao Sistema

### Login
- Acesse o sistema pelo navegador (Chrome, Firefox, Edge)
- Digite seu **e-mail** e **senha**
- No primeiro acesso, o sistema pedirá que você troque a senha

### Esqueci minha senha
- Na tela de login, clique em **"Esqueci minha senha"**
- Digite seu e-mail cadastrado
- Verifique sua caixa de entrada (pode estar no spam)
- Clique no link do e-mail e defina uma nova senha (o link expira em 1 hora)

### Requisitos de senha
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial (!@#$%...)

---

## 2. Dashboard (Tela Inicial)

Ao fazer login, você verá o **Painel de Gestão da Frota** com as seguintes seções:

### Alertas Urgentes (topo, fundo vermelho)
- **Manutenções atrasadas**: veículos que passaram da data prevista de saída e ainda estão na oficina
- **KM ultrapassado**: veículos que ultrapassaram o KM da próxima manutenção preventiva

### Alertas Próximos (fundo amarelo)
- Veículos que estão se aproximando do KM de manutenção preventiva
- Mostra a **data estimada** da próxima troca baseada no KM médio/dia

### Cards de Status da Frota
| Card | Significado |
|---|---|
| Total | Quantidade total de veículos cadastrados |
| Disponíveis | Veículos prontos para uso (com %) |
| Em Uso | Veículos em viagem no momento |
| Manutenção | Veículos na oficina |
| Inativos | Veículos fora de operação |

### Manutenções em Andamento
Tabela com semáforo visual:
- 🟢 **Verde** — no prazo
- 🟡 **Amarelo** — próximo do prazo (3 dias ou menos)
- 🔴 **Vermelho** — atrasado

Mostra: veículo, descrição, tipo, dias na oficina, previsão de saída e custo.

### KPIs do Departamento
| Indicador | Meta | O que significa |
|---|---|---|
| Disponibilidade | ≥ 85% | % de veículos prontos para uso |
| MTTR | Menor melhor | Tempo médio na oficina (dias) |
| Preventiva vs Corretiva | ≥ 70% preventiva | Saúde do planejamento de manutenção |
| Prazo Cumprido | ≥ 80% | % de manutenções concluídas no prazo |

### Projeção de Preventivas
Tabela que mostra quando cada veículo vai precisar da próxima manutenção preventiva, baseada no KM médio diário.

---

## 3. Veículos

### Listar veículos
- Menu lateral → **Veículos**
- Veja todos os veículos cadastrados com placa, modelo, marca, ano, KM e status

### Cadastrar veículo (Admin)
1. Clique em **"+ Novo Veículo"**
2. Preencha os campos obrigatórios: placa, modelo, marca, ano, cor, tipo
3. Opcionais: quilometragem inicial, valor do veículo
4. Clique em **"Salvar"**

### Consultar detalhes (Dossiê do Veículo)
Clique em **"Ver"** em qualquer veículo para acessar o dossiê completo:
- **Cards de resumo**: custo total de manutenção, dias parado, próxima revisão, total de viagens, KM rodado, % do valor gasto em manutenção
- **Dados do veículo**: placa, tipo, marca/modelo, ano, cor, KM, valor, status
- **Fotos**: galeria de imagens do veículo
- **Histórico de manutenções**: tabela com data, tipo, descrição, custo e status
- **Últimas viagens**: origem, destino, motorista, KM percorrido
- **Alertas de KM**: lista de alertas com KM restante e data estimada da próxima troca

### Upload de fotos (Admin)
- Na página de edição do veículo, clique em **"Adicionar Imagem"**
- Formatos aceitos: JPEG, PNG, WEBP
- Tamanho máximo: 5 MB por imagem
- Máximo: 5 imagens por veículo

---

## 4. Manutenções

### Listar manutenções
- Menu lateral → **Manutenções**
- Veja todas as manutenções com veículo, tipo, descrição, status e custo

### Registrar manutenção
1. Clique em **"+ Nova Manutenção"**
2. Selecione o **veículo**
3. Escolha o **tipo**: Preventiva ou Corretiva
4. Preencha: descrição, data de entrada, previsão de saída, previsão de dias, custo estimado
5. **Checklist** (opcional): marque itens inspecionados e indique problemas encontrados
6. **Itens de serviço**: adicione cada serviço realizado com nome e valor
7. Clique em **"Salvar"**
8. O veículo será automaticamente marcado como **"Em Manutenção"**

### Status de manutenção
| Status | Significado |
|---|---|
| Aguardando | Manutenção registrada, aguardando início |
| Em andamento | Sendo executada |
| Concluída | Finalizada — veículo volta para "Disponível" |
| Cancelada | Cancelada — veículo volta para "Disponível" |

---

## 5. Viagens

### Listar viagens
- Menu lateral → **Viagens**
- Use os **filtros** no topo: busca por texto, status, veículo, motorista, unidade, UF, período

### Criar viagem
1. Clique em **"+ Nova Viagem"**
2. Preencha:
   - **Veículo** (apenas disponíveis aparecem)
   - **Motorista** (apenas ativos)
   - **Destino** e **Origem** (padrão: Goiânia, GO)
   - **Data de Saída** e **KM Inicial**
3. Opcionais: Motorista 2, Unidade, UF Destino, Processo SEI, Solicitante
4. **Diárias**: ao preencher valor da diária + quantidade, o total é calculado automaticamente
5. **PCDP**: obrigatório quando há diárias. Expanda a seção "PCDP Motorista 1"
6. Clique em **"Salvar"**

### Validações automáticas
- O sistema **bloqueia** a criação se o veículo já tem outra viagem ou manutenção no período
- Mensagem de erro indica qual é o conflito (destino, motorista)

### Status de viagem
| Status | O que acontece com o veículo |
|---|---|
| Agendada | Veículo continua disponível |
| Em Andamento | Veículo muda para "Em Uso" |
| Concluída | KM do veículo é atualizado, volta para "Disponível" |
| Cancelada | Veículo volta para "Disponível" |

---

## 6. Unidades

### Listar e cadastrar
- Menu lateral → **Unidades**
- Veja as unidades da UFG cadastradas no sistema
- Admin pode criar novas unidades com **sigla** e **nome**

---

## 7. Relatórios

### Relatório de custos
- Menu lateral → **Relatórios**
- Filtros: data início e data fim
- **Cards**: custo total, média por veículo, veículo mais caro, total de manutenções
- **Gráfico de barras**: custo por veículo
- **Gráfico de linha**: evolução mensal dos custos
- **Tabela**: detalhamento por veículo (placa, modelo, marca, custo, qtd manutenções)

### Exportar CSV
- Clique no botão **"Exportar CSV"** no canto do filtro
- O arquivo abre no Excel (formato BR com separador `;`)

---

## 8. Perfis de Acesso

| Ação | Operador | Administrador |
|---|---|---|
| Ver dashboard, veículos, viagens, manutenções | ✅ | ✅ |
| Criar/editar viagens | ✅ | ✅ |
| Criar/editar manutenções | ✅ | ✅ |
| Criar/editar/excluir veículos | ❌ | ✅ |
| Criar/editar/excluir unidades | ❌ | ✅ |
| Upload/exclusão de fotos | ❌ | ✅ |
| Criar/excluir alertas de KM | ❌ | ✅ |
| Excluir viagens/manutenções | ❌ | ✅ |

---

## 9. Dicas Rápidas

- **Semáforo de cores**: verde = ok, amarelo = atenção, vermelho = urgente
- **KM médio/dia**: calculado automaticamente baseado no histórico de viagens do veículo
- **Projeção de data**: estima quando a próxima preventiva será necessária
- **% do valor**: indica quanto já foi gasto em manutenção comparado ao valor do veículo (verde < 30%, amarelo 30-60%, vermelho > 60%)
- **Alertas por e-mail**: o sistema envia e-mails automáticos quando manutenções estão atrasadas ou KM de troca foi ultrapassado (requer configuração de SMTP)
