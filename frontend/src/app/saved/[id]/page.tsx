'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Printer, Trash2 } from 'lucide-react';

export default function SavedIdeaPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);

    const [data, setData] = useState<{ idea: any; analysis: any } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this idea?')) return;
        setDeleting(true);
        try {
            await apiClient.deleteIdea(id);
            router.push('/saved');
        } catch (err: any) {
            setError(err.message || 'Failed to delete idea');
            setDeleting(false);
        }
    };

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        apiClient.getIdea(id)
            .then(res => setData(res))
            .catch(err => setError(err.message || 'Failed to load idea'))
            .finally(() => setLoading(false));
    }, [user, id]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="loading-spinner" />
        </div>
    );

    if (error || !data) return (
        <div style={{ maxWidth: '700px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
            <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-error)' }}>⚠ {error || 'Idea not found'}</p>
            <button onClick={() => router.push('/saved')} className="btn-secondary" style={{ marginTop: '24px' }}>← Back to Saved</button>
        </div>
    );

    const { idea, analysis } = data;
    const selectedIdea = idea.selected_idea;
    const bp = analysis ? {
        ...analysis,
        competitors: analysis.competitors,
        techStack: analysis.tech_stack,
        monetization: analysis.monetization,
        roadmap: analysis.roadmap,
    } : null;

    const feasScore = bp?.scores?.compositeScore ?? bp?.feasibilityScore ?? 0;
    const feasColor = feasScore >= 70 ? 'var(--color-emerald)' : feasScore >= 50 ? 'var(--color-primary)' : 'var(--color-rose)';
    const renderBullets = (text: string) => text?.split('\n').map((line: string, i: number) => (
        <p key={i} style={{ fontSize: '0.92rem', fontWeight: line.startsWith('•') ? 600 : 700, color: 'var(--color-text-1)', lineHeight: 1.7, marginBottom: '4px' }}>{line}</p>
    ));

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>
            {/* Header */}
            <div className="animate-jitter-in" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', borderBottom: 'var(--border-width) solid var(--color-border)', display: 'inline-block' }}>
                            Saved Blueprint · {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <h1 className="hover-glitch" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '12px', color: 'var(--color-text-1)', textTransform: 'uppercase', textShadow: '4px 4px 0px 0px #000000', WebkitTextStroke: '2px black', WebkitTextFillColor: 'white' }}>
                            {bp?.startupName || selectedIdea?.title || 'Untitled'}
                        </h1>
                        <p style={{ fontWeight: 800, fontSize: '1.15rem', background: 'var(--color-primary)', display: 'inline-block', padding: '6px 14px', border: 'var(--border-width) solid var(--color-border)', transform: 'rotate(-1deg)', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}>
                            "{bp?.tagline || selectedIdea?.tagline}"
                        </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button onClick={() => window.print()} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '0.9rem' }}>
                            <Printer size={16} strokeWidth={2.5} /> Print PDF
                        </button>
                        <button onClick={handleDelete} disabled={deleting} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-error)', color: 'black', padding: '12px 20px', fontSize: '0.9rem' }}>
                            <Trash2 size={16} strokeWidth={2.5} /> {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <span className="badge badge-emerald" style={{ boxShadow: '3px 3px 0px 0px var(--shadow-color)', padding: '8px 14px', fontSize: '0.9rem' }}>📂 {idea.domain}</span>
                {feasScore > 0 && <span className="badge badge-blue" style={{ boxShadow: '3px 3px 0px 0px var(--shadow-color)', padding: '8px 14px', fontSize: '0.9rem' }}>Feasibility: {feasScore}/100 {bp?.scores?.grade ? `(${bp.scores.grade})` : ''}</span>}
                {bp?.edgeTool && <span className="badge badge-purple" style={{ boxShadow: '3px 3px 0px 0px var(--shadow-color)', padding: '8px 14px', fontSize: '0.9rem' }}>⭐ {bp.edgeTool.split(' ')[0]}</span>}
            </div>

            {!bp ? (
                <div className="section-card" style={{ textAlign: 'center', padding: '48px' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>No analysis found for this idea.</p>
                </div>
            ) : (
                <>
                    {/* Investor Pitch */}
                    {bp.summary && (
                        <div className="section-card hover-pop-card animate-brutal-bounce delay-100" style={{ marginBottom: '24px', borderLeft: '8px solid var(--color-primary)', padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0px 0px var(--shadow-color)' }}>
                            <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
                                <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>🎯</div>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Investor Pitch</h2>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontWeight: 700 }}>30-second elevator pitch</p>
                                </div>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <p style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: '1.8', fontStyle: 'italic', borderLeft: '4px solid var(--color-border)', paddingLeft: '20px' }}>"{bp.summary}"</p>
                            </div>
                        </div>
                    )}

                    {/* Core Thesis */}
                    {(bp.pain || bp.antidote) && (
                        <div className="section-card hover-pop-card animate-brutal-bounce delay-200" style={{ marginBottom: '24px', padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0px 0px var(--shadow-color)' }}>
                            <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
                                <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>⚙️</div>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Core Thesis & Stack</h2>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontWeight: 700 }}>Underlying logic and technology</p>
                                </div>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                    <div style={{ padding: '16px', background: 'var(--color-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Logic / Pivot</p>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>{bp.coreLogic}</p>
                                    </div>
                                    <div style={{ padding: '16px', background: 'var(--color-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Key Tech Stack</p>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>{bp.techStack}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>

                        {/* Market Gap */}
                        <div className="section-card hover-pop-card animate-brutal-bounce delay-300" style={{ padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0px 0px var(--shadow-color)' }}>
                            <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
                                <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>📊</div>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Market Gap — First Principles</h2>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontWeight: 700 }}>Why hasn't this been solved?</p>
                                </div>
                            </div>
                            <div style={{ padding: '24px' }}>
                                {renderBullets(bp.marketGap || bp.market?.marketGap || '')}
                            </div>
                        </div>

                        {/* Feasibility — Dynamic Score Breakdown */}
                        <div className="section-card hover-pop-card animate-brutal-bounce delay-400" style={{ padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0px 0px var(--shadow-color)' }}>
                            <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
                                <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>⚡</div>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Feasibility Score</h2>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontWeight: 700 }}>Composite from 5 weighted sub-scores</p>
                                </div>
                            </div>
                            <div style={{ padding: '24px' }}>

                                {/* Composite + Grade */}
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{ background: 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: '50%', padding: '28px', boxShadow: '4px 4px 0px 0px var(--shadow-color)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '3.5rem', fontWeight: 900, color: feasColor, WebkitTextStroke: '2px black' } as any}>{feasScore}</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 900 }}>/100</div>
                                    </div>
                                    {bp.scores?.grade && (
                                        <div style={{ padding: '10px 16px', background: feasColor, border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', boxShadow: '4px 4px 0px 0px var(--shadow-color)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{bp.scores.grade}</div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Grade</div>
                                        </div>
                                    )}
                                </div>

                                {/* Sub-Score Bars */}
                                {bp.scores && (() => {
                                    const SCORE_LABELS: Record<string, { label: string; icon: string }> = {
                                        technicalFeasibility: { label: 'Technical Feasibility', icon: '🛠️' },
                                        marketReadiness: { label: 'Market Readiness', icon: '📈' },
                                        regulatoryRisk: { label: 'Regulatory Risk (inv.)', icon: '📋' },
                                        competitiveAdvantage: { label: 'Competitive Advantage', icon: '🔒' },
                                        executionComplexity: { label: 'Execution Complexity (inv.)', icon: '⚙️' },
                                    };
                                    return (
                                        <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
                                            {Object.keys(SCORE_LABELS).map(key => {
                                                const raw = (bp.scores as any)?.[key] ?? 0;
                                                const info = SCORE_LABELS[key];
                                                const barColor = raw >= 70 ? 'var(--color-emerald)' : raw >= 50 ? 'var(--color-primary)' : 'var(--color-rose)';
                                                const weight = bp.scores?.breakdown?.[key]?.weight;
                                                return (
                                                    <div key={key}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>{info.icon} {info.label}</span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>{raw}/100 {weight ? `(×${(weight * 100).toFixed(0)}%)` : ''}</span>
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
                                {bp.scores?.scoreRationale && (
                                    <div style={{ background: 'var(--color-bg)', border: '2px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '10px 14px', marginBottom: '12px' }}>
                                        <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>🧠 Score Rationale</p>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.6 }}>{bp.scores.scoreRationale}</p>
                                    </div>
                                )}

                                {bp.realityCheck && (
                                    <div style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: '12px 16px' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>⚠ Reality Check</p>
                                        <p style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5 }}>{bp.realityCheck}</p>
                                    </div>
                                )}
                            </div>

                            {/* Competitors */}
                            {bp.competitors && Array.isArray(bp.competitors) && (
                                <div className="section-card hover-pop-card animate-brutal-bounce delay-500" style={{ padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0px 0px var(--shadow-color)' }}>
                                    <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
                                        <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>🏆</div>
                                        <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Competitor Intelligence Matrix</h2>
                                    </div>
                                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {bp.competitors.map((c: any, i: number) => (
                                            <div key={i} style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--border-radius)', border: 'var(--border-width) solid var(--color-border)', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}>
                                                <h3 style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', marginBottom: '10px' }}>{c.name}</h3>
                                                <div style={{ padding: '8px 12px', marginBottom: '8px', background: 'var(--color-bg)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                                                    <p style={{ fontSize: '0.78rem', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>🛡 {c.moat ? 'Their Moat' : 'Strength'}</p>
                                                    <p style={{ fontSize: '0.87rem', fontWeight: 600 }}>{c.moat || c.weakness}</p>
                                                </div>
                                                <div style={{ padding: '8px 12px', background: 'var(--color-rose)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                                                    <p style={{ fontSize: '0.78rem', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>⚔ {c.breach ? 'The Breach' : 'Opportunity'}</p>
                                                    <p style={{ fontSize: '0.87rem', fontWeight: 600 }}>{c.breach || c.differentiation}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>{/* End Main grid */}

                        {/* Tech Stack + Edge Tool + Data Strategy */}
                        <div className="section-card hover-pop-card animate-brutal-bounce delay-600" style={{ padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0px 0px var(--shadow-color)', marginTop: '24px' }}>
                            <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
                                <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>🛠️</div>
                                <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Technical Schematic</h2>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Stack</p>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                                    {(bp.techStack || bp.tech_stack || []).map((t: string, i: number) => (
                                        <li key={i} style={{ padding: '10px 14px', background: 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', fontSize: '0.88rem', fontWeight: 700, boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}>{t}</li>
                                    ))}
                                </ul>
                                {bp.edgeTool && (
                                    <div style={{ padding: '12px 16px', background: 'var(--color-primary)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: '10px' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>⭐ Edge Tool</p>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{bp.edgeTool}</p>
                                    </div>
                                )}
                                {bp.dataStrategy && (
                                    <div style={{ padding: '12px 16px', background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>🗄 Data Moat</p>
                                        <p style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.6 }}>{bp.dataStrategy}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monetization */}
                        <div className="section-card hover-pop-card animate-brutal-bounce delay-700" style={{ padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0px 0px var(--shadow-color)', marginTop: '24px' }}>
                            <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
                                <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>💰</div>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Revenue Architecture</h2>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontWeight: 700 }}>LTV-aware multi-stream model</p>
                                </div>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(bp.monetization || []).map((m: string, i: number) => (
                                        <li key={i} style={{ padding: '12px 16px', background: i === 0 ? 'var(--color-primary)' : 'var(--color-surface)', border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.6, boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}>
                                            💵 {m}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* 12-Week Roadmap */}
                        <div className="section-card hover-pop-card animate-brutal-bounce delay-100" style={{ padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0px 0px var(--shadow-color)', marginTop: '24px' }}>
                            <div className="section-card-header" style={{ padding: '20px 24px', background: 'var(--color-bg)', borderBottom: 'var(--border-width) solid var(--color-border)', marginBottom: '0' }}>
                                <div className="section-icon" style={{ boxShadow: '4px 4px 0px 0px var(--shadow-color)', width: '48px', height: '48px', fontSize: '1.4rem' }}>🗺️</div>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--color-text-1)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>12-Week Execution Sprint</h2>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-3)', fontWeight: 700 }}>Foundation → Alpha → Feedback Loop</p>
                                </div>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                    {(bp.roadmap || []).map((phase: any, i: number) => {
                                        const colors = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-emerald)'];
                                        const tasks = Array.isArray(phase.tasks) ? phase.tasks : [phase.task].filter(Boolean);
                                        return (
                                            <div key={i} style={{ border: 'var(--border-width) solid var(--color-border)', borderRadius: 'var(--border-radius)', overflow: 'hidden', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}>
                                                <div style={{ background: colors[i] || 'var(--color-primary)', padding: '16px', borderBottom: 'var(--border-width) solid var(--color-border)' }}>
                                                    <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Weeks {phase.week}</p>
                                                    <p style={{ fontSize: '1.05rem', fontWeight: 900, marginTop: '4px' }}>{phase.goal || phase.milestone}</p>
                                                    {phase.killerFeature && (
                                                        <p style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '8px', background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                                                            ⚡ Killer Feature: {phase.killerFeature}
                                                        </p>
                                                    )}
                                                </div>
                                                <div style={{ padding: '16px', background: 'var(--color-surface)' }}>
                                                    {phase.kpis && phase.kpis.length > 0 && (
                                                        <div style={{ marginBottom: '12px' }}>
                                                            <p style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>📈 Seed KPIs</p>
                                                            {phase.kpis.map((kpi: string, k: number) => (
                                                                <p key={k} style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-emerald)', marginBottom: '4px' }}>✓ {kpi}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {tasks.map((task: string, j: number) => (
                                                            <li key={j} style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5 }}>
                                                                <span style={{ flexShrink: 0, fontWeight: 900 }}>→</span>{task}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
