'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient, type AnalysisResult } from '@/lib/api';

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        const stored = sessionStorage.getItem('upstart_analysis');
        if (!stored) { router.push('/ideas'); return; }
        setAnalysis(JSON.parse(stored));
    }, [user]);

    const handleSave = async () => {
        if (!analysis || saving || saved) return;
        setSaving(true);
        try { await apiClient.saveIdea(analysis.ideaSessionId); setSaved(true); } catch (e) { }
        setSaving(false);
    };

    if (!analysis) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="loading-spinner" />
        </div>
    );

    const { selectedIdea: idea, blueprint: bp } = analysis;
    const feasScore = bp?.scores?.compositeScore ?? bp?.feasibilityScore ?? 0;
    const feasColor = feasScore >= 70 ? 'var(--color-emerald)' : feasScore >= 50 ? 'var(--color-primary)' : 'var(--color-rose)';
    const renderBullets = (text: string) => text?.split('\n').map((line, i) => (
        <p key={i} style={{ fontSize: '0.92rem', fontWeight: line.startsWith('•') ? 600 : 700, color: 'var(--color-text-1)', lineHeight: 1.7, marginBottom: '4px' }}></p>
    ));
    // Reusable Components matching the theme
    const Card = ({ children, style = {}, className = '' }: any) => (
        <div className={`section-card hover-pop-card animate-brutal-bounce ${className}`} style={{
            boxShadow: '8px 8px 0px 0px var(--shadow-color)',
            ...style
        }}>
            {children}
        </div>
    );
    const SectionHeader = ({ icon, title, sub }: any) => (
        <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
            <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>{icon}</div>
            <div>
                <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{title}</h2>
                {sub && <p style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontWeight: 700 }}>{sub}</p>}
            </div>
        </div>
    );
    const Tag = ({ label, bg = 'var(--color-surface)' }: any) => (
        <div className="hover-pop-card" style={{ padding: '8px 14px', background: bg, border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', fontSize: '0.9rem', fontWeight: 900, boxShadow: '4px 4px 0px 0px var(--shadow-color)', textTransform: 'uppercase' }}>{label}</div>
    );

    const SectionBody = ({ children }: any) => (
        <div style={{ padding: '24px' }}>
            {children}
        </div>
    );

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>

            {/* Header */}
            <div className="animate-jitter-in" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', borderBottom: '3px solid var(--color-border)', display: 'inline-block' }}>Venture Blueprint · 5-Phase Analysis</p>
                        <h1 className="hover-glitch" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '10px', textTransform: 'uppercase' }}>{bp?.startupName || idea.title}</h1>
                        <p style={{ fontWeight: 800, fontSize: '1.05rem', background: 'var(--color-primary)', display: 'inline-block', padding: '4px 10px', border: '2px solid var(--color-border)', transform: 'rotate(-1deg)' }}>"{bp?.tagline || idea.tagline}"</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => router.push('/generate')} className="btn-secondary">← New Idea</button>
                        <button onClick={handleSave} className="btn-secondary" disabled={saved || saving}>{saved ? '✓ Saved' : saving ? 'Saving...' : '💾 Save'}</button>
                        <button onClick={() => window.print()} className="btn-primary">📄 Export PDF</button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                    <span className="badge badge-emerald">Feasibility: {feasScore}/100 {bp?.scores?.grade ? `(${bp.scores.grade})` : ''}</span>
                    {bp?.edgeTool && <span className="badge badge-purple">⭐ {bp.edgeTool.split(' ')[0]}</span>}
                    {bp?.preSeedCapital?.total && <span className="badge badge-blue">💰 Ask: {bp.preSeedCapital.total}</span>}
                </div>
            </div>

            {bp?.summary && (
                <Card style={{ marginBottom: '24px', borderLeft: '8px solid var(--color-primary)', padding: 0, overflow: 'hidden' }}>
                    <SectionHeader icon="🎯" title="Investor Pitch" sub="30-second elevator pitch" />
                    <SectionBody>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: '1.8', fontStyle: 'italic', borderLeft: '4px solid var(--color-border)', paddingLeft: '20px' }}>"{bp.summary}"</p>
                    </SectionBody>
                </Card>
            )}

            {/* Core Thesis */}
            {(bp?.pain || bp?.antidote) && (
                <Card style={{ marginBottom: '20px' }}>
                    <SectionHeader icon="💡" title="Core Thesis" sub="Pain quantified + Technical antidote" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ padding: '16px', background: 'var(--color-rose)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>🩸 The Pain</p>
                            <p style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.6 }}>{bp.pain}</p>
                        </div>
                        <div style={{ padding: '16px', background: 'var(--color-emerald)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>💊 The Antidote</p>
                            <p style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.6 }}>{bp.antidote}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Reddit OSINT */}
            {bp?.redditOsint && (
                <Card style={{ marginBottom: '20px', background: 'var(--color-surface)' }}>
                    <SectionHeader icon="🔍" title="Reddit & Web OSINT" sub="Community sentiment simulation" />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {bp.redditOsint.subreddits?.map((s, i) => {
                            const cleanName = s.replace(/^\/?r\//, '');
                            return (
                                <a key={i} href={`https://www.reddit.com/r/${cleanName}`} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', background: 'var(--color-accent)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', fontWeight: 800, fontSize: '0.82rem', textDecoration: 'none', color: 'var(--color-text-1)' }}>
                                    {s}
                                </a>
                            );
                        })}
                    </div>
                    <div style={{ padding: '10px 14px', background: 'var(--color-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>📣 Sentiment</p>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{bp.redditOsint.sentiment}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {bp.redditOsint.complaints?.map((c, i) => (
                            <div key={i} style={{ padding: '10px 14px', background: 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', borderLeft: '3px solid var(--color-rose)', fontSize: '0.88rem', fontWeight: 600, fontStyle: 'italic' }}>
                                💬 "{c}"
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Demand Trend */}
            {bp?.demandTrend && (
                <Card style={{ marginBottom: '20px', background: 'var(--color-primary)' }}>
                    <SectionHeader icon="📈" title="Demand Trend" sub={`Google Trends Analysis for "${bp.demandTrend.keyword}"`} />
                    <div style={{ padding: '10px 14px', background: 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>📡 Trend Direction</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 900, color: bp.demandTrend.trendDirection === 'growing' ? 'var(--color-emerald)' : bp.demandTrend.trendDirection === 'declining' ? 'var(--color-rose)' : 'var(--color-text-1)' }}>
                            {bp.demandTrend.trendDirection.toUpperCase()}
                        </p>
                    </div>
                    <div style={{ padding: '14px', background: 'var(--color-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{bp.demandTrend.summary}</p>
                    </div>
                </Card>
            )}

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <Card style={{ transform: 'rotate(-1deg)', transition: 'transform 0.15s', padding: 0, overflow: 'hidden' }} className="delay-100">
                    <SectionHeader icon="📊" title="Market Gap — White Space" sub="First Principles + OSINT-derived" />
                    <SectionBody>
                        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            {Array.isArray(bp?.marketGap) && bp.marketGap.map((gap: string, i: number) => (
                                <li key={i} style={{ padding: '12px 0', borderBottom: i !== bp.marketGap.length - 1 ? 'border-width solid var(--color-border)' : 'none', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'var(--color-emerald)', fontSize: '1.2rem', lineHeight: 1 }}>★</span>
                                    <span style={{ fontWeight: 700, lineHeight: 1.5 }}>{gap}</span>
                                </li>
                            ))}
                            {!(bp as any)?.marketGap && (idea as any) && (
                                <li style={{ padding: '12px 0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'var(--color-emerald)', fontSize: '1.2rem', lineHeight: 1 }}>★</span>
                                    <span style={{ fontWeight: 700, lineHeight: 1.5 }}>Market gap analysis pending full generation.</span>
                                </li>
                            )}
                        </ul>
                        {bp?.usp && (
                            <div style={{ marginTop: '14px', padding: '12px 16px', background: 'var(--color-primary)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>🔒 Unfair Advantage (USP)</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{bp.usp}</p>
                            </div>
                        )}
                    </SectionBody>
                </Card>

                {/* Feasibility Breakdown */}
                <Card style={{ transform: 'rotate(1deg)', transition: 'transform 0.15s', padding: 0, overflow: 'hidden' }} className="delay-200">
                    <SectionHeader icon="⚡" title="Feasibility & Scalability" sub="Composite score computed from 5 weighted sub-scores" />
                    <SectionBody>
                        {/* Composite Score + Grade */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ background: 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: '50%', padding: '28px', boxShadow: '4px 4px 0px 0px var(--shadow-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: feasColor, WebkitTextStroke: '2px black' } as any}>{feasScore}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 900 }}>/100</div>
                            </div>
                            {bp?.scores?.grade && (
                                <div style={{ padding: '12px 20px', background: feasColor, border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', boxShadow: '4px 4px 0px 0px var(--shadow-color)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{bp.scores.grade}</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Grade</div>
                                </div>
                            )}
                        </div>

                        {/* Sub-Score Bars */}
                        {bp?.scores && (() => {
                            const SCORE_LABELS: Record<string, { label: string; icon: string }> = {
                                technicalFeasibility: { label: 'Technical Feasibility', icon: '🛠️' },
                                marketReadiness: { label: 'Market Readiness', icon: '📈' },
                                regulatoryRisk: { label: 'Regulatory Risk (inv.)', icon: '📋' },
                                competitiveAdvantage: { label: 'Competitive Advantage', icon: '🔒' },
                                executionComplexity: { label: 'Execution Complexity (inv.)', icon: '⚙️' },
                            };
                            const scoreKeys = Object.keys(SCORE_LABELS);
                            return (
                                <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                                    {scoreKeys.map(key => {
                                        const raw = (bp.scores as any)?.[key] ?? 0;
                                        const info = SCORE_LABELS[key];
                                        const barColor = raw >= 70 ? 'var(--color-emerald)' : raw >= 50 ? 'var(--color-primary)' : 'var(--color-rose)';
                                        const weight = bp.scores?.breakdown?.[key]?.weight;
                                        return (
                                            <div key={key}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>{info.icon} {info.label}</span>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>{raw}/100 {weight ? `(×${(weight * 100).toFixed(0)}%)` : ''}</span>
                                                </div>
                                                <div style={{ height: '10px', background: 'var(--color-bg)', border: '2px solid var(--color-border)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${raw}%`, background: barColor, transition: 'width 0.5s ease' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {/* Score Rationale */}
                        {bp?.scores?.scoreRationale && (
                            <div style={{ padding: '10px 14px', background: 'var(--color-bg)', border: '2px solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: '12px' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>🧠 Score Rationale</p>
                                <p style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.6 }}>{bp.scores.scoreRationale}</p>
                            </div>
                        )}

                        {bp?.realityCheck && (
                            <div style={{ padding: '10px 14px', background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: '12px' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>⚠ Reality Check</p>
                                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{bp.realityCheck}</p>
                            </div>
                        )}
                        {bp?.scalabilityPath && (
                            <div style={{ padding: '10px 14px', background: 'var(--color-emerald)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>📈 100 → 100K Scale Path</p>
                                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{bp.scalabilityPath}</p>
                            </div>
                        )}
                    </SectionBody>
                </Card>

                {/* Competitor Intelligence */}
                <Card style={{ transform: 'rotate(-0.5deg)', transition: 'transform 0.2s' }} className="delay-300">
                    <SectionHeader icon="🏆" title="Competitor Intelligence Matrix" sub="Pricing · Features · Breach" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {bp?.competitors?.map((c, i) => (
                            <div key={i} style={{ padding: '14px', background: 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', boxShadow: '3px 3px 0px 0px var(--shadow-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <h3 style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>{c.name}</h3>
                                    {c.pricing && <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'var(--color-primary)', padding: '2px 8px', border: '1px solid var(--color-border)' }}>{c.pricing}</span>}
                                </div>
                                {c.coreFeatures && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {c.coreFeatures.map((f: string, j: number) => <span key={j} style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-bg)', padding: '2px 7px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>{f}</span>)}
                                    </div>
                                )}
                                <div style={{ padding: '8px 10px', background: 'var(--color-rose)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '3px' }}>⚔ The Breach</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.breach}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Technical Schematic */}
                <Card style={{ transform: 'rotate(0.5deg)', transition: 'transform 0.2s' }} className="delay-400">
                    <SectionHeader icon="🛠️" title="Technical Schematic" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        {bp?.techStack?.map((t, i) => <Tag key={i} label={t} />)}
                    </div>
                    {bp?.edgeTool && <Tag label={`⭐ Edge: ${bp.edgeTool}`} bg="var(--color-primary)" />}
                    {bp?.dataStrategy && (
                        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>🗄 Data Moat</p>
                            <p style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5 }}>{bp.dataStrategy}</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Target Audience & Personas */}
            <Card style={{ marginBottom: '24px', padding: 0, overflow: 'hidden' }} className="delay-100">
                <SectionHeader icon="👥" title="Target Audience Personas" sub="Based on initial elaboration and domain" />
                <SectionBody>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {(bp as any)?.targetPersonas?.map((persona: any, i: number) => (
                            <div key={i} style={{ padding: '20px', background: 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}>
                                <h3 style={{ fontWeight: 900, marginBottom: '8px', fontSize: '1.1rem' }}>{persona.name}</h3>
                                <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>{persona.description}</p>
                            </div>
                        ))}
                        {!(bp as any)?.targetPersonas && (idea as any)?.expandedTargetUsers && (
                            <div style={{ padding: '20px', background: 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}>
                                <h3 style={{ fontWeight: 900, marginBottom: '8px', fontSize: '1.1rem' }}>Primary Persona</h3>
                                <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>{(idea as any).expandedTargetUsers}</p>
                            </div>
                        )}
                    </div>
                </SectionBody>
            </Card>

            {/* Business Model Canvas (BMC) */}
            {bp?.bmc && (
                <Card style={{ marginBottom: '24px', padding: 0, overflow: 'hidden' }} className="delay-200">
                    <SectionHeader icon="📋" title="Lean Business Model Canvas" sub="Strategic template for lean execution" />
                    <SectionBody>
                        <div style={{ padding: '12px', background: 'var(--color-primary)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: '16px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>💎 Value Proposition</p>
                            <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{bp.bmc.valueProposition}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                            {[
                                { label: '🤝 Key Partners', items: bp.bmc.keyPartners, bg: 'var(--color-emerald)' },
                                { label: '⚙️ Key Activities', items: bp.bmc.keyActivities, bg: 'var(--color-accent)' },
                                { label: '🏛 Key Resources', items: bp.bmc.keyResources, bg: 'var(--color-secondary)' },
                                { label: '💞 Customer Relations', items: bp.bmc.customerRelationships, bg: 'var(--color-surface)' },
                                { label: '📡 Channels', items: bp.bmc.channels, bg: 'var(--color-surface)' },
                                { label: '👥 Customer Segments', items: bp.bmc.customerSegments, bg: 'var(--color-surface)' },
                                { label: '💵 Revenue Streams', items: bp.bmc.revenueStreams, bg: 'var(--color-primary)' },
                                { label: '💸 Cost Structure', items: bp.bmc.costStructure, bg: 'var(--color-rose)' },
                            ].map((block, i) => (
                                <div key={i} style={{ padding: '12px', background: block.bg, border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{block.label}</p>
                                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {block.items?.map((item, j) => <li key={j} style={{ fontSize: '0.82rem', fontWeight: 600 }}>• {item}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </SectionBody>
                </Card>
            )}

            {/* Pricing + Pre-Seed + Exit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {bp?.pricingTiers && (
                    <Card className="delay-300">
                        <SectionHeader icon="💰" title="Pricing Tiers" sub="Competitor-benchmarked" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {bp.pricingTiers.map((t, i) => (
                                <div key={i} style={{ border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', overflow: 'hidden', boxShadow: '3px 3px 0px 0px var(--shadow-color)' }}>
                                    <div style={{ padding: '10px 14px', background: i === 0 ? 'var(--color-surface)' : i === 1 ? 'var(--color-primary)' : 'var(--color-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-width) solid var(--color-border)' }}>
                                        <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>{t.tier}</span>
                                        <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{t.price}</span>
                                    </div>
                                    <div style={{ padding: '10px 14px', background: 'var(--color-bg)' }}>
                                        {t.features?.map((f, j) => <p key={j} style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>✓ {f}</p>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {bp?.preSeedCapital && (
                        <Card className="delay-400">
                            <SectionHeader icon="💸" title="Pre-Seed Capital" sub={`Total Ask: ${bp.preSeedCapital.total}`} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {bp.preSeedCapital.breakdown?.map((item, i) => (
                                    <div key={i} style={{ padding: '8px 12px', background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', fontSize: '0.87rem', fontWeight: 700 }}>💰 {item}</div>
                                ))}
                            </div>
                        </Card>
                    )}
                    {bp?.exitStrategy && (
                        <Card style={{ background: 'var(--color-secondary)' }} className="delay-500">
                            <SectionHeader icon="🚪" title="Exit Strategy" sub="5-Year acquisition targets" />
                            <p style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.6 }}>{bp.exitStrategy}</p>
                        </Card>
                    )}
                    {/* Monetization */}
                    <Card className="delay-600">
                        <SectionHeader icon="📈" title="Revenue Architecture" sub="LTV-aware model" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {bp?.monetization?.map((m, i) => (
                                <div key={i} style={{ padding: '12px 14px', background: i === 0 ? 'var(--color-primary)' : 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', fontSize: '0.87rem', fontWeight: 700, lineHeight: 1.5, boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}>💵 {m}</div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* 12-Week Roadmap */}
            <Card className="delay-700">
                <SectionHeader icon="🗺️" title="12-Week Execution Blueprint" sub="MVP → Pilot → Investment Prep" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {bp?.roadmap?.map((phase, i) => {
                        const colors = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-emerald)'];
                        return (
                            <div key={i} style={{ border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', overflow: 'hidden', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}>
                                <div style={{ background: colors[i], padding: '16px', borderBottom: 'var(--border-width) solid var(--color-border)' }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Weeks {phase.week}</p>
                                    <p style={{ fontSize: '1.05rem', fontWeight: 900, marginTop: '4px' }}>{phase.goal}</p>
                                    {phase.killerFeature && <p style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '8px', background: 'rgba(0,0,0,0.12)', padding: '5px 8px', borderRadius: '4px' }}>⚡ Core: {phase.killerFeature}</p>}
                                    {phase.targetGroup && <p style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '8px', background: 'rgba(0,0,0,0.12)', padding: '5px 8px', borderRadius: '4px' }}>🎯 Target: {phase.targetGroup}</p>}
                                    {phase.seedAsk && <p style={{ fontSize: '0.8rem', fontWeight: 900, marginTop: '8px', background: 'rgba(0,0,0,0.15)', padding: '5px 8px', borderRadius: '4px' }}>💰 Ask: {phase.seedAsk}</p>}
                                </div>
                                <div style={{ padding: '14px', background: 'var(--color-surface)' }}>
                                    {phase.kpis && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>📈 Seed KPIs</p>
                                            {phase.kpis.map((k, j) => <p key={j} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-emerald)', marginBottom: '3px' }}>✓ {k}</p>)}
                                        </div>
                                    )}
                                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                        {phase.tasks?.map((task, j) => (
                                            <li key={j} style={{ display: 'flex', gap: '8px', fontSize: '0.87rem', fontWeight: 600, lineHeight: 1.5 }}>
                                                <span style={{ flexShrink: 0, fontWeight: 900 }}>→</span>{task}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
