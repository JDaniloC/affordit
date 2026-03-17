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
    patrimonio, aporteMensal, HORIZONTE_META, itemValor, parcelas,
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
 * Retorna um array com o patrimônio ao final de cada mês (crescimento linear).
 * @param patrimonioInicial - patrimônio atual
 * @param aporteMensal - quanto é poupado/investido por mês
 * @param meses - número de meses a projetar
 */
function calcProjecaoPatrimonio(
  patrimonioInicial: number,
  aporteMensal: number,
  meses: number,
): number[] {
  const result: number[] = []
  for (let i = 1; i <= meses; i++) {
    result.push(patrimonioInicial + i * aporteMensal)
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
 */
function calcImpactoCompraNoPatrimonio(
  patrimonioInicial: number,
  aporteMensal: number,
  meses: number,
  itemValor: number,
  parcelas: number,
): { semCompra: number[]; comCompra: number[] } {
  const semCompra = calcProjecaoPatrimonio(patrimonioInicial, aporteMensal, meses)

  const parcelaValor = parcelas > 1 ? itemValor / parcelas : 0
  const patrimonioAposEntrada = parcelas === 1 ? patrimonioInicial - itemValor : patrimonioInicial

  const comCompra: number[] = []
  let acumulado = patrimonioAposEntrada
  for (let i = 1; i <= meses; i++) {
    const aporteEfetivo = i <= parcelas ? aporteMensal - parcelaValor : aporteMensal
    acumulado += aporteEfetivo
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

export {
  calcCustoComJuros,
  validarPassivoAltoValor,
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
}
