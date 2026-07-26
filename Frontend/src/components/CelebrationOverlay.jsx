import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles } from 'lucide-react';

export default function CelebrationOverlay({ winnerName, onClose }) {
  useEffect(() => {
    // Trigger Confetti Burst
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00f0ff', '#ffaa00', '#8b5cf6', '#10b981', '#ef4444']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00f0ff', '#ffaa00', '#8b5cf6', '#10b981', '#ef4444']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    const timer = setTimeout(() => {
      onClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const balloons = [
    { color: '#ef4444', left: '10%', delay: '0s' },
    { color: '#00f0ff', left: '25%', delay: '0.4s' },
    { color: '#ffaa00', left: '40%', delay: '0.2s' },
    { color: '#8b5cf6', left: '60%', delay: '0.6s' },
    { color: '#10b981', left: '75%', delay: '0.1s' },
    { color: '#ec4899', left: '90%', delay: '0.5s' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Floating Balloons */}
      {balloons.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: '-120px',
          left: b.left,
          width: '50px',
          height: '65px',
          background: b.color,
          borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
          boxShadow: `inset -6px -6px 12px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2)`,
          animation: `floatUp 3.5s ease-out forwards ${b.delay}`
        }}>
          {/* String */}
          <div style={{
            position: 'absolute',
            bottom: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '2px',
            height: '16px',
            background: 'rgba(255,255,255,0.7)'
          }} />
        </div>
      ))}

      {/* Winner Celebration Modal Alert */}
      <div style={{
        pointerEvents: 'auto',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
        border: '2px solid #00f0ff',
        borderRadius: '24px',
        padding: '32px 48px',
        textAlign: 'center',
        boxShadow: '0 0 50px rgba(0, 240, 255, 0.5), 0 20px 40px rgba(0,0,0,0.8)',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '16px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffaa00, #d97706)',
          boxShadow: '0 0 30px rgba(255, 170, 0, 0.6)',
          marginBottom: '16px'
        }}>
          <Trophy size={48} color="#0b0f19" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles color="var(--primary-cyan)" size={20} />
          <span className="badge badge-ai">MATCH WINNER CELEBRATION</span>
          <Sparkles color="var(--primary-cyan)" size={20} />
        </div>

        <h2 className="font-heading" style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          {winnerName || 'VICTORY'} WINS!
        </h2>
        <p className="text-muted" style={{ fontSize: '1rem', marginBottom: '20px' }}>
          Match recorded successfully & AI Rankings Updated!
        </p>

        <button className="btn btn-primary" onClick={onClose} style={{ padding: '10px 24px', fontSize: '1rem' }}>
          Continue Tournament 🎉
        </button>
      </div>
    </div>
  );
}
