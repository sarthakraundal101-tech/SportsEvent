import React, { useState, useEffect } from 'react';
import { GitBranch, Sparkles, Trophy, Edit3, Shield, Activity } from 'lucide-react';
import { generateAiBracket } from '../services/api';

export default function BracketVisualizer({ selectedEvent, onOpenScoreModal }) {
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateBracket = async () => {
    setLoading(true);
    const data = await generateAiBracket(selectedEvent ? selectedEvent.id : 'evt-1');
    if (data) {
      setBracketData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    handleGenerateBracket();
  }, [selectedEvent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-ai"><Sparkles size={14} /> AI Tournament Generator</span>
            <span className="badge" style={{ background: 'rgba(255, 170, 0, 0.15)', color: 'var(--primary-amber)', border: '1px solid rgba(255, 170, 0, 0.3)' }}>
              Seeding Algorithm v1.0
            </span>
          </div>
          <h2 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Auto Tournament Bracket Generator
          </h2>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            AI optimizes match placements to prevent top-seeded teams from early elimination and calculates match win probabilities.
          </p>
        </div>

        <button className="btn btn-amber" onClick={handleGenerateBracket} disabled={loading}>
          <GitBranch size={18} />
          {loading ? 'Re-Generating...' : 'Re-Generate AI Bracket'}
        </button>
      </div>

      {bracketData?.ai_summary && (
        <div style={{
          background: 'rgba(0, 240, 255, 0.05)',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--primary-cyan)',
          fontSize: '0.9rem'
        }}>
          <Activity size={18} />
          <span><strong>AI Insights:</strong> {bracketData.ai_summary}</span>
        </div>
      )}

      {/* Bracket Rounds Renderer */}
      <div className="bracket-container glass-panel" style={{ padding: '28px', minHeight: '480px' }}>
        {bracketData?.rounds ? (
          bracketData.rounds.map((roundItem) => (
            <div key={roundItem.round_number} className="bracket-round">
              <div style={{
                textAlign: 'center',
                padding: '8px 0',
                borderBottom: '2px solid var(--primary-cyan)',
                marginBottom: '16px',
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--primary-cyan)',
                letterSpacing: '0.05em'
              }}>
                {roundItem.round_name || `Round ${roundItem.round_number}`}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', flex: 1 }}>
                {roundItem.matches.map((m) => {
                  const t1 = m.team1;
                  const t2 = m.team2;
                  const winProb1 = m.ai_insights?.team1_win_probability ? Math.round(m.ai_insights.team1_win_probability * 100) : 50;
                  const winProb2 = m.ai_insights?.team2_win_probability ? Math.round(m.ai_insights.team2_win_probability * 100) : 50;

                  return (
                    <div key={m.match_id} className="match-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>{m.match_id} • {m.round_name}</span>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--primary-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => onOpenScoreModal(m)}
                        >
                          <Edit3 size={12} /> Score
                        </button>
                      </div>

                      {/* Team 1 */}
                      <div className={`match-team ${m.winner_id === t1?.id ? 'winner' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Shield size={14} color="var(--primary-cyan)" />
                          <span style={{ fontSize: '0.9rem', color: t1 ? '#fff' : 'var(--text-dim)' }}>
                            {t1 ? t1.name : 'TBD'}
                          </span>
                        </div>
                        {t1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--primary-cyan)', fontSize: '0.7rem' }}>
                              AI {winProb1}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className={`match-team ${m.winner_id === t2?.id ? 'winner' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Shield size={14} color="var(--primary-amber)" />
                          <span style={{ fontSize: '0.9rem', color: t2 ? '#fff' : 'var(--text-dim)' }}>
                            {t2 ? t2.name : (m.is_bye ? 'BYE' : 'TBD')}
                          </span>
                        </div>
                        {t2 && !m.is_bye && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge" style={{ background: 'rgba(255, 170, 0, 0.1)', color: 'var(--primary-amber)', fontSize: '0.7rem' }}>
                              AI {winProb2}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: 'var(--text-muted)' }}>
            Generating Tournament Bracket...
          </div>
        )}
      </div>
    </div>
  );
}
