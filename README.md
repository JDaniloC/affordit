# AffordIT 🚀

Simulador de decisão financeira *client-side* que responde a uma pergunta: **"Eu posso comprar isso agora?"**.

Diferente de gerenciadores de gastos, o AffordIT cruza renda, custo de vida, reserva de emergência, parcelas em andamento e suas metas de compra para **classificar a decisão** com viés conservador — o app só diz "Pode comprar" quando a compra é realmente segura para o seu fluxo e patrimônio.

---

## Funcionalidades

### Decisão com graus de risco

O resultado da simulação tem três tiers, e nenhum deles é um "sim fácil":

- ✅ **Pode comprar** — fluxo, reserva e patrimônio aguentam.
- ⚠️ **Ainda não** — passa em algumas regras mas tem alertas materiais. O subtítulo explica o motivo mais grave.
- 🚫 **Não comprar** — a compra estoura uma das regras essenciais.

O veredito vem acompanhado de **chips de risco** quando há sinais a destacar:

- 🔻 **Compromete X% do seu patrimônio** — se a compra ultrapassa a faixa de risco para o tipo (lazer/ferramenta/passivo).
- 🔻 **Lazer com parcelamento ativo** — penaliza compras de lazer quando já há parcelas em andamento.
- 🔻 **Parcela consome >50% da sobra de lazer** — alerta de aperto no orçamento mensal.
- 🔻 **Reserva de emergência ficaria abaixo do alvo** — força "Não comprar".
- 🔻 **Atrasa sua meta em N meses** — gravidade aumenta com o tamanho do atraso. >12 meses força "Não comprar".
- 🔻 **DTI subiria para X%** — comprometimento de renda acima de 30%.

### Planejador de metas múltiplas

Para quem precisa decidir entre vários desejos concorrentes:

- Cadastre uma fila de itens (notebook, viagem, bicicleta, carro...).
- O app calcula quando cada um cabe no seu orçamento, em sequência: 100% da sobra mensal vai para a primeira meta até completar, depois passa para a próxima.
- Reordene a fila com botões ↑/↓ ou arrastando.
- Marque metas como inatingíveis quando a sobra atual não dá conta delas, sem travar as outras.
- Capital acima da reserva entra como *head start* — se você já tem dinheiro parado, a primeira meta começa parcialmente coberta.

Quando você simula um item específico tendo metas cadastradas, o resultado mostra duas hipóteses:

- **Hipótese A** — Comprar agora (pular a fila): mostra quantos meses cada meta atrasaria.
- **Hipótese B** — Esperar a vez na fila: mostra em que mês o item cabe assumindo que entra no fim da fila.

### Avisos educativos durante o preenchimento

- **Regra 50/30/20:** alerta inline no Step 1 quando o custo de vida ultrapassa 50% da renda, mostrando quanto precisaria cortar para chegar a 50%.
- **Custos ocultos do bem:** para passivos de alto valor (carro, imóvel), botão "Sugerir 1% do valor" pré-preenche manutenção + IPVA + seguro + combustível + condomínio.

### Sob o capô

- **Reserva de emergência** em meses de custo de vida.
- **Envelopes** (buckets) — divisão percentual da renda em categorias (igreja, filantropia, investimentos...). O que sobra é o "balde de lazer".
- **Custo real do financiamento** — sistema Price calculando juros totais quando aplicável.
- **Parcelas em andamento** descontadas do balde de lazer em toda a simulação.
- **Projeção de patrimônio com juros compostos** — taxa de rendimento anual convertida para mensal.
- **Score de saúde financeira** (0–100 pts) — atualiza ao vivo enquanto o usuário preenche.
- **Validação de passivo de alto valor** — entrada, DTI e margem de manobra para carros/imóveis/equipamentos caros.

---

## Estados do Sistema

* 🔴 **RED** — patrimônio abaixo de 50% da reserva de emergência alvo.
* 🟡 **YELLOW** — reserva entre 50% e 100%.
* 🟢 **GREEN** — reserva ≥ 12 meses (configurável).

A camada de risco de patrimônio aplica regras adicionais que **só rebaixam** o veredito existente — nunca aprovam algo que outras regras tenham reprovado.

---

## Como rodar

```bash
git clone https://github.com/seu-usuario/affordit.git
cd affordit
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

Testes:

```bash
npm test           # roda uma vez
npm run test:watch # modo watch
```

São ~370 testes cobrindo lógica pura (cronograma, score, validações, regras educativas) e componentes UI (planejador, card de fila, chips de risco).

---

## Privacidade

O AffordIT **não possui banco de dados**. Todos os cálculos rodam no navegador e os dados ficam apenas no `localStorage`. Nenhuma informação financeira é enviada para servidores externos.

---

**Desenvolvido para quem pensa em código e decide com lógica.**
