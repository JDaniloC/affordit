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
 */
function simularLogica(p: SimularParams): SimularResult {
  const reservaAlvo = p.custo * p.reservaMeses
  const lazerPct = calcLazerPct(p.renda, p.custo, p.envelopes)
  const sobraLazerMensal = (lazerPct / 100) * p.renda
  const statusReserva = calcStatusReserva(p.patrimonio, reservaAlvo)

  const debug: SimularDebug = { reservaAlvo, lazerPct, sobraLazerMensal, statusReserva }

  let veredito: Veredito
  let acoes: string[]

  if (statusReserva === 'seguranca' && sobraLazerMensal >= p.itemValor) {
    // Caso C: Compra Livre
    veredito = { tipo: 'aprovado', titulo: 'Compra Livre' }
    acoes = [
      `Balde de lazer: R$ ${sobraLazerMensal.toFixed(2)}/mês.`,
      `Item (R$ ${p.itemValor.toFixed(2)}) cabe em um único mês.`,
      'Compra à vista sem impacto estrutural.',
    ]
  } else if (p.ferramenta && statusReserva === 'perigo') {
    // Caso A: Alavancagem Profissional
    veredito = { tipo: 'aprovado', titulo: 'Aprovado via Alavancagem' }
    acoes = [
      `Reserva em perigo, mas item tem potencial de ROI.`,
      `Sobra de lazer: R$ ${sobraLazerMensal.toFixed(2)}/mês.`,
      'Use a sobra + crédito/parcelamento.',
    ]
  } else if (statusReserva === 'perigo' && !p.ferramenta) {
    // Caso B: Negado
    const meses = sobraLazerMensal > 0 ? Math.ceil(p.itemValor / sobraLazerMensal) : null
    veredito = { tipo: 'negado', titulo: 'Negado' }
    acoes = [
      `Reserva alvo: R$ ${reservaAlvo.toFixed(2)}. Patrimônio: R$ ${p.patrimonio.toFixed(2)}.`,
      'Menos de 50% da reserva formada.',
      meses
        ? `Aguarde ${meses} mês(es) juntando R$ ${sobraLazerMensal.toFixed(2)}/mês do lazer.`
        : 'Não há sobra de lazer. Revise seus envelopes.',
    ]
  } else if (statusReserva === 'atencao') {
    const meses = sobraLazerMensal > 0 ? Math.ceil(p.itemValor / sobraLazerMensal) : null
    veredito = { tipo: 'juntar', titulo: 'Juntar Primeiro' }
    acoes = [
      `Faltam R$ ${(reservaAlvo - p.patrimonio).toFixed(2)} para completar a reserva.`,
      meses
        ? `Junte o item em ${meses} mês(es) com o lazer (R$ ${sobraLazerMensal.toFixed(2)}/mês).`
        : 'Revise seus envelopes para liberar sobra de lazer.',
    ]
  } else {
    // statusReserva === 'seguranca', mas sobraLazerMensal < itemValor
    const meses = sobraLazerMensal > 0 ? Math.ceil(p.itemValor / sobraLazerMensal) : null
    veredito = { tipo: 'juntar', titulo: 'Juntar com Calma' }
    acoes = [
      `Reserva completa: R$ ${p.patrimonio.toFixed(2)} / R$ ${reservaAlvo.toFixed(2)}.`,
      meses
        ? `Direcione R$ ${sobraLazerMensal.toFixed(2)}/mês do lazer por ${meses} mês(es).`
        : 'Configure seus envelopes para liberar sobra de lazer.',
    ]
  }

  return { veredito, acoes, debug }
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
  simularLogica,
  calcLazerPct,
  calcStatusReserva,
  calcFluxoCaixa,
  calcStatusPatrimonio,
  calcRoiAprovacao,
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
