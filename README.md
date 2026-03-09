# AffordIT 🚀

**FinDebug** é um simulador de decisão financeira *client-side* projetado para desenvolvedores e profissionais de tecnologia. Diferente de gerenciadores de gastos tradicionais, o FinDebug foca em responder a pergunta: **"Eu posso comprar isso agora?"**

O projeto utiliza uma lógica de **Gestão por Envelopes (Buckets)** e **Análise de Margem de Segurança** para validar se uma aquisição (de uma DLC de jogo a um imóvel) é sustentável para o seu ecossistema financeiro.

## 🛠️ O Algoritmo de Decisão

A lógica principal baseia-se em três pilares configuráveis:

1. **Reserva de Emergência (Safety Buffer):** Calculada em meses de custo de vida (Padrão sugerido: 12 meses).
2. **Alocação de Envelopes (Buckets):** Distribuição percentual da renda líquida em categorias (Igreja, Filantropia, Investimentos, Custos Fixos).
3. **O Balde do Resto (Leisure Budget):** Todo o valor que sobra das categorias acima é destinado ao lazer e sonhos. É daqui que saem as compras de consumo.

### Estados do Sistema (Status)

* 🔴 **RED (Critical):** Patrimônio abaixo de 50% da Reserva de Emergência. Compras de luxo são bloqueadas.
* 🟡 **YELLOW (Warning):** Reserva entre 50% e 100%. Compras são permitidas com cautela e tempo de espera estendido.
* 🟢 **GREEN (Stable):** Reserva acima de 12 meses. O "Balde do Resto" está livre para uso imediato.

---

## 📋 Especificações de Casos de Uso

O sistema adapta-se à utilidade marginal do dinheiro através de gatilhos específicos:

### 1. Compras de Consumo (Gadgets, Lazer, Jogos)

Calculado estritamente sobre o **Balde do Resto**.

> `Tempo de Espera = Valor do Item / Sobra Mensal do Balde`

### 2. Ferramentas de Trabalho (Alavancagem Profissional)

Se a flag `isWorkTool` for ativada, o sistema permite o uso de parte da reserva para a compra, desde que o ROI (Retorno sobre Investimento) estimado justifique a queda momentânea de liquidez.

### 3. Grandes Ativos (Big Tickets - Casa/Carro)

Para itens que excedem 24x a renda mensal, a lógica alterna para **Análise de Fluxo de Caixa**:

* A nova parcela + custos de manutenção devem caber dentro da soma do **Balde de Lazer + Balde de Investimento**.
* A entrada não pode reduzir a Reserva de Emergência abaixo do nível **YELLOW**.

---

## 🚀 Exemplo de Configuração (JSON de Referência)

Se fôssemos representar os perfis discutidos em um estado inicial, teríamos:

```typescript
const profiles = {
  techLead: {
    income: 15000,
    fixedCosts: 2000,
    savings: 150000,
    targetReserveMonths: 12,
    buckets: { church: 15, philanthropy: 10, investments: 20 }
    // Balde do Resto automático: 42% (R$ 6.300/mês)
  },
  beginner: {
    income: 1000,
    fixedCosts: 800,
    savings: 1000,
    targetReserveMonths: 6,
    buckets: { church: 0, philanthropy: 0, investments: 0 }
    // Foco total em Alavancagem Profissional
  }
}

```

---

## 💻 Como Rodar o Projeto

Este é um projeto puramente Frontend (HTML/TS).

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/findebug.git

```


2. Instale as dependências:
```bash
npm install

```


3. Inicie o servidor de desenvolvimento:
```bash
npm run dev

```



## 🛡️ Privacidade

O FinDebug **não possui banco de dados**. Todos os cálculos são feitos localmente e os dados são armazenados apenas no `localStorage` do seu navegador. Nenhum dado financeiro é enviado para servidores externos.

---

**Desenvolvido para quem pensa em código e decide com lógica.** *Ready for deploy?*
