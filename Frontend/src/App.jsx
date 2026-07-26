import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import EventOverview from './components/EventOverview';
import TeamManager from './components/TeamManager';
import BracketVisualizer from './components/BracketVisualizer';
import RankingLeaderboard from './components/RankingLeaderboard';
import MatchScoreModal from './components/MatchScoreModal';
import { fetchEvents, fetchTeams } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [scoreModalMatch, setScoreModalMatch] = useState(null);

  const loadEvents = async () => {
    const data = await fetchEvents();
    if (data && data.length > 0) {
      setEvents(data);
      if (!selectedEvent) {
        setSelectedEvent(data[0]);
      }
    }
  };

  const loadTeams = async () => {
    const data = await fetchTeams(selectedEvent ? selectedEvent.id : null);
    if (data) {
      setTeams(data);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadTeams();
    }
  }, [selectedEvent]);

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedEvent={selectedEvent} 
      />

      <main className="main-content">
        {activeTab === 'events' && (
          <EventOverview 
            events={events} 
            selectedEvent={selectedEvent} 
            setSelectedEvent={setSelectedEvent} 
            refreshEvents={loadEvents} 
          />
        )}

        {activeTab === 'teams' && (
          <TeamManager 
            teams={teams} 
            selectedEvent={selectedEvent} 
            refreshTeams={loadTeams} 
          />
        )}

        {activeTab === 'bracket' && (
          <BracketVisualizer 
            selectedEvent={selectedEvent} 
            onOpenScoreModal={(match) => setScoreModalMatch(match)} 
          />
        )}

        {activeTab === 'rankings' && (
          <RankingLeaderboard 
            selectedEvent={selectedEvent} 
          />
        )}
      </main>

      {scoreModalMatch && (
        <MatchScoreModal 
          match={scoreModalMatch} 
          selectedEvent={selectedEvent}
          onClose={() => setScoreModalMatch(null)} 
          onScoreUpdated={() => {
            loadTeams();
            if (scoreModalMatch?.refreshBracket) {
              scoreModalMatch.refreshBracket();
            }
          }} 
        />
      )}
    </div>
  );
}
