### 1. Compras de Lazer (Lifestyle Expenses)

* **Foco:** Gratificação instantânea e qualidade de vida.
* **A Lógica:** É a mais rígida. O dinheiro deve vir **estritamente** do "Balde do Resto" (o que sobra após dízimo, investimentos e custos fixos).
* **Cálculo:** `Tempo de Espera = Preço / Sobra Mensal do Lazer`.
* **Trava de Segurança:** Se a Reserva de Emergência estiver abaixo de 6 meses, o sistema bloqueia o lazer e redireciona o valor para a reserva.

### 2. Ferramentas de Trabalho (Professional ROI)

* **Foco:** Aumento da capacidade produtiva (Alavancagem).
* **A Lógica:** O item é um multiplicador de renda. Aceita-se reduzir a liquidez (patrimônio) para adquirir o bem, pois ele se "paga" através do aumento do valor da sua hora ou produtividade.
* **Cálculo:** `Impacto na Reserva vs. Ganho Estimado`.
* **Trava de Segurança:** Permite compra mesmo com reserva em nível **YELLOW** (6 meses), desde que o ROI seja justificável.

### 3. Grandes Sonhos (Big Tickets / High-Value Assets)

* **Foco:** Moradia e Mobilidade (Geralmente envolvem dívida ou grande aporte).
* **A Lógica:** Analisa o **impacto estrutural** no fluxo de caixa por anos.
* **Cálculo:**
* **Imóveis:** `(Nova Parcela + Manutenção - Aluguel Antigo) <= (Balde de Investimento + Lazer)`.
* **Carros:** `(Parcela + Manutenção + Depreciação) <= Balde de Lazer`.


* **Trava de Segurança:** Exige entrada mínima que não zere a reserva de emergência de 12 meses.

---

### Proposta de UI para a Issue:

No componente de entrada do "Sonho", o usuário verá um **Dropdown** ou **Toggle Group**:

`[ Lazer 🏖️ ] [ Ferramenta 🛠️ ] [ Grande Sonho 🏠 ]`

Ao selecionar, o formulário deve expandir campos específicos (ex: se escolher "Grande Sonho", aparecem os campos "Valor da Parcela" e "Custo de Manutenção").
