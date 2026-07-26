import React, { useState, useEffect } from 'react';
import { Award, Zap, TrendingUp, RefreshCw, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { calculateAiRankings } from '../services/api';

export default function RankingLeaderboard({ selectedEvent }) {
  const [rankingsData, setRankingsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculateRankings = async () => {
    setLoading(true);
    const data = await calculateAiRankings(selectedEvent ? selectedEvent.id : 'evt-1');
    if (data) {
      setRankingsData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    handleCalculateRankings();
  }, [selectedEvent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-ai"><Sparkles size={14} /> AI Ranking Calculator</span>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              Margin & Momentum Elo
            </span>
          </div>
          <h2 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Dynamic Player & Team Leaderboard
          </h2>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            AI recalculates skill scores, win probability trends, and performance indices in real-time after every match.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleCalculateRankings} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Recalculating...' : 'Recalculate AI Rankings'}
        </button>
      </div>

      {/* Leaderboard Table Card */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px' }}>RANK</th>
              <th style={{ padding: '12px' }}>TEAM & CAPTAIN</th>
              <th style={{ padding: '12px' }}>AI ELO RATING</th>
              <th style={{ padding: '12px' }}>AI PERF INDEX</th>
              <th style={{ padding: '12px' }}>W - L</th>
              <th style={{ padding: '12px' }}>PTS DIFF</th>
              <th style={{ padding: '12px' }}>RATING CHANGE</th>
            </tr>
          </thead>
          <tbody>
            {rankingsData?.rankings?.map((team) => {
              const isTop1 = team.rank === 1;
              const isTop3 = team.rank <= 3;

              return (
                <tr key={team.id} style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  background: isTop1 ? 'rgba(255, 170, 0, 0.05)' : 'transparent'
                }}>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      background: isTop1 ? 'linear-gradient(135deg, #ffaa00, #d97706)' : (isTop3 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255,255,255,0.05)'),
                      color: isTop1 ? '#0b0f19' : (isTop3 ? 'var(--primary-cyan)' : '#fff')
                    }}>
                      {team.rank}
                    </div>
                  </td>

                  <td style={{ padding: '16px 12px' }}>
                    <div>
                      <span className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {team.name}
                        {isTop1 && <Award size={16} color="var(--primary-amber)" />}
                        {team.win_streak > 1 && (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.65rem' }}>
                            <Flame size={10} /> {team.win_streak} Streak
                          </span>
                        )}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Capt. {team.captain}</span>
                    </div>
                  </td>

                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={15} color="var(--primary-amber)" />
                      {team.rating}
                    </span>
                  </td>

                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ width: '130px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span className="text-muted">Index</span>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{team.ai_performance_index || 75}/100</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${team.ai_performance_index || 75}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #00f0ff)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '16px 12px', fontWeight: 600 }}>
                    {team.wins || 0}W - {team.losses || 0}L
                  </td>

                  <td style={{ padding: '16px 12px', color: team.point_difference >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
                    {team.point_difference > 0 ? `+${team.point_difference}` : team.point_difference}
                  </td>

                  <td style={{ padding: '16px 12px' }}>
                    <span className="badge" style={{
                      background: team.rating_change >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: team.rating_change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                      {team.rating_change >= 0 ? `+${team.rating_change}` : team.rating_change}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
