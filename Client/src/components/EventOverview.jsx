import React, { useState } from 'react';
import { Calendar, MapPin, Trophy, Plus, CheckCircle, Sparkles } from 'lucide-react';
import { createEvent } from '../services/api';

export default function EventOverview({ events, selectedEvent, setSelectedEvent, refreshEvents }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    sportCategory: 'Basketball',
    location: '',
    startDate: '',
    endDate: '',
    maxTeams: 8,
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createEvent(form);
    setShowModal(false);
    setForm({ title: '', sportCategory: 'Basketball', location: '', startDate: '', endDate: '', maxTeams: 8, description: '' });
    refreshEvents();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(0,240,255,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-ai">
                <Sparkles size={14} /> RSS HackMode ON
              </span>
              <span className="badge badge-status">Active Tournament Hub</span>
            </div>
            <h1 className="font-heading" style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
              Sports Event Dashboard
            </h1>
            <p className="text-muted" style={{ maxWidth: '650px', fontSize: '1rem', lineHeight: '1.5' }}>
              Manage sports tournaments, execute automated AI tournament bracket seeding based on skill ratings, and calculate dynamic player rankings.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Create Event
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <h2 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--primary-cyan)' }}>
        Tournaments & Events ({events.length})
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {events.map((evt) => {
          const isSelected = selectedEvent?.id === evt.id;
          return (
            <div 
              key={evt.id} 
              className="glass-panel"
              style={{
                padding: '24px',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--primary-cyan)' : 'var(--border-color)',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                background: isSelected ? 'rgba(0, 240, 255, 0.05)' : 'var(--bg-card)'
              }}
              onClick={() => setSelectedEvent(evt)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  {evt.sportCategory}
                </span>
                {isSelected && (
                  <span style={{ color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                    <CheckCircle size={16} /> Selected
                  </span>
                )}
              </div>

              <h3 className="font-heading" style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#fff' }}>
                {evt.title}
              </h3>
              <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '16px', minHeight: '40px' }}>
                {evt.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color="var(--primary-cyan)" />
                  <span>{evt.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="var(--primary-amber)" />
                  <span>{evt.startDate} to {evt.endDate}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={15} color="var(--accent-purple)" />
                  <span>Max Capacity: {evt.maxTeams} Teams</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create Event */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="font-heading" style={{ marginBottom: '16px', color: 'var(--primary-cyan)' }}>
              Create New Sports Event
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Event Title</label>
                <input 
                  type="text" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Sport Category</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(15,23,42,0.9)', border: '1px solid var(--border-color)', color: '#fff' }}
                    value={form.sportCategory} 
                    onChange={e => setForm({...form, sportCategory: e.target.value})}
                  >
                    <option value="Basketball">Basketball</option>
                    <option value="Soccer">Soccer</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Esports">Esports</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Volleyball">Volleyball</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Max Teams</label>
                  <input 
                    type="number" 
                    min="2"
                    max="64"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                    value={form.maxTeams} 
                    onChange={e => setForm({...form, maxTeams: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Venue / Location</label>
                <input 
                  type="text" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                  value={form.location} 
                  onChange={e => setForm({...form, location: e.target.value})} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Start Date</label>
                  <input 
                    type="date" 
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                    value={form.startDate} 
                    onChange={e => setForm({...form, startDate: e.target.value})} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>End Date</label>
                  <input 
                    type="date" 
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                    value={form.endDate} 
                    onChange={e => setForm({...form, endDate: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Description</label>
                <textarea 
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
