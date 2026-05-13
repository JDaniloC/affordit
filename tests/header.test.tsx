import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header, { type AlertasHeader } from '../src/components/Header'

type HeaderProps = Parameters<typeof Header>[0]

const propsBase = (over: Partial<HeaderProps> = {}): HeaderProps => ({
  routeAtual: 'inicio',
  onNavigate: vi.fn(),
  perfil: {
    renda: 5_000,
    patrimonio: 30_000,
    sobraLazerMensal: 1_000,
    scorePontuacao: 75,
  },
  alertas: {
    statusReserva: 'seguranca',
    statusSobra: 'ok',
    nivelScore: 'boa',
    reservaAlvo: 18_000,
  } as AlertasHeader,
  ...over,
})

describe('Header — alertas visuais nos chips', () => {
  it('sem alertas: chips não recebem classes de zona ruim', () => {
    const { container } = render(<Header {...propsBase()} />)
    expect(container.querySelector('.chip-alerta-critico')).toBeNull()
    expect(container.querySelector('.chip-alerta-atencao')).toBeNull()
    expect(container.querySelector('.chip-score-boa')).toBeTruthy()
  })

  it('reserva em perigo: chip Patrim. recebe classe crítica', () => {
    const { container } = render(
      <Header
        {...propsBase({
          alertas: {
            statusReserva: 'perigo',
            statusSobra: 'ok',
            nivelScore: 'boa',
            reservaAlvo: 18_000,
          },
          perfil: {
            renda: 5_000,
            patrimonio: 5_000,
            sobraLazerMensal: 1_000,
            scorePontuacao: 75,
          },
        })}
      />,
    )
    const critico = container.querySelectorAll('.chip-alerta-critico')
    expect(critico.length).toBe(1)
    expect(critico[0].textContent).toContain('Patrim.')
    expect(critico[0].getAttribute('title')).toMatch(/Reserva crítica/i)
  })

  it('reserva em atenção: chip Patrim. recebe classe amarela', () => {
    const { container } = render(
      <Header
        {...propsBase({
          alertas: {
            statusReserva: 'atencao',
            statusSobra: 'ok',
            nivelScore: 'boa',
            reservaAlvo: 18_000,
          },
        })}
      />,
    )
    const atencao = container.querySelectorAll('.chip-alerta-atencao')
    expect(atencao.length).toBe(1)
    expect(atencao[0].textContent).toContain('Patrim.')
    expect(atencao[0].getAttribute('title')).toMatch(/Reserva incompleta/i)
  })

  it('sobra crítica: chip Sobra recebe classe crítica', () => {
    const { container } = render(
      <Header
        {...propsBase({
          alertas: {
            statusReserva: 'seguranca',
            statusSobra: 'critico',
            nivelScore: 'atencao',
            reservaAlvo: 0,
          },
        })}
      />,
    )
    const critico = container.querySelector('.chip-alerta-critico')
    expect(critico?.textContent).toContain('Sobra')
    expect(critico?.getAttribute('title')).toMatch(/insuficiente/i)
  })

  it('score atenção: chip score recebe classe atencao', () => {
    const { container } = render(
      <Header
        {...propsBase({
          alertas: {
            statusReserva: 'seguranca',
            statusSobra: 'ok',
            nivelScore: 'atencao',
            reservaAlvo: 0,
          },
        })}
      />,
    )
    expect(container.querySelector('.chip-score.chip-score-atencao')).toBeTruthy()
    expect(container.querySelector('.chip-score-boa')).toBeNull()
  })

  it('score regular: chip score recebe classe regular', () => {
    const { container } = render(
      <Header
        {...propsBase({
          alertas: {
            statusReserva: 'seguranca',
            statusSobra: 'ok',
            nivelScore: 'regular',
            reservaAlvo: 0,
          },
        })}
      />,
    )
    expect(container.querySelector('.chip-score.chip-score-regular')).toBeTruthy()
  })

  it('múltiplos alertas: todos os chips relevantes recebem classes', () => {
    const { container } = render(
      <Header
        {...propsBase({
          alertas: {
            statusReserva: 'perigo',
            statusSobra: 'critico',
            nivelScore: 'atencao',
            reservaAlvo: 30_000,
          },
        })}
      />,
    )
    expect(container.querySelectorAll('.chip-alerta-critico').length).toBe(2)
    expect(container.querySelector('.chip-score-atencao')).toBeTruthy()
  })

  it('renderiza valor das chips (smoke)', () => {
    render(<Header {...propsBase()} />)
    expect(screen.getByText('Renda')).toBeInTheDocument()
    expect(screen.getByText('Patrim.')).toBeInTheDocument()
    expect(screen.getByText('Sobra')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
  })
})
