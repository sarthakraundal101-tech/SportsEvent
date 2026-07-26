import React from 'react';
import { Trophy, Users, GitBranch, Award, Calendar } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, selectedEvent }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
          }}>
            <Trophy size={26} color="#0b0f19" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              SPORTS<span className="gradient-text">MANAGER</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-ai">Level 1 - Basic AI</span>
              {selectedEvent && (
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  • {selectedEvent.title}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={18} />
            Events
          </button>
          <button 
            className={`nav-item ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <Users size={18} />
            Teams
          </button>
          <button 
            className={`nav-item ${activeTab === 'bracket' ? 'active' : ''}`}
            onClick={() => setActiveTab('bracket')}
          >
            <GitBranch size={18} />
            AI Bracket Gen
          </button>
          <button 
            className={`nav-item ${activeTab === 'rankings' ? 'active' : ''}`}
            onClick={() => setActiveTab('rankings')}
          >
            <Award size={18} />
            AI Ranking Calculator
          </button>
        </div>
      </div>
    </nav>
  );
}
