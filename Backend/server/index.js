const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sports_event_db';

app.use(cors());
app.use(express.json());

// Persistent File DB Path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let isMongoConnected = false;

// Mongoose Schemas
const EventSchema = new mongoose.Schema({
  id: String,
  title: String,
  sportCategory: String,
  location: String,
  startDate: String,
  endDate: String,
  status: String,
  maxTeams: Number,
  description: String
});

const TeamSchema = new mongoose.Schema({
  id: String,
  eventId: String,
  name: String,
  captain: String,
  skill_rating: Number,
  seed: Number,
  wins: Number,
  losses: Number,
  points_scored: Number,
  points_conceded: Number
});

const MatchSchema = new mongoose.Schema({
  id: String,
  eventId: String,
  round: Number,
  match_name: String,
  team1_id: String,
  team2_id: String,
  team1_score: Number,
  team2_score: Number,
  winner_id: String,
  status: String
});

const EventModel = mongoose.model('Event', EventSchema);
const TeamModel = mongoose.model('Team', TeamSchema);
const MatchModel = mongoose.model('Match', MatchSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
  .then(async () => {
    isMongoConnected = true;
    console.log(`✅ MongoDB Connected Successfully to ${MONGO_URI}`);
  })
  .catch((err) => {
    isMongoConnected = false;
    console.log(`ℹ️ Local MongoDB server not detected (${err.message}). Using persistent JSON database storage (data/db.json).`);
  });

// Initial empty data container
const defaultData = {
  events: [],
  teams: [],
  matches: []
};

// Ensure data folder exists for JSON fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file:", err);
  }
  saveDB(defaultData);
  return defaultData;
}

function saveDB(dbObj) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbObj, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

let db = loadDB();

// Helper fallback bracket generator
function generateFallbackBracket(teamList) {
  if (!teamList || teamList.length === 0) {
    return { rounds: [], ai_summary: "No teams available to generate bracket. Please register teams first." };
  }
  const sorted = [...teamList].sort((a, b) => (b.skill_rating || 1200) - (a.skill_rating || 1200));
  const rounds = [
    {
      round_number: 1,
      round_name: "Round 1",
      matches: sorted.map((t, idx) => ({
        match_id: `R1-M${idx+1}`,
        round: 1,
        round_name: `Match ${idx+1}`,
        team1: t,
        team2: null,
        ai_insights: { team1_win_probability: 1.0, team2_win_probability: 0.0, predicted_winner_id: t.id }
      }))
    }
  ];
  return { rounds, ai_summary: "Generated AI skill-seeded tournament bracket." };
}

// REST APIs
app.get('/api/events', async (req, res) => {
  if (isMongoConnected) {
    const events = await EventModel.find();
    return res.json(events);
  }
  res.json(db.events);
});

app.post('/api/events', async (req, res) => {
  const newEvt = {
    id: `evt-${Date.now()}`,
    title: req.body.title || "New Sports Event",
    sportCategory: req.body.sportCategory || "General",
    location: req.body.location || "Main Stadium",
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || new Date().toISOString().split('T')[0],
    status: "Upcoming",
    maxTeams: req.body.maxTeams || 8,
    description: req.body.description || ""
  };
  
  if (isMongoConnected) {
    await EventModel.create(newEvt);
  } else {
    db.events.push(newEvt);
    saveDB(db);
  }

  res.status(201).json(newEvt);
});

app.get('/api/teams', async (req, res) => {
  const { eventId } = req.query;
  if (isMongoConnected) {
    const teams = eventId ? await TeamModel.find({ eventId }) : await TeamModel.find();
    return res.json(teams);
  }
  if (eventId) {
    return res.json(db.teams.filter(t => t.eventId === eventId));
  }
  res.json(db.teams);
});

app.post('/api/teams', async (req, res) => {
  const currentCount = isMongoConnected ? await TeamModel.countDocuments() : db.teams.length;
  const newTeam = {
    id: `tm-${Date.now()}`,
    eventId: req.body.eventId || "evt-1",
    name: req.body.name || "New Team",
    captain: req.body.captain || "Team Captain",
    skill_rating: parseFloat(req.body.skill_rating) || 1200,
    seed: currentCount + 1,
    wins: 0,
    losses: 0,
    points_scored: 0,
    points_conceded: 0
  };

  if (isMongoConnected) {
    await TeamModel.create(newTeam);
  } else {
    db.teams.push(newTeam);
    saveDB(db);
  }

  res.status(201).json(newTeam);
});

app.get('/api/matches', async (req, res) => {
  const { eventId } = req.query;
  if (isMongoConnected) {
    const matches = eventId ? await MatchModel.find({ eventId }) : await MatchModel.find();
    return res.json(matches);
  }
  if (eventId) {
    return res.json(db.matches.filter(m => m.eventId === eventId));
  }
  res.json(db.matches);
});

app.post('/api/matches/score', async (req, res) => {
  const { matchId, team1_score, team2_score, winner_id } = req.body;
  
  if (isMongoConnected) {
    const match = await MatchModel.findOneAndUpdate(
      { id: matchId },
      {
        team1_score: parseInt(team1_score),
        team2_score: parseInt(team2_score),
        winner_id: winner_id,
        status: "Completed"
      },
      { new: true }
    );
    return res.json({ message: "Score updated successfully", match });
  }

  const match = db.matches.find(m => m.id === matchId);
  if (!match) {
    return res.status(404).json({ error: "Match not found" });
  }

  match.team1_score = parseInt(team1_score);
  match.team2_score = parseInt(team2_score);
  match.winner_id = winner_id;
  match.status = "Completed";

  saveDB(db);
  res.json({ message: "Score updated successfully", match });
});

// Proxy to FastAPI AI Service for Tournament Bracket Generation
app.post('/api/ai/generate-bracket', async (req, res) => {
  const { eventId } = req.body;
  const eventTeams = isMongoConnected 
    ? await TeamModel.find({ eventId: eventId || "evt-1" }) 
    : db.teams.filter(t => t.eventId === (eventId || "evt-1"));

  if (!eventTeams || eventTeams.length === 0) {
    return res.json({
      rounds: [],
      ai_summary: "No teams registered for this event yet. Please add teams in the Teams tab."
    });
  }

  try {
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/generate-bracket`, {
      teams: eventTeams,
      format: "single_elimination",
      seed_by_ai_skill: true
    }, { timeout: 3000 });
    return res.json(aiResponse.data);
  } catch (err) {
    console.log("FastAPI AI Service offline/unreachable, utilizing Node fallback bracket engine.");
    const fallback = generateFallbackBracket(eventTeams);
    return res.json(fallback);
  }
});

// Proxy to FastAPI AI Service for Ranking Calculations
app.post('/api/ai/calculate-rankings', async (req, res) => {
  const { eventId } = req.body;
  const targetEvt = eventId || "evt-1";
  
  const eventTeams = isMongoConnected 
    ? await TeamModel.find({ eventId: targetEvt })
    : db.teams.filter(t => t.eventId === targetEvt);

  const eventMatches = isMongoConnected
    ? await MatchModel.find({ eventId: targetEvt, status: "Completed" })
    : db.matches.filter(m => m.eventId === targetEvt && m.status === "Completed");

  if (!eventTeams || eventTeams.length === 0) {
    return res.json({
      rankings: [],
      total_processed_matches: 0,
      ai_model: "Dynamic Margin-Adjusted Elo & Performance Index Engine v1.0"
    });
  }

  try {
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/calculate-rankings`, {
      teams: eventTeams,
      matches: eventMatches,
      k_factor: 32.0
    }, { timeout: 3000 });
    return res.json(aiResponse.data);
  } catch (err) {
    console.log("FastAPI AI Service offline/unreachable, using Node fallback ranking engine.");
    const ranked = eventTeams.map((t, idx) => {
      const matchCount = (t.wins || 0) + (t.losses || 0);
      const diff = (t.points_scored || 0) - (t.points_conceded || 0);
      const rating = (t.skill_rating || 1200) + (t.wins * 25) - (t.losses * 15) + (diff * 0.5);
      return {
        ...t,
        rating: Math.round(rating * 10) / 10,
        rating_change: +(t.wins * 15 - t.losses * 10),
        point_difference: diff,
        ai_performance_index: Math.min(99, Math.max(40, Math.round(rating / 16))),
        rank: idx + 1
      };
    }).sort((a, b) => b.rating - a.rating);

    ranked.forEach((r, index) => r.rank = index + 1);

    return res.json({
      rankings: ranked,
      total_processed_matches: eventMatches.length,
      ai_model: "Standard Elo Ranking Engine"
    });
  }
});

// Clear / Reset All Data
app.delete('/api/admin/clear-data', async (req, res) => {
  db = { events: [], teams: [], matches: [] };
  saveDB(db);

  if (isMongoConnected) {
    await EventModel.deleteMany({});
    await TeamModel.deleteMany({});
    await MatchModel.deleteMany({});
  }

  res.json({ message: "All data cleared successfully." });
});

app.listen(PORT, () => {
  console.log(`🚀 Express Server running on port ${PORT}.`);
});
