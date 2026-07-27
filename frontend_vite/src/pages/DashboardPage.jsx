import React, { useEffect, useState, useRef, useMemo } from "react";
import { useApp } from "../contexts/AppContext";
import { api } from "../contexts/AppContext";
import AppShell from "../components/AppShell";
import {
  User, Target, Briefcase, Layers, DollarSign, BookOpen, HeartPulse,
  Users, Lightbulb, Share2, Clock, TrendingUp, Mic, Bell, Calendar, Settings,
  ChevronRight, Trophy, Zap, Brain, Activity, Sun
} from "lucide-react";

const MOCK_DATA = {
  life_areas: [
    { key: "voce", icon: "user", pt: "Você", en: "You", sub_pt: "Autoconhecimento & Crescimento", sub_en: "Self-knowledge & Growth", color: "#00D4FF" },
    { key: "metas", icon: "target", pt: "Metas", en: "Goals", sub_pt: "Planejar, Acompanhar & Alcançar", sub_en: "Plan, Track & Achieve", color: "#FF8C42" },
    { key: "carreira", icon: "briefcase", pt: "Carreira", en: "Career", sub_pt: "Crescimento & Oportunidades", sub_en: "Growth & Opportunities", color: "#FF4757" },
    { key: "projetos", icon: "layers", pt: "Projetos", en: "Projects", sub_pt: "Construir & Gerenciar", sub_en: "Build & Manage", color: "#00E676" },
    { key: "financas", icon: "dollar-sign", pt: "Finanças", en: "Finance", sub_pt: "Riqueza & Estabilidade", sub_en: "Wealth & Stability", color: "#FFD700" },
    { key: "aprendizado", icon: "book-open", pt: "Aprendizado", en: "Learning", sub_pt: "Conhecimento & Habilidades", sub_en: "Knowledge & Skills", color: "#9C27B0" },
    { key: "saude", icon: "heart-pulse", pt: "Saúde", en: "Health", sub_pt: "Bem-estar & Fitness", sub_en: "Wellness & Fitness", color: "#00BCD4" },
  ],
  metrics: [
    { key: "energy", icon: "zap", label_pt: "Energia", label_en: "Energy", value: 87, delta: 12 },
    { key: "focus", icon: "target", label_pt: "Foco", label_en: "Focus", value: 73, delta: 5 },
    { key: "mood", icon: "sun", label_pt: "Humor", label_en: "Mood", value: 91, delta: 8 },
    { key: "growth", icon: "trending-up", label_pt: "Crescimento", label_en: "Growth", value: 68, delta: 15 },
  ],
  ai_models_breakdown: [
    { name: "GPT-5.6 Luna", icon: "G5", score: 94 },
    { name: "Claude 4 Opus", icon: "C4", score: 91 },
    { name: "Gemini 2 Pro", icon: "G2", score: 87 },
    { name: "DeepSeek V4", icon: "D4", score: 85 },
    { name: "Llama 4", icon: "L4", score: 82 },
  ],
  top_recommendation: {
    title_pt: "Revisar metas do Q3", title_en: "Review Q3 Goals",
    desc_pt: "Alinhamento trimestral de objetivos com progresso atual",
    desc_en: "Quarterly alignment of objectives with current progress",
    consensus: 94,
  },
  next_best_action: {
    title_pt: "Planejar Sprint Semanal", title_en: "Plan Weekly Sprint",
    desc_pt: "Organizar tarefas da semana com base nas prioridades atuais",
    desc_en: "Organize weekly tasks based on current priorities",
    impact: 92,
  },
  quote: { pt: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.", en: "The future belongs to those who believe in the beauty of their dreams." },
};

const ICON_MAP = {
  user: User, target: Target, briefcase: Briefcase, layers: Layers,
  "dollar-sign": DollarSign, "book-open": BookOpen, "heart-pulse": HeartPulse,
  users: Users, lightbulb: Lightbulb, "share-2": Share2, clock: Clock,
  "trending-up": TrendingUp, zap: Zap, sun: Sun,
};

function LifeBalanceDonut({ value = 75 }) {
  const R = 26, C = 2 * Math.PI * R;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={R} stroke="#1a2340" strokeWidth="8" fill="none" />
        <circle cx="35" cy="35" r={R} stroke="url(#dg)" strokeWidth="8" fill="none"
          strokeDasharray={`${(value / 100) * C} ${C}`} strokeDashoffset={C / 4}
          strokeLinecap="round" transform="rotate(-90 35 35)" />
        <defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D4FF" /><stop offset="100%" stopColor="#FF8C42" />
        </linearGradient></defs>
      </svg>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{value}%</div>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Balanced</div>
      </div>
    </div>
  );
}

function SimpleBrainGraph({ areas }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px', position: 'relative', overflow: 'hidden', borderRadius: '12px', background: 'linear-gradient(135deg, #0A0E27 0%, #0F1729 50%, #0A0E27 100%)' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F1729', border: '2px solid #00D4FF', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
          <Brain color="#00D4FF" size={32} />
        </div>
      </div>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
        {areas.map((area, i) => {
          const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2;
          const rPct = 32;
          const x2 = 50 + Math.cos(angle) * rPct;
          const y2 = 50 + Math.sin(angle) * rPct;
          return <line key={i} x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`} stroke={area.color} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />;
        })}
      </svg>
      {areas.map((area, i) => {
        const angle = (i / areas.length) * 2 * Math.PI - Math.PI / 2;
        const rPct = 32;
        const x = 50 + Math.cos(angle) * rPct;
        const y = 50 + Math.sin(angle) * rPct;
        const Icon = ICON_MAP[area.icon] || User;
        const hov = hovered === area.key;
        return (
          <div key={area.key}
            onMouseEnter={() => setHovered(area.key)}
            onMouseLeave={() => setHovered(null)}
            style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) scale(${hov ? 1.15 : 1})`, zIndex: 20, cursor: 'pointer', transition: 'all 0.3s' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid', borderColor: hov ? area.color : `${area.color}60`, background: `${area.color}20`, boxShadow: hov ? `0 0 16px ${area.color}60` : 'none', transition: 'all 0.3s' }}>
              <Icon size={16} color={area.color} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '4px', opacity: hov ? 1 : 0.7, transition: 'all 0.3s' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{area.pt || area.en}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user, t, lang } = useApp();
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/overview")
      .then(({ data: apiData }) => setData(apiData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const h = new Date().getHours();
  const greet = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const S = { // style helpers
    page: { minHeight: '100vh', background: '#0A0E27', color: '#fff' },
    container: { padding: '16px' },
    header: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' },
    card: { borderRadius: '12px', border: '1px solid rgba(0,212,255,0.2)', background: '#0F1729', padding: '12px' },
    grid3col: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' },
    col2: { gridColumn: 'span 2' },
    col7: { gridColumn: 'span 7' },
    col3: { gridColumn: 'span 3' },
    flexCenter: { display: 'flex', alignItems: 'center' },
    textXs: { fontSize: '12px', color: '#94a3b8' },
    textSm: { fontSize: '14px' },
    label: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' },
    btnOutline: { color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '999px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', marginTop: '10px' },
    metricCard: { borderRadius: '8px', border: '1px solid rgba(0,212,255,0.15)', background: '#131a30', padding: '10px' },
    activeItem: { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' },
    item: { border: '1px solid transparent', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' },
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0E27' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Brain color="#00D4FF" size={40} style={{ animation: 'pulse 1.5s infinite' }} />
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Carregando Hub3...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={S.page} data-testid="dashboard-page">
        <div style={{ padding: '16px 20px' }}>
          {/* Header */}
          <div style={S.header}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {greet}, {user?.name?.split(' ')[0] || 'Admin'} <span>👋</span>
              </h1>
              <div style={S.textXs}>{dateStr} · {timeStr}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Ei Hub */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', borderRadius: '999px', border: '1px solid rgba(0,212,255,0.4)', background: '#0F1729', boxShadow: '0 0 16px rgba(0,212,255,0.15)' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '20px' }}>
                  {[6,12,18,22,16,10,8].map((hgt,i) => (
                    <div key={i} style={{ width: '3px', borderRadius: '2px', background: '#00D4FF', height: `${hgt}px`, animation: 'waveAnim 0.8s ease-in-out infinite', animationDelay: `${i*0.1}s` }} />
                  ))}
                </div>
                <Mic color="#00D4FF" size={16} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Ei Hub</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>Toque ou fale para ativar</div>
                </div>
              </div>
              {[Bell, Calendar, Settings].map((Icon, i) => (
                <button key={i} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <Icon size={15} />
                </button>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(100,116,139,0.3)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #00D4FF, #FF8C42)' }}>
                  {(user?.name || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{user?.name || 'Admin'}</div>
                  <div style={{ fontSize: '10px', color: '#00D4FF' }}>Premium</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Grid */}
          <div style={S.grid3col}>
            {/* Column 1: Life Areas */}
            <div style={{ ...S.card, ...S.col2 }}>
              <div>
                {data.life_areas.map((a, i) => {
                  const Icon = ICON_MAP[a.icon] || User;
                  const active = i === 0;
                  return (
                    <div key={a.key} style={active ? S.activeItem : S.item}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${a.color}18`, border: `1px solid ${a.color}55` }}>
                        <Icon size={14} color={a.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'pt' ? a.pt : a.en}</div>
                        <div style={{ fontSize: '9px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'pt' ? a.sub_pt : a.sub_en}</div>
                      </div>
                      {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D4FF', flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...S.label, marginBottom: '8px' }}>
                  Life Balance <ChevronRight size={11} />
                </div>
                <LifeBalanceDonut value={75} />
              </div>
            </div>

            {/* Column 2: Brain Network */}
            <div style={{ ...S.card, ...S.col7, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain color="#00D4FF" size={17} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#00D4FF' }}>AI Brain Network</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Real-time analysis across your life areas</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676', fontSize: '9px', fontWeight: 700 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s infinite' }} /> LIVE
                </div>
              </div>
              <div style={{ flex: 1, minHeight: '300px' }}>
                <SimpleBrainGraph areas={data.life_areas} />
              </div>
              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px' }}>
                {data.metrics.map((m) => {
                  const Icon = ICON_MAP[m.icon] || Activity;
                  return (
                    <div key={m.key} style={S.metricCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,140,66,0.15)', border: '1px solid rgba(255,140,66,0.4)' }}>
                          <Icon size={11} color="#FF8C42" />
                        </div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>{lang === 'pt' ? m.label_pt : m.label_en}</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff' }}>{m.value}</div>
                      <div style={{ fontSize: '10px', color: '#00E676', marginTop: '2px' }}>↑ {m.delta}% vs ontem</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: AI Consensus */}
            <div style={{ ...S.col3, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain color="#00D4FF" size={16} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>AI Consensus</span>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#00D4FF', padding: '2px 8px', borderRadius: '999px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}>
                    {data.ai_models_breakdown?.length || 5} MODELS
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Multi-AI perspective on your priorities</div>

                {/* Top Recommendation */}
                <div style={{ borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid rgba(255,140,66,0.3)', background: 'rgba(255,140,66,0.05)' }}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#FF8C42', marginBottom: '4px', fontWeight: 700 }}>TOP RECOMMENDATION</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Trophy color="#FF8C42" size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lang === 'pt' ? data.top_recommendation?.title_pt : data.top_recommendation?.title_en}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lang === 'pt' ? data.top_recommendation?.desc_pt : data.top_recommendation?.desc_en}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#FF8C42' }}>{data.top_recommendation?.consensus}%</div>
                      <div style={{ fontSize: '8px', color: '#64748b' }}>Consensus</div>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '6px', fontWeight: 700 }}>AI MODEL BREAKDOWN</div>
                <div>
                  {(data.ai_models_breakdown || []).slice(0, 5).map((m) => (
                    <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, flexShrink: 0, background: '#1a2340', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>{m.icon}</div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '80px', color: '#cbd5e1' }}>{m.name}</div>
                      <div style={{ flex: 1, height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#1a2340' }}>
                        <div style={{ height: '100%', borderRadius: '3px', width: `${m.score}%`, background: m.score >= 90 ? 'linear-gradient(90deg, #00D4FF, #00E676)' : m.score >= 80 ? 'linear-gradient(90deg, #00D4FF, #FF8C42)' : 'linear-gradient(90deg, #FF8C42, #FF4757)' }} />
                      </div>
                      <div style={{ width: '28px', textAlign: 'right', fontWeight: 600, color: '#fff' }}>{m.score}%</div>
                    </div>
                  ))}
                </div>
                <button style={S.btnOutline}>View Full Analysis <ChevronRight size={12} /></button>
              </div>

              {/* Next Best Action */}
              <div style={S.card}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#FF8C42', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} /> NEXT BEST ACTION
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lang === 'pt' ? data.next_best_action?.title_pt : data.next_best_action?.title_en}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lang === 'pt' ? data.next_best_action?.desc_pt : data.next_best_action?.desc_en}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#00D4FF' }}>{data.next_best_action?.impact}%</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>Impact Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingTop: '8px', marginTop: '16px', borderTop: '1px solid rgba(0,212,255,0.1)' }}>
            <div style={{ fontStyle: 'italic', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lang === 'pt' ? data.quote?.pt : data.quote?.en}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00D4FF', flexShrink: 0 }}>
              <Brain size={12} />
              <span>Hub3 is continuously learning</span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes waveAnim {
            0%, 100% { height: 6px; }
            50% { height: 22px; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
