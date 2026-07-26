import React, { useState } from 'react';
import { updateMatchScore } from '../services/api';
import { Trophy, Check, X } from 'lucide-react';

export default function MatchScoreModal({ match, onClose, onScoreUpdated }) {
  const t1 = match?.team1;
  const t2 = match?.team2;

  const [score1, setScore1] = useState(match?.team1_score || 0);
  const [score2, setScore2] = useState(match?.team2_score || 0);
  const [winnerId, setWinnerId] = useState(match?.winner_id || (t1 ? t1.id : null));

  const handleSave = async (e) => {
    e.preventDefault();
    await updateMatchScore({
      matchId: match.match_id || match.id,
      team1_score: parseInt(score1),
      team2_score: parseInt(score2),
      winner_id: winnerId
    });
    onScoreUpdated();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="font-heading" style={{ color: 'var(--primary-cyan)', fontSize: '1.4rem' }}>
            Update Match Score
          </h2>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
            {/* Team 1 Score Input */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '12px', border: winnerId === t1?.id ? '2px solid var(--accent-green)' : '1px solid var(--border-color)' }}>
              <h4 style={{ color: '#fff', marginBottom: '8px' }}>{t1 ? t1.name : 'Team 1'}</h4>
              <input 
                type="number" 
                min="0"
                style={{ width: '100%', padding: '12px', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', borderRadius: '8px', background: '#0b0f19', border: '1px solid var(--border-color)', color: 'var(--primary-cyan)' }}
                value={score1}
                onChange={(e) => {
                  const val = e.target.value;
                  setScore1(val);
                  if (parseInt(val) > parseInt(score2)) setWinnerId(t1?.id);
                  else if (parseInt(score2) > parseInt(val)) setWinnerId(t2?.id);
                }}
              />
              <button 
                type="button" 
                className="btn"
                style={{ marginTop: '12px', width: '100%', fontSize: '0.8rem', background: winnerId === t1?.id ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)', color: winnerId === t1?.id ? '#0b0f19' : 'var(--text-muted)' }}
                onClick={() => setWinnerId(t1?.id)}
              >
                Set Winner
              </button>
            </div>

            {/* Team 2 Score Input */}
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '12px', border: winnerId === t2?.id ? '2px solid var(--accent-green)' : '1px solid var(--border-color)' }}>
              <h4 style={{ color: '#fff', marginBottom: '8px' }}>{t2 ? t2.name : 'Team 2'}</h4>
              <input 
                type="number" 
                min="0"
                style={{ width: '100%', padding: '12px', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', borderRadius: '8px', background: '#0b0f19', border: '1px solid var(--border-color)', color: 'var(--primary-amber)' }}
                value={score2}
                onChange={(e) => {
                  const val = e.target.value;
                  setScore2(val);
                  if (parseInt(val) > parseInt(score1)) setWinnerId(t2?.id);
                  else if (parseInt(score1) > parseInt(val)) setWinnerId(t1?.id);
                }}
              />
              <button 
                type="button" 
                className="btn"
                style={{ marginTop: '12px', width: '100%', fontSize: '0.8rem', background: winnerId === t2?.id ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)', color: winnerId === t2?.id ? '#0b0f19' : 'var(--text-muted)' }}
                onClick={() => setWinnerId(t2?.id)}
              >
                Set Winner
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save & Recalculate AI Rankings</button>
          </div>
        </form>
      </div>
    </div>
  );
}
