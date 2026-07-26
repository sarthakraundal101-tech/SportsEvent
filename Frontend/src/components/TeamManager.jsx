import React, { useState } from 'react';
import { Users, Plus, Shield, Zap, TrendingUp, Award } from 'lucide-react';
import { createTeam } from '../services/api';

export default function TeamManager({ teams, selectedEvent, refreshTeams }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    captain: '',
    skill_rating: 1200
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createTeam({
      ...form,
      eventId: selectedEvent ? selectedEvent.id : 'evt-1'
    });
    setShowModal(false);
    setForm({ name: '', captain: '', skill_rating: 1200 });
    refreshTeams();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="font-heading" style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            Team Roster & Skill Ratings
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Registered teams for <span style={{ color: 'var(--primary-cyan)' }}>{selectedEvent?.title || 'Active Tournament'}</span>.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Register Team
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {teams.map((t, idx) => (
          <div key={t.id || idx} className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  color: 'var(--primary-cyan)',
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 240, 255, 0.2)'
                }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff' }}>{t.name}</h3>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Capt. {t.captain}</span>
                </div>
              </div>
              <span className="badge badge-ai">Seed #{t.seed || idx + 1}</span>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>AI Skill Rating</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={14} color="var(--primary-amber)" /> {t.skill_rating || 1200}
                </span>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>W / L Record</span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                  {t.wins || 0}W - {t.losses || 0}L
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="font-heading" style={{ marginBottom: '16px', color: 'var(--primary-cyan)' }}>
              Register Team
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Team Name</label>
                <input 
                  type="text" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Captain / Manager Name</label>
                <input 
                  type="text" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                  value={form.captain} 
                  onChange={e => setForm({...form, captain: e.target.value})} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Initial Skill Rating (Elo)</label>
                <input 
                  type="number" 
                  step="10"
                  min="800"
                  max="3000"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                  value={form.skill_rating} 
                  onChange={e => setForm({...form, skill_rating: parseFloat(e.target.value)})} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
