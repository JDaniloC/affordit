import React, { useEffect, useState } from 'react'
import { useHashRoute } from '../hooks/useHashRoute'
import { AppState, Cenario, Meta } from '../types'
import Header from './Header'
import InicioPage from '../pages/InicioPage'
import PerfilPage from '../pages/PerfilPage'
import CenariosPage from '../pages/CenariosPage'
import CompararPage from '../pages/CompararPage'
import MetasPage from '../pages/MetasPage'
import { ScoreSaudeResult } from '../logic/index'
import { encodeShareUrl } from '../state/share'

interface Props {
  state: AppState
  cenario: Cenario | null
  setPerfil: (patch: Partial<AppState['perfil']>) => void
  setCenario: (patch: Partial<Cenario>) => void
  setMetas: (next: Meta[]) => void
  setEnvelopes: React.Dispatch<React.SetStateAction<AppState['perfil']['envelopes']>>
  scoreSaude: ScoreSaudeResult
  sobraLazerMensal: number
  rendimentoMensalEfetivo: number
  setCenarioAtivoId: (id: string) => void
  criarCenarioVazio: () => void
  duplicarCenarioAtivo: () => void
  excluirCenario: (id: string) => void
  onAdicionarItemAFila: () => void
  onAbrirMetas: () => void
  onSimularMeta: (m: Meta) => void
  onRefazerSetup: () => void
  vindoDeCompartilhamento: boolean
  onDispensarBannerCompartilhamento: () => void
}

export default function AppShell(props: Props) {
  const { route, navigate } = useHashRoute()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [statusCompartilhar, setStatusCompartilhar] = useState<
    'idle' | 'copiado' | 'erro'
  >('idle')

  async function compartilhar() {
    const url = encodeShareUrl(props.state)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        setStatusCompartilhar('copiado')
      } else {
        // Fallback para navegadores sem Clipboard API
        window.prompt('Copie este link para compartilhar sua simulação:', url)
        setStatusCompartilhar('copiado')
      }
    } catch {
      setStatusCompartilhar('erro')
    }
    setTimeout(() => setStatusCompartilhar('idle'), 3000)
  }

  // Fecha sidebar automaticamente ao trocar de rota
  useEffect(() => {
    setSidebarAberta(false)
  }, [route.path])

  // Reconcilia cenarioAtivoId quando URL traz ?id=X em #/cenarios
  useEffect(() => {
    if (route.path !== 'cenarios') return
    const id = route.params.id
    if (!id) return
    if (id === props.state.cenarioAtivoId) return
    if (props.state.cenarios.some(c => c.id === id)) {
      props.setCenarioAtivoId(id)
    }
  }, [route, props.state.cenarios, props.state.cenarioAtivoId])

  return (
    <div id="app" className="app-shell">
      <Header
        routeAtual={route.path}
        onNavigate={navigate}
        perfil={{
          renda: props.state.perfil.renda,
          patrimonio: props.state.perfil.patrimonio,
          sobraLazerMensal: props.sobraLazerMensal,
          scorePontuacao: props.scoreSaude.pontuacao,
        }}
        mostrarHamburger={route.path === 'cenarios'}
        onToggleSidebar={() => setSidebarAberta(v => !v)}
      />

      {props.vindoDeCompartilhamento && (
        <div className="banner-compartilhamento" role="status">
          <span>
            🔗 Você abriu uma simulação compartilhada. Mudanças que você fizer agora
            sobrescrevem sua simulação local.
          </span>
          <button
            type="button"
            className="banner-compartilhamento-fechar"
            onClick={props.onDispensarBannerCompartilhamento}
            aria-label="Dispensar aviso"
          >
            ×
          </button>
        </div>
      )}

      <main className="app-shell-main">
        {route.path === 'inicio' && (
          <InicioPage
            perfil={props.state.perfil}
            cenario={props.cenario}
            metas={props.state.metas}
            onPerfilChange={props.setPerfil}
            onCenarioChange={props.setCenario}
            onAdicionarItemAFila={props.onAdicionarItemAFila}
            onAbrirPlanejador={() => navigate('metas')}
            onAbrirShell={() => navigate('cenarios')}
          />
        )}

        {route.path === 'perfil' && (
          <PerfilPage
            renda={props.state.perfil.renda}
            onRendaChange={v => props.setPerfil({ renda: v })}
            custo={props.state.perfil.custo}
            onCustoChange={v => props.setPerfil({ custo: v })}
            envelopes={props.state.perfil.envelopes}
            onEnvelopesChange={props.setEnvelopes}
            compromissos={props.state.perfil.compromissos}
            onCompromissosChange={(next) => props.setPerfil({ compromissos: next })}
            patrimonio={props.state.perfil.patrimonio}
            onPatrimonioChange={v => props.setPerfil({ patrimonio: v })}
            reservaMeses={props.state.perfil.reservaMeses}
            onReservaMesesChange={v => props.setPerfil({ reservaMeses: v })}
            metaValor={props.state.perfil.metaValor}
            onMetaValorChange={v => props.setPerfil({ metaValor: v })}
            rendimentoAnual={props.state.perfil.rendimentoAnual}
            onRendimentoAnualChange={v => props.setPerfil({ rendimentoAnual: v })}
            scoreSaude={props.scoreSaude}
            onRefazerSetup={props.onRefazerSetup}
          />
        )}

        {route.path === 'cenarios' && (
          <CenariosPage
            perfil={props.state.perfil}
            cenario={props.cenario}
            cenarios={props.state.cenarios}
            cenarioAtivoId={props.state.cenarioAtivoId}
            metas={props.state.metas}
            onCenarioChange={props.setCenario}
            onSelecionarCenario={(id) => navigate('cenarios', { id })}
            onCriarVazio={props.criarCenarioVazio}
            onDuplicar={props.duplicarCenarioAtivo}
            onExcluir={props.excluirCenario}
            onAdicionarItemAFila={props.onAdicionarItemAFila}
            onAbrirPlanejador={() => navigate('metas')}
            sidebarAberta={sidebarAberta}
            onFecharSidebar={() => setSidebarAberta(false)}
          />
        )}

        {route.path === 'comparar' && (
          <CompararPage perfil={props.state.perfil} cenarios={props.state.cenarios} />
        )}

        {route.path === 'metas' && (
          <MetasPage
            perfil={props.state.perfil}
            metas={props.state.metas}
            onMetasChange={props.setMetas}
            rendimentoMensalEfetivo={props.rendimentoMensalEfetivo}
            sobraLazerMensal={props.sobraLazerMensal}
            onNavegarParaCenario={props.onSimularMeta}
            onVoltarParaCenarios={() => navigate('cenarios')}
          />
        )}
      </main>

      <footer className="app-shell-footer">
        <p>Seus dados são salvos localmente no seu navegador. Nenhuma informação é enviada.</p>
        <div className="footer-actions">
          <button
            type="button"
            className="btn-compartilhar"
            onClick={compartilhar}
            aria-label="Compartilhar simulação via link"
          >
            🔗 Compartilhar simulação
          </button>
          {statusCompartilhar === 'copiado' && (
            <span className="footer-feedback ok">Link copiado para a área de transferência!</span>
          )}
          {statusCompartilhar === 'erro' && (
            <span className="footer-feedback erro">Não foi possível copiar — tente novamente.</span>
          )}
        </div>
      </footer>
    </div>
  )
}
