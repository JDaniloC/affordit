export const fmt = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function fmtMeses(meses: number): string {
  if (meses === 0) return 'agora mesmo'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const anosStr = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  return resto === 0 ? anosStr : `${anosStr} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`
}
