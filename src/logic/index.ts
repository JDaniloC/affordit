/**
 * Lógica pura do simulador — sem acesso ao DOM.
 * Pode ser importada tanto pelo App quanto pelos testes.
 */

export interface Envelope {
  id?: number
  nome: string
  pct: number
}

export type StatusReserva = 'perigo' | 'atencao' | 'seguranca'
export type StatusPatrimonio = 'green' | 'yellow' | 'red'

export interface SimularParams {
  renda: number
  custo: number
  patrimonio: number
  reservaMeses: number
  itemValor: number
  itemNome: string
  ferramenta: boolean
  envelopes: Envelope[]
  parcelas?: number
  parcelasExistentes?: number
}

export interface Veredito {
  tipo: 'aprovado' | 'negado' | 'juntar'
  titulo: string
  subtitulo?: string
}

export interface SimularDebug {
  reservaAlvo: number
  lazerPct: number
  sobraLazerMensal: number
  statusReserva: StatusReserva
  // New fields for the richer decision tree
  disponivel: number           // patrimônio - reservaAlvo (can be negative)
  dentro1pct: boolean          // itemValor ≤ 1% do patrimônio
  parcelaValor: number         // itemValor / parcelas
  parcelaCabe: boolean         // parcelaValor ≤ sobraLazerMensal
  parcelasExistentes: number   // parcelas mensais já comprometidas
}

export interface SimularResult {
  veredito: Veredito
  acoes: string[]
  debug: SimularDebug
}

export interface FluxoCaixaResult {
  delay: number | null
  parcelaValor: number
  parcelaCabe: boolean
}

export interface StatusPatrimonioResult {
  statusAtual: StatusPatrimonio
  statusAposCompra: StatusPatrimonio
  alertaDegracao: boolean
  dentro1pct: boolean
}

export interface ValidarBigTicketParams {
  patrimonio: number
  entrada: number
  custo: number
  novaParcela: number
  manutencao: number
  balceLazer: number
  baldeInvestimento: number
  aluguelSubstituido: number
  renda: number
}

export interface ValidarBigTicketResult {
  passouEntrada: boolean
  passouDTI: boolean
  passouMargem: boolean
  aprovado: boolean
}

export interface ValidarVeiculoParams {
  parcela: number
  custoOculto: number
  balceLazer: number
  renda: number
}

export interface ValidarImovelParams {
  novoCustoFixo: number
  renda: number
  baldeInvestimento: number
  balceLazer: number
  parcela?: number
}

export interface CriterioInfo {
  id: string
  titulo: string
  subtitulo: string
  descricao: string
  quando_usar: string
}

/**
 * @param renda
 * @param custo
 * @param envelopes
 * @returns porcentagem do balde de lazer (0–100)
 */
function calcLazerPct(renda: number, custo: number, envelopes: Envelope[]): number {
  if (renda <= 0) return 0
  const custoVidaPct = (custo / renda) * 100
  const totalEnvelopes = envelopes.reduce((acc, e) => acc + (e.pct || 0), 0)
  return Math.max(0, 100 - custoVidaPct - totalEnvelopes)
}

/**
 * @param patrimonio
 * @param reservaAlvo
 * @returns status da reserva
 */
function calcStatusReserva(patrimonio: number, reservaAlvo: number): StatusReserva {
  if (reservaAlvo === 0) return 'seguranca'
  if (patrimonio < reservaAlvo / 2) return 'perigo'
  if (patrimonio < reservaAlvo) return 'atencao'
  return 'seguranca'
}

/**
 * @param p SimularParams
 * @returns { veredito, acoes, debug }
 *
 * Decision tree:
 * 1. Regra do 1%:  item ≤ 1% patrimônio → always approve
 * 2. temDinheiro:  disponivel (= patrimônio - reservaAlvo) ≥ itemValor → approve
 * 3. ferramenta:   parcelaCabe AND patrimônioNaoNegativo → approve with ressalvas
 * 4. else:         deny
 */
function simularLogica(p: SimularParams): SimularResult {
  const parcelas = p.parcelas ?? 1
  const parcelasExistentes = p.parcelasExistentes ?? 0
  const reservaAlvo = p.custo * p.reservaMeses
  const lazerPct = calcLazerPct(p.renda, p.custo, p.envelopes)
  const sobraLazerMensal = Math.max(0, (lazerPct / 100) * p.renda - parcelasExistentes)
  const statusReserva = calcStatusReserva(p.patrimonio, reservaAlvo)

  const dentro1pct = p.patrimonio > 0 && p.itemValor <= p.patrimonio * 0.01
  const disponivel = p.patrimonio - reservaAlvo
  const temDinheiro = disponivel >= p.itemValor
  const parcelaValor = parcelas > 0 ? p.itemValor / parcelas : p.itemValor
  const parcelaCabe = sobraLazerMensal > 0 && parcelaValor <= sobraLazerMensal

  const debug: SimularDebug = {
    reservaAlvo, lazerPct, sobraLazerMensal, statusReserva,
    dentro1pct, disponivel, parcelaValor, parcelaCabe, parcelasExistentes,
  }

  // ── 1. REGRA DO 1% ── always approve, regardless of reserve or cash
  if (dentro1pct) {
    const pct = ((p.itemValor / p.patrimonio) * 100).toFixed(1)
    return {
      veredito: { tipo: 'aprovado', titulo: 'Compra Aprovada', subtitulo: 'Regra do 1% — risco zero' },
      acoes: [
        `O item (R$ ${p.itemValor.toFixed(2)}) representa ${pct}% do seu patrimônio — dentro da Regra do 1%.`,
        'O impacto no seu patrimônio é negligenciável.',
        'Compra aprovada sem restrições.',
      ],
      debug,
    }
  }

  // ── 2. APROVADO ── has reserve + available cash beyond reserve
  if (temDinheiro) {
    return {
      veredito: { tipo: 'aprovado', titulo: 'Compra Aprovada' },
      acoes: [
        `Reserva: R$ ${p.patrimonio.toFixed(2)} / R$ ${reservaAlvo.toFixed(2)} — completa.`,
        `Disponível além da reserva: R$ ${disponivel.toFixed(2)}. Item: R$ ${p.itemValor.toFixed(2)}.`,
        'Compra à vista sem comprometer a reserva de emergência.',
      ],
      debug,
    }
  }

  // ── 3. FERRAMENTA EXCEPTION ──
  if (p.ferramenta) {
    // Paying à vista would make patrimônio negative; parcelado payments come from cash flow
    const patrimonioNaoNegativo = parcelas > 1 || p.patrimonio >= p.itemValor

    if (parcelaCabe && patrimonioNaoNegativo) {
      const motivoBase = disponivel < 0
        ? `Reserva incompleta: R$ ${p.patrimonio.toFixed(2)} / R$ ${reservaAlvo.toFixed(2)}.`
        : `Sem dinheiro extra além da reserva para cobrir o item.`
      return {
        veredito: { tipo: 'aprovado', titulo: 'Aprovado com Ressalvas', subtitulo: 'Ferramenta de trabalho' },
        acoes: [
          motivoBase,
          `Como ferramenta de trabalho: parcela de R$ ${parcelaValor.toFixed(2)}/mês cabe no lazer (R$ ${sobraLazerMensal.toFixed(2)}/mês).`,
          'Certifique-se de que o retorno do item justifica o compromisso.',
        ],
        debug,
      }
    }

    const motivoNegado = !parcelaCabe
      ? `Parcela de R$ ${parcelaValor.toFixed(2)} excede o lazer de R$ ${sobraLazerMensal.toFixed(2)}.`
      : `Pagamento à vista deixaria o patrimônio negativo (R$ ${p.patrimonio.toFixed(2)} < R$ ${p.itemValor.toFixed(2)}).`
    const dicaFluxo = sobraLazerMensal > 0
      ? `Você precisaria de ${Math.ceil(p.itemValor / sobraLazerMensal)} meses de lazer acumulado.`
      : 'Revise seus envelopes para liberar sobra de lazer.'
    return {
      veredito: { tipo: 'negado', titulo: 'Negado', subtitulo: 'Ferramenta sem fluxo suficiente' },
      acoes: [motivoNegado, 'Mesmo sendo ferramenta, o fluxo de caixa não suporta as parcelas.', dicaFluxo],
      debug,
    }
  }

  // ── 4. NEGADO ──
  const hasReserve = p.patrimonio >= reservaAlvo

  if (!hasReserve) {
    const falta = reservaAlvo - p.patrimonio
    const dicaReserva = sobraLazerMensal > 0
      ? `Com R$ ${sobraLazerMensal.toFixed(2)}/mês de lazer, a reserva estará completa em ${Math.ceil(falta / sobraLazerMensal)} mês(es).`
      : 'Revise seus envelopes para liberar sobra de lazer.'
    return {
      veredito: { tipo: 'negado', titulo: 'Negado', subtitulo: 'Sem reserva de emergência' },
      acoes: [
        `Reserva: R$ ${p.patrimonio.toFixed(2)} / R$ ${reservaAlvo.toFixed(2)} — faltam R$ ${falta.toFixed(2)}.`,
        'Forme a reserva de emergência antes de qualquer compra.',
        dicaReserva,
      ],
      debug,
    }
  }

  // Has reserve, but disponivel < itemValor
  const faltaItem = p.itemValor - disponivel
  const dicaAcumulo = sobraLazerMensal > 0
    ? `Acumule mais R$ ${faltaItem.toFixed(2)} (${Math.ceil(faltaItem / sobraLazerMensal)} meses de lazer).`
    : 'Revise seus envelopes para liberar sobra de lazer.'
  return {
    veredito: { tipo: 'negado', titulo: 'Negado', subtitulo: 'Sem dinheiro além da reserva' },
    acoes: [
      `Reserva completa: R$ ${reservaAlvo.toFixed(2)}.`,
      `Disponível além da reserva: R$ ${Math.max(0, disponivel).toFixed(2)}. Falta: R$ ${faltaItem.toFixed(2)}.`,
      dicaAcumulo,
    ],
    debug,
  }
}

// ===========================================================
// CRITÉRIO 1: FLUXO DE CAIXA
// ===========================================================

function calcFluxoCaixa(
  itemValor: number,
  sobraLazerMensal: number,
  parcelas: number = 1,
): FluxoCaixaResult {
  const parcelaValor = itemValor / parcelas
  const parcelaCabe = sobraLazerMensal > 0 && parcelaValor <= sobraLazerMensal
  const delay = sobraLazerMensal > 0 ? Math.ceil(itemValor / sobraLazerMensal) : null
  return { delay, parcelaValor, parcelaCabe }
}

// ===========================================================
// CRITÉRIO 2: PATRIMÔNIO (NET WORTH & SAFETY)
// ===========================================================

function _statusFromPatrimonio(patrimonio: number, custo: number): StatusPatrimonio {
  if (custo <= 0) return 'green'
  if (patrimonio >= custo * 12) return 'green'
  if (patrimonio >= custo * 6) return 'yellow'
  return 'red'
}

const _statusOrder: Record<StatusPatrimonio, number> = { green: 2, yellow: 1, red: 0 }

function calcStatusPatrimonio(
  patrimonio: number,
  custo: number,
  itemValor: number,
): StatusPatrimonioResult {
  const statusAtual = _statusFromPatrimonio(patrimonio, custo)
  const statusAposCompra = _statusFromPatrimonio(patrimonio - itemValor, custo)
  const alertaDegracao = _statusOrder[statusAposCompra] < _statusOrder[statusAtual]
  const dentro1pct = patrimonio > 0 && itemValor <= patrimonio * 0.01
  return { statusAtual, statusAposCompra, alertaDegracao, dentro1pct }
}

// ===========================================================
// CRITÉRIO 3: ROI PROFISSIONAL
// ===========================================================

function calcRoiAprovacao(statusPatrimonio: StatusPatrimonio, ferramenta: boolean): boolean {
  return ferramenta === true && statusPatrimonio !== 'red'
}

// ===========================================================
// IMPACTO NO OBJETIVO DE ACUMULAÇÃO
// ===========================================================

// ===========================================================
// CUSTO REAL DO FINANCIAMENTO COM JUROS (P0.2)
// ===========================================================

export interface CustoFinanciamentoResult {
  totalPago: number
  totalJuros: number
  parcelaValor: number
}

/**
 * Calcula o custo real de um financiamento usando o sistema Price (parcelas fixas).
 * @param valor - valor total do item
 * @param parcelas - número de parcelas
 * @param taxaMensal - taxa de juros mensal em percentual (ex: 2 = 2% a.m.)
 */
function calcCustoComJuros(
  valor: number,
  parcelas: number,
  taxaMensal: number,
): CustoFinanciamentoResult {
  const n = Math.max(1, parcelas)
  if (taxaMensal <= 0 || n <= 1) {
    return { totalPago: valor, totalJuros: 0, parcelaValor: valor / n }
  }
  const i = taxaMensal / 100
  const fator = Math.pow(1 + i, n)
  const parcelaValor = valor * (i * fator) / (fator - 1)
  const totalPago = parcelaValor * n
  const totalJuros = totalPago - valor
  return { totalPago, totalJuros, parcelaValor }
}

// ===========================================================
// PASSIVO DE ALTO VALOR — validação unificada (P0.1)
// Generaliza veículo e imóvel: qualquer bem com alto valor,
// custos mensais recorrentes e depreciação.
// ===========================================================

export interface ValidarPassivoAltoValorParams {
  patrimonio: number
  renda: number
  custo: number
  entrada: number
  parcela: number            // parcela mensal do financiamento
  manutencao: number         // custo mensal de manutenção
  despesaSubstituida: number // despesa substituída pelo bem (ex: aluguel atual)
  baldeLazer: number         // sobra mensal de lazer
  baldeInvestimento: number  // soma dos envelopes de investimento em R$
}

export type ValidarPassivoAltoValorResult = ValidarBigTicketResult

/**
 * Valida a viabilidade de um passivo de alto valor (carro, imóvel, equipamento caro).
 * Aplica as 3 regras: entrada, DTI e margem de manobra.
 */
function validarPassivoAltoValor(p: ValidarPassivoAltoValorParams): ValidarPassivoAltoValorResult {
  return validarBigTicket({
    patrimonio: p.patrimonio,
    entrada: p.entrada,
    custo: p.custo,
    novaParcela: p.parcela,
    manutencao: p.manutencao,
    balceLazer: p.baldeLazer,
    baldeInvestimento: p.baldeInvestimento,
    aluguelSubstituido: p.despesaSubstituida,
    renda: p.renda,
  })
}

export interface MetaFinanceiraResult {
  mesesSemCompra: number | null
  mesesComCompra: number | null
  atrasoMeses: number | null
  metaJaAtingida: boolean
}

const HORIZONTE_META = 600 // 50 anos — horizonte máximo de projeção

function calcImpactoMetaFinanceira(
  patrimonio: number,
  aporteMensal: number,
  itemValor: number,
  parcelas: number,
  meta: number,
  taxaMensal: number = 0,
): MetaFinanceiraResult {
  if (meta <= 0) {
    return { mesesSemCompra: null, mesesComCompra: null, atrasoMeses: null, metaJaAtingida: false }
  }

  if (patrimonio >= meta) {
    return { mesesSemCompra: 0, mesesComCompra: 0, atrasoMeses: 0, metaJaAtingida: true }
  }

  if (aporteMensal <= 0) {
    return { mesesSemCompra: null, mesesComCompra: null, atrasoMeses: null, metaJaAtingida: false }
  }

  const { semCompra, comCompra } = calcImpactoCompraNoPatrimonio(
    patrimonio, aporteMensal, HORIZONTE_META, itemValor, parcelas, taxaMensal,
  )

  const mesesSemCompra = calcMesQueAtingeMeta(semCompra, meta)
  const mesesComCompra = calcMesQueAtingeMeta(comCompra, meta)
  const atrasoMeses = calcAtrasoCompra(semCompra, comCompra, meta)

  return { mesesSemCompra, mesesComCompra, atrasoMeses, metaJaAtingida: false }
}

// ===========================================================
// SELEÇÃO AUTOMÁTICA DE CRITÉRIO
// Regra do 1% (patrimônio) é forte: ativa quando item ≤ 1% do patrimônio.
// Caso contrário, usa fluxo de caixa.
// ===========================================================

function selectCriterioAuto(patrimonio: number, itemValor: number): 'fluxo' | 'patrimonio' {
  if (patrimonio > 0 && itemValor <= patrimonio * 0.01) return 'patrimonio'
  return 'fluxo'
}

// ===========================================================
// METADADOS DOS CRITÉRIOS (para uso na UI)
// ===========================================================

const CRITERIOS: Record<string, CriterioInfo> = {
  fluxo: {
    id: 'fluxo',
    titulo: 'Fluxo de Caixa',
    subtitulo: 'O item cabe no seu salário?',
    descricao:
      'Verifica se o valor (ou parcela) cabe 100% no seu balde de lazer mensal, ' +
      'sem depender de reservas ou patrimônio. Ideal para quem quer manter ' +
      'o orçamento equilibrado mês a mês.',
    quando_usar:
      'Use quando sua prioridade é não comprometer o fluxo mensal — ' +
      'especialmente se você ainda está construindo sua reserva.',
  },
  patrimonio: {
    id: 'patrimonio',
    titulo: 'Patrimônio',
    subtitulo: 'A compra coloca sua segurança em risco?',
    descricao:
      'Analisa o impacto da compra na sua reserva de emergência. ' +
      'O termômetro vai de RED (<6 meses de custo de vida) a GREEN (≥12 meses). ' +
      'Inclui a Regra do 1%: compras abaixo de 1% do patrimônio são consideradas risco zero.',
    quando_usar:
      'Use quando você tem patrimônio acumulado e quer garantir que um desejo ' +
      'momentâneo não destrua anos de acumulação.',
  },
  roi: {
    id: 'roi',
    titulo: 'ROI Profissional',
    subtitulo: 'O item pode aumentar sua renda?',
    descricao:
      'Para ferramentas de trabalho, o retorno esperado é levado em conta. ' +
      'Permite a compra mesmo em estado YELLOW (reserva entre 6 e 12 meses), ' +
      'diferenciando "gasto" de "investimento em infraestrutura humana".',
    quando_usar:
      'Use para notebooks, equipamentos, cursos ou qualquer item que tenha ' +
      'potencial comprovado de aumentar sua renda ou produtividade.',
  },
}

// ===========================================================
// BIG TICKET — ATIVAÇÃO
// ===========================================================

function isBigTicket(itemValor: number, renda: number, isHighValueAsset: boolean): boolean {
  return isHighValueAsset === true || itemValor > renda * 24
}

// ===========================================================
// BIG TICKET — CHECAGEM A: VALIDAÇÃO DE ENTRADA
// ===========================================================

function validarEntrada(patrimonio: number, entrada: number, custo: number): boolean {
  return patrimonio - entrada >= custo * 6
}

// ===========================================================
// BIG TICKET — CHECAGEM B: TAXA DE ESFORÇO (DTI)
// ===========================================================

function calcDTI(
  novaParcela: number,
  manutencao: number,
  balceLazer: number,
  baldeInvestimento: number,
  aluguelSubstituido: number,
): boolean {
  return novaParcela + manutencao - aluguelSubstituido <= balceLazer + baldeInvestimento
}

// ===========================================================
// BIG TICKET — CHECAGEM C: MARGEM DE MANOBRA
// ===========================================================

function calcMargemManobra(
  renda: number,
  custo: number,
  novaParcela: number,
  aluguelSubstituido: number,
): boolean {
  const custoEfetivo = custo - aluguelSubstituido
  const sobra = renda - custoEfetivo - novaParcela
  return sobra >= renda * 0.05
}

// ===========================================================
// BIG TICKET — VEÍCULOS
// ===========================================================

function calcCustoOcultoVeiculo(itemValor: number): number {
  return itemValor * 0.01
}

function validarVeiculo({ parcela, custoOculto, balceLazer, renda }: ValidarVeiculoParams): boolean {
  const cabeLazer = parcela + custoOculto <= balceLazer
  const dentroDeTeto = parcela < renda * 0.2
  return cabeLazer && dentroDeTeto
}

// ===========================================================
// BIG TICKET — IMÓVEIS
// ===========================================================

function calcNovoCustoFixoImovel(
  custoFixoAtual: number,
  aluguel: number,
  parcela: number,
  condominioIPTU: number,
): number {
  return custoFixoAtual - aluguel + parcela + condominioIPTU
}

function validarImovel({
  novoCustoFixo,
  renda,
  baldeInvestimento,
  balceLazer,
  parcela,
}: ValidarImovelParams): boolean {
  if (parcela !== undefined && parcela >= renda * 0.35) return false
  if (novoCustoFixo <= renda * 0.5) return true
  const diferenca = novoCustoFixo - renda * 0.5
  return baldeInvestimento >= diferenca && balceLazer > 0
}

// ===========================================================
// BIG TICKET — ORQUESTRADOR
// ===========================================================

function validarBigTicket(p: ValidarBigTicketParams): ValidarBigTicketResult {
  const passouEntrada = validarEntrada(p.patrimonio, p.entrada, p.custo)
  const passouDTI = calcDTI(
    p.novaParcela,
    p.manutencao,
    p.balceLazer,
    p.baldeInvestimento,
    p.aluguelSubstituido,
  )
  const passouMargem = calcMargemManobra(p.renda, p.custo, p.novaParcela, p.aluguelSubstituido)
  return {
    passouEntrada,
    passouDTI,
    passouMargem,
    aprovado: passouEntrada && passouDTI && passouMargem,
  }
}

// ===========================================================
// TIPOS DE COMPRA (types.md)
// ===========================================================

// --- Tipo 1: Lazer ---

function calcTempoEsperaLazer(preco: number, sobraLazerMensal: number): number | null {
  if (sobraLazerMensal <= 0) return null
  return Math.ceil(preco / sobraLazerMensal)
}

function isLazerBloqueado(patrimonio: number, custo: number): boolean {
  if (custo <= 0) return false
  return patrimonio < custo * 6
}

// --- Tipo 2: Ferramenta ---

function isPermitidoFerramenta(patrimonio: number, custo: number): boolean {
  if (custo <= 0) return true
  return patrimonio >= custo * 6
}

// --- Tipo 3: Grande Sonho — Veículos ---

function calcCustoMensalVeiculo(
  parcela: number,
  manutencao: number,
  depreciacao: number,
): number {
  return parcela + manutencao + depreciacao
}

function validarCompraVeiculo(
  parcela: number,
  manutencao: number,
  depreciacao: number,
  baldeLazer: number,
): boolean {
  return calcCustoMensalVeiculo(parcela, manutencao, depreciacao) <= baldeLazer
}

// --- Tipo 3: Grande Sonho — Imóveis ---

function calcCustoEfetivoImovel(
  novaParcela: number,
  manutencao: number,
  aluguelAntigo: number,
): number {
  return novaParcela + manutencao - aluguelAntigo
}

function validarCompraImovel(
  novaParcela: number,
  manutencao: number,
  aluguelAntigo: number,
  baldeInvestimento: number,
  baldeLazer: number,
): boolean {
  const custoEfetivo = calcCustoEfetivoImovel(novaParcela, manutencao, aluguelAntigo)
  return custoEfetivo <= baldeInvestimento + baldeLazer
}

// --- Entrada mínima: não pode zerar reserva de 12 meses (GREEN) ---

function validarEntradaMinima(patrimonio: number, entrada: number, custo: number): boolean {
  return patrimonio - entrada >= custo * 12
}

// --- Dispatcher ---

interface LazerParams {
  preco: number
  sobraLazerMensal: number
  patrimonio: number
  custo: number
}

interface FerramentaParams {
  patrimonio: number
  custo: number
}

interface GrandeSonhoVeiculoParams {
  subtipo: 'veiculo'
  parcela: number
  manutencao: number
  depreciacao: number
  balceLazer: number
  patrimonio: number
  entrada: number
  custo: number
}

interface GrandeSonhoImovelParams {
  subtipo: 'imovel'
  novaParcela: number
  manutencao: number
  aluguelAntigo: number
  baldeInvestimento: number
  balceLazer: number
  patrimonio: number
  entrada: number
  custo: number
}

type GrandeSonhoParams = GrandeSonhoVeiculoParams | GrandeSonhoImovelParams

type ResolverParams = LazerParams | FerramentaParams | GrandeSonhoParams

function resolverTipoCompra(
  tipo: 'lazer' | 'ferramenta' | 'grandeSonho',
  params: ResolverParams,
): Record<string, unknown> {
  if (tipo === 'lazer') {
    const p = params as LazerParams
    const bloqueado = isLazerBloqueado(p.patrimonio, p.custo)
    const tempoEspera = calcTempoEsperaLazer(p.preco, p.sobraLazerMensal)
    return { bloqueado, tempoEspera }
  }

  if (tipo === 'ferramenta') {
    const p = params as FerramentaParams
    return { permitido: isPermitidoFerramenta(p.patrimonio, p.custo) }
  }

  if (tipo === 'grandeSonho') {
    const p = params as GrandeSonhoParams
    const entradaOk = validarEntradaMinima(p.patrimonio, p.entrada, p.custo)
    const reprovadoNaEntrada = !entradaOk

    let compraCabe = false
    if (p.subtipo === 'veiculo') {
      const vp = p as GrandeSonhoVeiculoParams
      compraCabe = validarCompraVeiculo(vp.parcela, vp.manutencao, vp.depreciacao, vp.balceLazer)
    } else if (p.subtipo === 'imovel') {
      const ip = p as GrandeSonhoImovelParams
      compraCabe = validarCompraImovel(
        ip.novaParcela,
        ip.manutencao,
        ip.aluguelAntigo,
        ip.baldeInvestimento,
        ip.balceLazer,
      )
    }

    return { aprovado: entradaOk && compraCabe, reprovadoNaEntrada }
  }

  return {}
}

// ===========================================================
// PROJEÇÃO DE PATRIMÔNIO
// ===========================================================

/**
 * Retorna um array com o patrimônio ao final de cada mês.
 * @param patrimonioInicial - patrimônio atual
 * @param aporteMensal - quanto é poupado/investido por mês
 * @param meses - número de meses a projetar
 * @param taxaMensal - rendimento mensal em % (ex: 1 = 1% a.m.). 0 = crescimento linear.
 */
function calcProjecaoPatrimonio(
  patrimonioInicial: number,
  aporteMensal: number,
  meses: number,
  taxaMensal: number = 0,
): number[] {
  const result: number[] = []
  if (taxaMensal <= 0) {
    for (let i = 1; i <= meses; i++) {
      result.push(patrimonioInicial + i * aporteMensal)
    }
  } else {
    const r = taxaMensal / 100
    let acumulado = patrimonioInicial
    for (let i = 1; i <= meses; i++) {
      acumulado = acumulado * (1 + r) + aporteMensal
      result.push(acumulado)
    }
  }
  return result
}

/**
 * Compara a trajetória patrimonial com e sem uma compra.
 * Compras parceladas reduzem o aporte efetivo durante o período das parcelas.
 * @param patrimonioInicial
 * @param aporteMensal
 * @param meses
 * @param itemValor - valor total do item
 * @param parcelas - número de parcelas (1 = à vista)
 * @param taxaMensal - rendimento mensal em % (ex: 1 = 1% a.m.). 0 = linear.
 */
function calcImpactoCompraNoPatrimonio(
  patrimonioInicial: number,
  aporteMensal: number,
  meses: number,
  itemValor: number,
  parcelas: number,
  taxaMensal: number = 0,
): { semCompra: number[]; comCompra: number[] } {
  const semCompra = calcProjecaoPatrimonio(patrimonioInicial, aporteMensal, meses, taxaMensal)

  const parcelaValor = parcelas > 1 ? itemValor / parcelas : 0
  const patrimonioAposEntrada = parcelas === 1 ? patrimonioInicial - itemValor : patrimonioInicial
  const r = taxaMensal > 0 ? taxaMensal / 100 : 0

  const comCompra: number[] = []
  let acumulado = patrimonioAposEntrada
  for (let i = 1; i <= meses; i++) {
    const aporteEfetivo = i <= parcelas ? aporteMensal - parcelaValor : aporteMensal
    acumulado = r > 0 ? acumulado * (1 + r) + aporteEfetivo : acumulado + aporteEfetivo
    comCompra.push(acumulado)
  }

  return { semCompra, comCompra }
}

/**
 * Quantos meses para atingir a meta partindo de patrimonioInicial com aporteMensal.
 * Retorna 0 se a meta já foi atingida. Retorna null se aporteMensal <= 0 e meta > atual.
 */
function calcMesesParaMeta(
  patrimonioInicial: number,
  aporteMensal: number,
  meta: number,
): number | null {
  if (patrimonioInicial >= meta) return 0
  if (aporteMensal <= 0) return null
  return Math.ceil((meta - patrimonioInicial) / aporteMensal)
}

/**
 * Dado um array de projeção, retorna o número do mês (1-based) em que o valor
 * atinge ou supera a meta pela primeira vez. Retorna null se nunca atingir.
 */
function calcMesQueAtingeMeta(projecao: number[], meta: number): number | null {
  const idx = projecao.findIndex((v) => v >= meta)
  return idx === -1 ? null : idx + 1
}

/**
 * Calcula quantos meses a compra atrasa a chegada à meta, comparando as duas
 * projeções. Retorna null se a meta for inatingível em qualquer um dos cenários
 * dentro do horizonte da projeção.
 */
function calcAtrasoCompra(
  semCompra: number[],
  comCompra: number[],
  meta: number,
): number | null {
  const mesSem = calcMesQueAtingeMeta(semCompra, meta)
  const mesCom = calcMesQueAtingeMeta(comCompra, meta)
  if (mesSem === null || mesCom === null) return null
  return mesCom - mesSem
}

// ===========================================================
// PLANEJADOR DE METAS MÚLTIPLAS (Ciclo F)
// ===========================================================

export interface Meta {
  id: number
  nome: string
  valor: number
}

export interface MetaAgendada {
  meta: Meta
  posicao: number
  mesQueComeca: number
  mesQueCompleta: number
  mesesParaCompletar: number
  saldoInicial: number
}

export interface CronogramaResult {
  agendadas: MetaAgendada[]
  metasInatingiveis: Meta[]
}

const HORIZONTE_CRONOGRAMA = 600 // 50 anos
const HORIZONTE_PATRIMONIO = 600 // 50 anos

export interface AtrasoPorMeta {
  id: number
  meses: number | null
}

export interface AtrasoPatrimonio {
  mesesSemFila: number | null
  mesesComFila: number | null
  atrasoTotal: number | null
  atrasoPorMeta: AtrasoPorMeta[]
}

function _trajetoriaPatrimonio(
  patrimonio: number,
  sobraMensal: number,
  taxaMensal: number,
  deducoes: Array<{ mes: number; valor: number }>,
  horizonte: number,
): number[] {
  const r = taxaMensal > 0 ? taxaMensal / 100 : 0
  const dedMap = new Map<number, number>()
  for (const d of deducoes) dedMap.set(d.mes, (dedMap.get(d.mes) ?? 0) + d.valor)
  // Deduções no mês 0 reduzem imediatamente o patrimônio (compras feitas "agora",
  // pagas com o head start acima da reserva).
  const dedMes0 = dedMap.get(0) ?? 0
  let acumulado = patrimonio - dedMes0
  const traj: number[] = [acumulado]
  for (let t = 1; t <= horizonte; t++) {
    acumulado = r > 0 ? acumulado * (1 + r) + sobraMensal : acumulado + sobraMensal
    const ded = dedMap.get(t)
    if (ded) acumulado -= ded
    traj.push(acumulado)
  }
  return traj
}

function _primeiroMesQueAtinge(traj: number[], meta: number): number | null {
  for (let i = 0; i < traj.length; i++) {
    if (traj[i] >= meta) return i
  }
  return null
}

/**
 * Cronograma "saudável": adia cada meta até que dois critérios sejam
 * satisfeitos simultaneamente — (1) o valor da meta seja no máximo
 * `pctMaxPatrimonio` do patrimônio acumulado naquele mês; (2) a compra
 * atrase a meta de patrimônio em no máximo `atrasoMaxPorMeta` meses.
 * Mantém a ordem da fila do usuário; não reordena.
 */
function calcCronogramaSaudavel(
  metas: Meta[],
  patrimonio: number,
  sobraMensal: number,
  taxaMensal: number,
  metaValor: number,
  pctMaxPatrimonio: number,
  atrasoMaxPorMeta: number,
  reservaAlvo: number,
): CronogramaResult {
  const horizonte = HORIZONTE_CRONOGRAMA
  const agendadas: MetaAgendada[] = []
  const inatingiveis: Meta[] = []
  let mesMinimo = 0

  // Piso rígido do plano de crescimento (Ciclo G):
  // floorPlano(t) = patrimonio * (1 + r)^t — capital inicial cresce intocado
  // à taxa configurada. Compras só podem ser financiadas pela sobra acumulada.
  const r = taxaMensal > 0 ? taxaMensal / 100 : 0
  const floorPlano = (t: number): number =>
    r > 0 ? patrimonio * Math.pow(1 + r, t) : patrimonio

  for (let i = 0; i < metas.length; i++) {
    const m = metas[i]
    const valor = Math.max(0, m.valor)
    let mesEscolhido: number | null = null

    const filaAteAqui = agendadas.map((a) => ({
      mes: a.mesQueCompleta,
      valor: a.meta.valor,
    }))

    // trajetória já fixada pelas compras anteriores
    const trajAtual = _trajetoriaPatrimonio(
      patrimonio,
      sobraMensal,
      taxaMensal,
      filaAteAqui,
      horizonte,
    )

    for (let t = mesMinimo; t <= horizonte; t++) {
      const patrimonioNoMomento = trajAtual[t]
      if (patrimonioNoMomento <= 0) continue
      // Reserva precisa permanecer coberta após a compra
      if (patrimonioNoMomento - valor < reservaAlvo) continue
      // Critério 1: valor ≤ X% do patrimônio
      if (patrimonioNoMomento * pctMaxPatrimonio < valor) continue

      // Critério 3 (Ciclo G): piso rígido do plano de crescimento.
      // Patrimônio pós-compra deve ficar ≥ floorPlano(t).
      // Demonstrável: se vale no momento da compra, vale para todo s ≥ t.
      if (patrimonioNoMomento - valor < floorPlano(t)) continue

      // Critério 2: atraso marginal na meta de patrimônio
      if (metaValor > 0) {
        const filaCom = [...filaAteAqui, { mes: t, valor }]
        const trajCom = _trajetoriaPatrimonio(
          patrimonio,
          sobraMensal,
          taxaMensal,
          filaCom,
          horizonte,
        )
        const mesSem = _primeiroMesQueAtinge(trajAtual, metaValor)
        const mesCom = _primeiroMesQueAtinge(trajCom, metaValor)
        if (mesSem !== null && mesCom === null) continue
        if (mesSem !== null && mesCom !== null) {
          const atrasoMarginal = mesCom - mesSem
          if (atrasoMarginal > atrasoMaxPorMeta) continue
        }
      }

      mesEscolhido = t
      break
    }

    if (mesEscolhido === null) {
      inatingiveis.push(m)
      continue
    }

    agendadas.push({
      meta: m,
      posicao: i + 1,
      mesQueComeca: mesMinimo,
      mesQueCompleta: mesEscolhido,
      mesesParaCompletar: mesEscolhido - mesMinimo,
      saldoInicial: 0,
    })
    mesMinimo = mesEscolhido + 1
  }

  return { agendadas, metasInatingiveis: inatingiveis }
}

/**
 * Retorna a trajetória do patrimônio mês a mês, com aporte mensal e
 * deduções pontuais (uma por compra da fila). Útil para gráficos.
 */
function calcTrajetoriaPatrimonio(
  patrimonio: number,
  sobraMensal: number,
  taxaMensal: number,
  meses: number,
  filaAgendada: Array<{ valor: number; mesQueCompleta: number }>,
): number[] {
  return _trajetoriaPatrimonio(
    patrimonio,
    sobraMensal,
    taxaMensal,
    filaAgendada.map((f) => ({ mes: f.mesQueCompleta, valor: f.valor })),
    meses,
  )
}

/**
 * Calcula quanto cada meta da fila atrasa o objetivo de acumulação de patrimônio.
 * Compara a trajetória do patrimônio "sem fila" vs "com fila completa" e o custo
 * marginal de cada meta (quantos meses a mais o usuário leva para atingir metaValor
 * por causa daquela compra).
 */
function calcAtrasoPatrimonioPorFila(
  patrimonio: number,
  metaValor: number,
  sobraMensal: number,
  taxaMensal: number,
  filaAgendada: Array<{ id: number; valor: number; mesQueCompleta: number }>,
): AtrasoPatrimonio {
  const semDado: AtrasoPatrimonio = {
    mesesSemFila: null,
    mesesComFila: null,
    atrasoTotal: null,
    atrasoPorMeta: filaAgendada.map((m) => ({ id: m.id, meses: null })),
  }
  if (metaValor <= 0) return semDado

  const trajSem = _trajetoriaPatrimonio(patrimonio, sobraMensal, taxaMensal, [], HORIZONTE_PATRIMONIO)
  const trajCom = _trajetoriaPatrimonio(
    patrimonio,
    sobraMensal,
    taxaMensal,
    filaAgendada.map((m) => ({ mes: m.mesQueCompleta, valor: m.valor })),
    HORIZONTE_PATRIMONIO,
  )
  const mesesSem = _primeiroMesQueAtinge(trajSem, metaValor)
  const mesesCom = _primeiroMesQueAtinge(trajCom, metaValor)
  const atrasoTotal =
    mesesSem !== null && mesesCom !== null ? mesesCom - mesesSem : null

  const atrasoPorMeta = filaAgendada.map((meta) => {
    const outras = filaAgendada.filter((m) => m.id !== meta.id)
    const trajSemI = _trajetoriaPatrimonio(
      patrimonio,
      sobraMensal,
      taxaMensal,
      outras.map((m) => ({ mes: m.mesQueCompleta, valor: m.valor })),
      HORIZONTE_PATRIMONIO,
    )
    const mesesSemI = _primeiroMesQueAtinge(trajSemI, metaValor)
    if (mesesCom === null || mesesSemI === null) return { id: meta.id, meses: null }
    return { id: meta.id, meses: mesesCom - mesesSemI }
  })

  return { mesesSemFila: mesesSem, mesesComFila: mesesCom, atrasoTotal, atrasoPorMeta }
}


function calcCronogramaMetas(
  metas: Meta[],
  sobraMensal: number,
  headStart: number,
): CronogramaResult {
  const agendadas: MetaAgendada[] = []
  const inatingiveis: Meta[] = []
  let saldoCarregado = Math.max(0, headStart)
  let mesAcumulado = 0

  for (let i = 0; i < metas.length; i++) {
    const m = metas[i]
    const valor = Math.max(0, m.valor)

    if (sobraMensal <= 0 && saldoCarregado < valor) {
      inatingiveis.push(m)
      continue
    }

    const saldoInicial = saldoCarregado
    const falta = valor - saldoCarregado

    if (falta <= 0) {
      agendadas.push({
        meta: m,
        posicao: i + 1,
        mesQueComeca: mesAcumulado,
        mesQueCompleta: mesAcumulado,
        mesesParaCompletar: 0,
        saldoInicial,
      })
      saldoCarregado = -falta
      continue
    }

    const mesesParaCompletar = Math.ceil(falta / sobraMensal)
    const mesQueCompleta = mesAcumulado + mesesParaCompletar

    if (mesQueCompleta > HORIZONTE_CRONOGRAMA) {
      inatingiveis.push(m)
      continue
    }

    const totalAcumulado = saldoCarregado + mesesParaCompletar * sobraMensal
    agendadas.push({
      meta: m,
      posicao: i + 1,
      mesQueComeca: mesAcumulado,
      mesQueCompleta,
      mesesParaCompletar,
      saldoInicial,
    })
    saldoCarregado = totalAcumulado - valor
    mesAcumulado = mesQueCompleta
  }

  return { agendadas, metasInatingiveis: inatingiveis }
}

/**
 * Formata um número de meses como "X mês(es)" ou "Y ano(s) e Z mês(es)".
 * Útil para humanizar prazos longos.
 */
function formatPrazoBR(meses: number): string {
  if (meses <= 0) return 'agora'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const anosStr = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return resto === 0 ? anosStr : `${anosStr} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`
}

function formatMesAbreviado(offset: number, ref: Date = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth() + offset, 1)
  const mes = d.toLocaleDateString('pt-BR', { month: 'short' })
  const ano = d.getFullYear()
  return `${mes}/${ano}`
}

function calcMesItemAposFila(
  itemValor: number,
  metas: Meta[],
  sobraMensal: number,
  headStart: number,
): { mes: number | null } {
  const itemVirtual: Meta = { id: -1, nome: '__item_virtual__', valor: itemValor }
  const cronograma = calcCronogramaMetas([...metas, itemVirtual], sobraMensal, headStart)
  const last = cronograma.agendadas[cronograma.agendadas.length - 1]
  if (!last || last.meta.id !== -1) return { mes: null }
  if (cronograma.metasInatingiveis.length > 0) return { mes: null }
  return { mes: last.mesQueCompleta }
}

// ===========================================================
// AVISOS EDUCATIVOS (Ciclo A)
// ===========================================================

/**
 * Regra 50/30/20: custo de vida deve ficar em até 50% da renda.
 * @returns valor a cortar para chegar a 50%, ou null se já está OK
 *          ou se renda/custo são inválidos.
 */
function calcCorte5050(custo: number, renda: number): number | null {
  if (renda <= 0 || custo <= 0) return null
  const limite = renda * 0.5
  if (custo <= limite) return null
  return custo - limite
}

// ===========================================================
// RISCO DE PATRIMÔNIO (Ciclo 0)
// Camada que rebaixa o veredito existente quando a compra
// representa risco material ao patrimônio do usuário.
// ===========================================================

export type TipoCompra = 'lazer' | 'ferramenta' | 'passivoAltoValor'

export type ChipRisco =
  | { tipo: 'pct_patrimonio'; pct: number }
  | { tipo: 'lazer_com_parcelas' }
  | { tipo: 'parcela_consome_lazer'; pct: number }
  | { tipo: 'reserva_abaixo_alvo' }
  | { tipo: 'atraso_meta'; meses: number }
  | { tipo: 'dti_alto'; pct: number }

export type TierRisco = 'verde' | 'amarelo' | 'vermelho'

export interface RiscoPatrimonio {
  tier: TierRisco
  motivos: ChipRisco[]
}

export interface CalcRiscoPatrimonioParams {
  patrimonio: number
  valorCompra: number
  tipoCompra: TipoCompra
  parcelasExistentes: number
  parcelaNova: number
  sobraLazerMensal: number
  dtiPos: number              // fração 0..1
  atrasoMetaMeses: number | null
  reservaAlvo: number
  patrimonioPosCompra: number
}

const _tierOrder: Record<TierRisco, number> = { verde: 0, amarelo: 1, vermelho: 2 }
const _tierByIndex: TierRisco[] = ['verde', 'amarelo', 'vermelho']

function _tierFaixa(pct: number, tipo: TipoCompra): TierRisco {
  if (tipo === 'lazer') {
    if (pct < 0.05) return 'verde'
    if (pct <= 0.15) return 'amarelo'
    return 'vermelho'
  }
  // ferramenta e passivoAltoValor compartilham faixa mais permissiva.
  // Para passivoAltoValor a régua final é dominada pelos gatilhos
  // (DTI, reserva, etc) que já refletem validarPassivoAltoValor.
  if (pct < 0.10) return 'verde'
  if (pct <= 0.25) return 'amarelo'
  return 'vermelho'
}

function calcRiscoPatrimonio(p: CalcRiscoPatrimonioParams): RiscoPatrimonio {
  const motivos: ChipRisco[] = []
  const patrimonioInsuficiente = p.patrimonio < p.reservaAlvo
  const pctPatrimonio = p.valorCompra / Math.max(p.patrimonio, 1)
  const tierBase = _tierFaixa(pctPatrimonio, p.tipoCompra)

  if (tierBase !== 'verde') {
    motivos.push({ tipo: 'pct_patrimonio', pct: pctPatrimonio })
  }

  // Gatilhos que apenas adicionam chip (sem rebaixar diretamente).
  // Atraso ≤ 6 meses: chip amarelo informativo.
  if (p.atrasoMetaMeses !== null && p.atrasoMetaMeses > 0 && p.atrasoMetaMeses <= 6) {
    motivos.push({ tipo: 'atraso_meta', meses: p.atrasoMetaMeses })
  }

  // Gatilhos que rebaixam 1 tier (compartilham o cap).
  let rebaixar1 = false

  if (p.parcelasExistentes > 0 && p.tipoCompra === 'lazer') {
    motivos.push({ tipo: 'lazer_com_parcelas' })
    rebaixar1 = true
  }

  if (p.sobraLazerMensal > 0 && p.parcelaNova / p.sobraLazerMensal > 0.5) {
    motivos.push({ tipo: 'parcela_consome_lazer', pct: p.parcelaNova / p.sobraLazerMensal })
    rebaixar1 = true
  }

  if (p.dtiPos > 0.30) {
    motivos.push({ tipo: 'dti_alto', pct: p.dtiPos })
    rebaixar1 = true
  }

  if (p.atrasoMetaMeses !== null && p.atrasoMetaMeses > 6 && p.atrasoMetaMeses <= 12) {
    motivos.push({ tipo: 'atraso_meta', meses: p.atrasoMetaMeses })
    rebaixar1 = true
  }

  // Gatilhos que forçam vermelho (ignoram cap).
  let forcarVermelho = false

  if (patrimonioInsuficiente) {
    forcarVermelho = true
  }

  if (p.patrimonioPosCompra < p.reservaAlvo) {
    motivos.push({ tipo: 'reserva_abaixo_alvo' })
    forcarVermelho = true
  }

  if (p.atrasoMetaMeses !== null && p.atrasoMetaMeses > 12) {
    motivos.push({ tipo: 'atraso_meta', meses: p.atrasoMetaMeses })
    forcarVermelho = true
  }

  let tierFinal: TierRisco = tierBase
  if (rebaixar1) {
    tierFinal = _tierByIndex[Math.min(_tierOrder[tierFinal] + 1, 2)]
  }
  if (forcarVermelho) {
    tierFinal = 'vermelho'
  }

  return { tier: tierFinal, motivos }
}

const _vereditoOrder: Record<Veredito['tipo'], number> = { aprovado: 0, juntar: 1, negado: 2 }
const _vereditoByIndex: Veredito['tipo'][] = ['aprovado', 'juntar', 'negado']
const _tierToVeredito: Record<TierRisco, Veredito['tipo']> = {
  verde: 'aprovado',
  amarelo: 'juntar',
  vermelho: 'negado',
}

function compoeVeredito(existente: Veredito, risco: RiscoPatrimonio): Veredito {
  const tipoFromRisco = _tierToVeredito[risco.tier]
  const indiceFinal = Math.max(_vereditoOrder[existente.tipo], _vereditoOrder[tipoFromRisco])
  const tipoFinal = _vereditoByIndex[indiceFinal]
  if (tipoFinal === existente.tipo) return existente
  return { ...existente, tipo: tipoFinal }
}

// ===========================================================
// SCORE DE SAÚDE FINANCEIRA (P1.5)
// ===========================================================

export type NivelSaude = 'boa' | 'regular' | 'atencao'

export interface FatorSaude {
  label: string
  ok: boolean
  descricao: string
  pontos: number
  maxPontos: number
}

export interface ScoreSaudeResult {
  nivel: NivelSaude
  pontuacao: number   // 0–100
  fatores: FatorSaude[]
}

/**
 * Calcula um score de saúde financeira (0–100) baseado nos dados já disponíveis.
 * Ideal para exibição no Step 2 — motiva o usuário a melhorar antes de comprar.
 */
function calcScoreSaude(
  renda: number,
  custo: number,
  patrimonio: number,
  reservaMeses: number,
  parcelasExistentes: number,
  envelopes: Envelope[],
): ScoreSaudeResult {
  const fatores: FatorSaude[] = []

  // ── 1. Reserva de emergência (40 pts) ──
  const reservaAlvo = custo * reservaMeses
  const statusRes = calcStatusReserva(patrimonio, reservaAlvo)
  const pontosReserva = statusRes === 'seguranca' ? 40 : statusRes === 'atencao' ? 20 : 0
  fatores.push({
    label: 'Reserva de emergência',
    ok: statusRes === 'seguranca',
    pontos: pontosReserva,
    maxPontos: 40,
    descricao:
      statusRes === 'seguranca'
        ? `Reserva completa (${reservaMeses} meses). Você tem segurança para imprevistos.`
        : statusRes === 'atencao'
        ? `Reserva parcial: ${patrimonio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} de ${reservaAlvo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}. Continue poupando.`
        : `Reserva abaixo de 50% da meta. Priorize isso antes de qualquer compra.`,
  })

  // ── 2. Custo de vida (25 pts) ──
  const custoPct = renda > 0 ? (custo / renda) * 100 : 100
  const pontosCusto = custoPct <= 50 ? 25 : custoPct <= 70 ? 12 : 0
  fatores.push({
    label: 'Custo de vida',
    ok: custoPct <= 50,
    pontos: pontosCusto,
    maxPontos: 25,
    descricao:
      custoPct <= 50
        ? `Custo de vida em ${custoPct.toFixed(0)}% da renda — saudável (≤ 50%).`
        : custoPct <= 70
        ? `Custo de vida em ${custoPct.toFixed(0)}% da renda — elevado (ideal: ≤ 50%).`
        : `Custo de vida em ${custoPct.toFixed(0)}% da renda — crítico. Há pouco espaço para poupar.`,
  })

  // ── 3. Sobra de lazer (20 pts) ──
  const lazerPct = calcLazerPct(renda, custo, envelopes)
  const pontosLazer = lazerPct >= 20 ? 20 : lazerPct >= 10 ? 10 : 0
  fatores.push({
    label: 'Sobra mensal',
    ok: lazerPct >= 20,
    pontos: pontosLazer,
    maxPontos: 20,
    descricao:
      lazerPct >= 20
        ? `${lazerPct.toFixed(0)}% da renda disponível para poupança e lazer.`
        : lazerPct >= 10
        ? `Sobra de ${lazerPct.toFixed(0)}% — apertado. Tente liberar mais margem.`
        : `Sobra de ${lazerPct.toFixed(0)}% — insuficiente. Sem margem para poupar ou imprevistos.`,
  })

  // ── 4. Parcelas existentes (15 pts) ──
  const parcelasPct = renda > 0 ? (parcelasExistentes / renda) * 100 : (parcelasExistentes > 0 ? 100 : 0)
  const pontosParcelas = parcelasExistentes === 0 ? 15 : parcelasPct <= 10 ? 10 : parcelasPct <= 20 ? 5 : 0
  fatores.push({
    label: 'Parcelas em andamento',
    ok: parcelasExistentes === 0,
    pontos: pontosParcelas,
    maxPontos: 15,
    descricao:
      parcelasExistentes === 0
        ? 'Sem parcelas em andamento. Excelente!'
        : parcelasPct <= 10
        ? `${parcelasExistentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}/mês em parcelas (${parcelasPct.toFixed(0)}% da renda) — controlado.`
        : `${parcelasExistentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}/mês em parcelas (${parcelasPct.toFixed(0)}% da renda) — comprometido. Evite novos parcelamentos.`,
  })

  const pontuacao = fatores.reduce((sum, f) => sum + f.pontos, 0)
  const nivel: NivelSaude = pontuacao >= 75 ? 'boa' : pontuacao >= 40 ? 'regular' : 'atencao'

  return { nivel, pontuacao, fatores }
}

// ===========================================================
// P2.8 — INFLAÇÃO DO ITEM
// ===========================================================

/**
 * Valor futuro do item após `meses` de inflação a `taxaAnual` % a.a.
 * Usa regime de juros compostos: VF = valor * (1 + taxaAnual/100)^(meses/12).
 *
 * Exemplos:
 *   calcValorFuturoItem(1000, 6, 12) → 1060 (1000 + 6% em 1 ano)
 *   calcValorFuturoItem(1000, 6, 24) → 1123.6 (compostos em 2 anos)
 *   calcValorFuturoItem(1000, 0, 24) → 1000 (sem inflação)
 *   calcValorFuturoItem(1000, 6, 0) → 1000 (zero meses)
 */
function calcValorFuturoItem(
  valor: number,
  taxaAnual: number,
  meses: number,
): number {
  if (taxaAnual <= 0 || meses <= 0) return valor
  return valor * Math.pow(1 + taxaAnual / 100, meses / 12)
}

// ===========================================================
// DEPRECIAÇÃO DE ITENS NÃO-IMÓVEIS
// ===========================================================

/**
 * Valor depreciado do item após `meses` a `taxaAnual` % a.a. (depreciação
 * anual). Regime composto inverso: VF = valor * (1 - taxaAnual/100)^(meses/12).
 *
 * Útil para carros, eletrônicos e bens em geral que perdem valor com o tempo.
 *
 * Exemplos:
 *   calcValorDepreciado(50000, 15, 12) → 42500 (carro perde 15% em 1 ano)
 *   calcValorDepreciado(50000, 15, 24) → 36125 (carro perde 27.75% em 2 anos)
 *   calcValorDepreciado(50000, 0, 24)  → 50000 (sem depreciação)
 *   calcValorDepreciado(50000, 15, 0)  → 50000 (zero meses)
 *   calcValorDepreciado(50000, 100, 12) → 0 (taxa 100% — sem valor após 1 ano)
 */
function calcValorDepreciado(
  valor: number,
  taxaAnual: number,
  meses: number,
): number {
  if (taxaAnual <= 0 || meses <= 0) return valor
  const taxaClampada = Math.min(100, Math.max(0, taxaAnual))
  return valor * Math.pow(1 - taxaClampada / 100, meses / 12)
}

export {
  calcCronogramaMetas,
  calcMesItemAposFila,
  calcAtrasoPatrimonioPorFila,
  calcCronogramaSaudavel,
  calcTrajetoriaPatrimonio,
  formatMesAbreviado,
  formatPrazoBR,
  calcCorte5050,
  calcRiscoPatrimonio,
  compoeVeredito,
  calcCustoComJuros,
  validarPassivoAltoValor,
  calcScoreSaude,
  calcImpactoMetaFinanceira,
  simularLogica,
  calcLazerPct,
  calcStatusReserva,
  calcFluxoCaixa,
  calcStatusPatrimonio,
  calcRoiAprovacao,
  selectCriterioAuto,
  CRITERIOS,
  isBigTicket,
  validarEntrada,
  calcDTI,
  calcMargemManobra,
  calcCustoOcultoVeiculo,
  validarVeiculo,
  calcNovoCustoFixoImovel,
  validarImovel,
  validarBigTicket,
  calcTempoEsperaLazer,
  isLazerBloqueado,
  isPermitidoFerramenta,
  calcCustoMensalVeiculo,
  validarCompraVeiculo,
  calcCustoEfetivoImovel,
  validarCompraImovel,
  validarEntradaMinima,
  resolverTipoCompra,
  calcProjecaoPatrimonio,
  calcImpactoCompraNoPatrimonio,
  calcMesesParaMeta,
  calcMesQueAtingeMeta,
  calcAtrasoCompra,
  calcValorFuturoItem,
  calcValorDepreciado,
}
