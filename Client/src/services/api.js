const API_BASE_URL = 'http://localhost:5000/api';

export const fetchEvents = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/events`);
    return await res.json();
  } catch (err) {
    console.error("API error fetching events:", err);
    return [];
  }
};

export const createEvent = async (eventData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    return await res.json();
  } catch (err) {
    console.error("API error creating event:", err);
  }
};

export const fetchTeams = async (eventId) => {
  try {
    const url = eventId ? `${API_BASE_URL}/teams?eventId=${eventId}` : `${API_BASE_URL}/teams`;
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error("API error fetching teams:", err);
    return [];
  }
};

export const createTeam = async (teamData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
    });
    return await res.json();
  } catch (err) {
    console.error("API error creating team:", err);
  }
};

export const fetchMatches = async (eventId) => {
  try {
    const url = eventId ? `${API_BASE_URL}/matches?eventId=${eventId}` : `${API_BASE_URL}/matches`;
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error("API error fetching matches:", err);
    return [];
  }
};

export const updateMatchScore = async (scoreData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/matches/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData)
    });
    return await res.json();
  } catch (err) {
    console.error("API error updating match score:", err);
  }
};

export const generateAiBracket = async (eventId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/generate-bracket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId })
    });
    return await res.json();
  } catch (err) {
    console.error("API error generating bracket:", err);
  }
};

export const calculateAiRankings = async (eventId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/calculate-rankings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId })
    });
    return await res.json();
  } catch (err) {
    console.error("API error calculating rankings:", err);
  }
};
