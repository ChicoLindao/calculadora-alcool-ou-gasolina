'use client'

import { useEffect, useMemo, useState } from 'react'
import { getStationHistory, saveStationHistory, deleteStationHistory, type StationHistoryItem } from './actions/stations'
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Fuel,
  Gauge,
  History,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Zap,
} from 'lucide-react'

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatNumber = (value: number, digits = 1) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

const relativeDate = (value: Date | string) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Há 1 dia'
  return `Há ${days} dias`
}

type HistoryItem = StationHistoryItem

export default function Page() {
  const [stationName, setStationName] = useState('')
  const [alcohol, setAlcohol] = useState(3.49)
  const [gasoline, setGasoline] = useState(5.29)
  const [custom, setCustom] = useState(false)
  const [alcoholKm, setAlcoholKm] = useState(7.2)
  const [gasolineKm, setGasolineKm] = useState(10.5)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [calculated, setCalculated] = useState(false)

  useEffect(() => {
    getStationHistory().then(setHistory)
  }, [])

  const result = useMemo(() => {
    const ratio = custom && gasolineKm > 0 ? alcoholKm / gasolineKm : 0.7
    const priceRatio = gasoline > 0 ? alcohol / gasoline : 0
    const alcoholCostKm = alcoholKm > 0 ? alcohol / alcoholKm : 0
    const gasolineCostKm = gasolineKm > 0 ? gasoline / gasolineKm : 0
    const difference = Math.abs(alcoholCostKm - gasolineCostKm)
    const winner = Math.abs(priceRatio - ratio) < 0.005 ? 'tie' : priceRatio < ratio ? 'alcohol' : 'gasoline'
    const cheaper = winner === 'alcohol' ? alcoholCostKm : gasolineCostKm
    const expensive = winner === 'alcohol' ? gasolineCostKm : alcoholCostKm
    return { ratio, priceRatio, alcoholCostKm, gasolineCostKm, difference, winner, savings: Math.max(0, expensive - cheaper) }
  }, [alcohol, gasoline, custom, alcoholKm, gasolineKm])

  function adjust(setter: (value: number) => void, current: number, amount: number) {
    setter(Number(Math.max(0, current + amount).toFixed(2)))
  }

  async function calculate() {
    if (stationName.trim()) {
      await saveStationHistory({ stationName, alcoholPrice: alcohol, gasolinePrice: gasoline, recommendation: result.winner })
      setHistory(await getStationHistory())
    }
    setCalculated(true)
  }

  function load(item: HistoryItem) {
    setStationName(item.stationName)
    setAlcohol(item.alcoholPrice); setGasoline(item.gasolinePrice)
    setCalculated(false)
  }

  const isAlcohol = result.winner === 'alcohol'
  const isTie = result.winner === 'tie'
  const accent = isAlcohol ? 'emerald' : isTie ? 'zinc' : 'amber'

  return (
    <main className="min-h-screen overflow-hidden bg-[#090d14] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(16,185,129,0.10),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(245,158,11,0.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8 lg:pt-12">
        <header className="mb-10 flex items-start justify-between gap-5">
          <div>
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400"><span className="grid size-7 place-items-center rounded-lg bg-emerald-400/10"><Fuel className="size-4" /></span> Fuelwise <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] tracking-widest text-zinc-500">BETA</span></div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl">Álcool ou <span className="text-amber-400">Gasolina?</span></h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">Calcule qual combustível vale mais a pena para o seu bolso em segundos.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-500 sm:flex"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /> Cálculo em tempo real</div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-card rounded-3xl p-6 sm:p-7">
            <div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Sua simulação</p><h2 className="mt-1 text-xl font-semibold">Preços na bomba</h2></div><div className="rounded-xl bg-amber-400/10 p-2.5 text-amber-400"><Gauge className="size-5" /></div></div>
            <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
              <label htmlFor="station-name" className="block text-xs text-zinc-400">Nome do Posto (Opcional)</label>
              <input id="station-name" value={stationName} onChange={(event) => setStationName(event.target.value)} placeholder="Ex.: Posto Avenida" className="mt-1 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-600" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <PriceInput label="Preço do Álcool" value={alcohol} setValue={setAlcohol} color="emerald" adjust={adjust} />
              <PriceInput label="Preço da Gasolina" value={gasoline} setValue={setGasoline} color="amber" adjust={adjust} />
            </div>
            <div className="my-6 h-px bg-white/[0.07]" />
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Personalizar consumo</p><p className="mt-1 text-xs leading-relaxed text-zinc-500">Use o rendimento real do seu carro</p></div><button aria-label="Alternar consumo personalizado" onClick={() => setCustom(!custom)} className={`relative h-7 w-12 rounded-full transition-colors ${custom ? 'bg-emerald-400' : 'bg-zinc-700'}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform ${custom ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
            {!custom && <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.05] p-3.5 text-xs leading-relaxed text-zinc-400"><CircleHelp className="mt-0.5 size-4 shrink-0 text-emerald-400" />O cálculo usa a média de que o álcool rende <strong className="text-emerald-300">70%</strong> da gasolina.</div>}
            {custom && <div className="mt-5 grid grid-cols-2 gap-3"><SmallInput label="Álcool (km/l)" value={alcoholKm} setValue={setAlcoholKm} /><SmallInput label="Gasolina (km/l)" value={gasolineKm} setValue={setGasolineKm} /></div>}
            <button onClick={calculate} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 py-3.5 text-sm font-bold text-[#07110d] shadow-[0_8px_30px_rgba(52,211,153,0.18)] transition hover:brightness-110 active:scale-[0.98]"><Sparkles className="size-4" /> Calcular vantagem <ChevronRight className="size-4" /></button>
          </div>

          <div className={`result-card relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${accent === 'emerald' ? 'border-emerald-400/20' : accent === 'amber' ? 'border-amber-400/20' : 'border-white/10'}`}>
            <div className={`absolute -right-20 -top-24 size-64 rounded-full blur-3xl ${isAlcohol ? 'bg-emerald-400/10' : 'bg-amber-400/10'}`} />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Resultado da análise</p><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Agora</span></div>
              <div className="mt-8 flex flex-col items-center gap-7 sm:flex-row sm:items-start">
                <div className={`gauge ${isAlcohol ? 'gauge-emerald' : isTie ? 'gauge-zinc' : 'gauge-amber'}`}><div className="gauge-inner"><span className="text-3xl font-semibold tracking-tight">{formatNumber(result.priceRatio * 100, 1)}%</span><span className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">do preço</span></div></div>
                <div className="flex-1 text-center sm:text-left"><div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${isAlcohol ? 'bg-emerald-400/10 text-emerald-300' : isTie ? 'bg-white/10 text-zinc-300' : 'bg-amber-400/10 text-amber-300'}`}>{isAlcohol ? <TrendingDown className="size-3.5" /> : isTie ? <Check className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}{isAlcohol ? 'Melhor escolha' : isTie ? 'Empate técnico' : 'Melhor escolha'}</div><h2 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">{isAlcohol ? 'Abasteça com álcool!' : isTie ? 'Tanto faz!' : 'Abasteça com gasolina!'}</h2><p className="mt-3 text-sm leading-relaxed text-zinc-400">O álcool está custando <strong className={isAlcohol ? 'text-emerald-300' : 'text-amber-300'}>{formatNumber(result.priceRatio * 100, 1)}%</strong> do preço da gasolina. {isAlcohol ? 'Abaixo do limite de 70%, ele é a melhor escolha.' : isTie ? 'Os preços estão praticamente equivalentes.' : 'Acima do limite de 70%, a gasolina é a melhor escolha.'}</p></div>
              </div>
              <div className="mt-auto grid gap-3 pt-9 sm:grid-cols-2"><Metric label="Economia estimada" value={result.winner === 'tie' ? '—' : `~${formatBRL(result.savings)} / km`} icon={<TrendingDown className="size-4" />} tone={isAlcohol ? 'emerald' : 'amber'} /><Metric label="Com R$ 100, você roda mais com" value={isAlcohol ? 'Álcool' : isTie ? 'Qualquer um' : 'Gasolina'} icon={<Zap className="size-4" />} tone={isAlcohol ? 'emerald' : 'amber'} /></div>
              {calculated && <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400"><Check className="size-3.5" /> Simulação salva no seu histórico</div>}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card rounded-3xl p-6"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-white/[0.06] p-2.5 text-zinc-400"><History className="size-4" /></div><div><h2 className="font-semibold">Histórico rápido</h2><p className="text-xs text-zinc-500">Suas últimas simulações</p></div></div>{history.length > 0 && <button onClick={async () => { await deleteStationHistory(); setHistory([]) }} className="text-xs text-zinc-500 transition hover:text-white">Limpar</button>}</div>{history.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 py-7 text-center text-xs text-zinc-600">Suas simulações aparecerão aqui</div> : <div className="grid gap-2 sm:grid-cols-2">{history.map((item) => <button key={item.id} onClick={() => load(item)} className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5 text-left transition hover:border-emerald-400/30 hover:bg-white/[0.05]"><div className="flex items-center gap-3"><div className={`size-2 rounded-full ${item.alcoholPrice / item.gasolinePrice < 0.7 ? 'bg-emerald-400' : 'bg-amber-400'}`} /><div><p className="text-sm font-semibold text-white">{item.stationName}</p><p className="mt-1 text-xs text-zinc-400">Álcool {formatBRL(item.alcoholPrice)} <span className="text-zinc-600">·</span> Gasolina {formatBRL(item.gasolinePrice)}</p><p className="mt-1 text-[10px] text-zinc-600">{relativeDate(item.updatedAt)}</p></div></div><RotateCcw className="size-3.5 text-zinc-600 transition group-hover:text-emerald-400" /></button>)}</div>}</div>
          <div className="glass-card rounded-3xl p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-amber-400/10 p-2.5 text-amber-400"><CircleHelp className="size-4" /></div><div><h2 className="font-semibold">A regra dos 70%</h2><p className="mt-3 text-sm leading-relaxed text-zinc-400">Em média, um carro abastecido com álcool percorre 70% da distância que percorreria com gasolina. Por isso, compare o preço do álcool com 70% do preço da gasolina.</p><div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-xs text-zinc-300"><span className="font-semibold text-amber-300">Álcool ÷ Gasolina</span><span className="text-zinc-600">&lt;</span><span className="font-semibold text-emerald-300">70%</span><ArrowDownRight className="ml-auto size-4 text-emerald-400" /></div></div></div></div>
        </section>
        <footer className="mt-8 flex items-center justify-between text-[11px] text-zinc-600"><span>Feito para decisões mais inteligentes na estrada.</span><span>Valores por litro · BR</span></footer>
      </div>
    </main>
  )
}

function PriceInput({ label, value, setValue, color, adjust }: { label: string; value: number; setValue: (value: number) => void; color: 'emerald' | 'amber'; adjust: (setter: (value: number) => void, current: number, amount: number) => void }) {
  return <div className={`rounded-2xl border bg-white/[0.025] p-3 transition focus-within:border-${color}-400/40`}><div className="mb-2 flex items-center justify-between"><label className="text-xs text-zinc-400">{label}</label><span className={`size-2 rounded-full ${color === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`} /></div><div className="flex items-center gap-2"><button aria-label={`Diminuir ${label}`} onClick={() => adjust(setValue, value, -0.01)} className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-zinc-500 transition hover:bg-white/10 hover:text-white"><Minus className="size-3.5" /></button><div className="flex flex-1 items-center"><span className="mr-1 text-sm text-zinc-500">R$</span><input aria-label={label} type="number" step="0.01" value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full bg-transparent text-2xl font-semibold tracking-tight text-white outline-none" /></div><button aria-label={`Aumentar ${label}`} onClick={() => adjust(setValue, value, 0.01)} className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-zinc-500 transition hover:bg-white/10 hover:text-white"><Plus className="size-3.5" /></button></div></div>
}
function SmallInput({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) { return <label className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5"><span className="block text-[10px] text-zinc-500">{label}</span><input type="number" step="0.1" value={value} onChange={(e) => setValue(Number(e.target.value))} className="mt-1 w-full bg-transparent text-sm font-semibold text-white outline-none" /></label> }
function Metric({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'emerald' | 'amber' }) { return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"><div className={`mb-2 flex items-center gap-2 text-xs ${tone === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>{icon}{label}</div><p className="text-sm font-semibold text-zinc-200">{value}</p></div> }
