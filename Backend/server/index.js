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

// Persistent File DB Path (Fallback if MongoDB service is not running locally)
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
    
    // Seed initial data if MongoDB collections are empty
    const count = await EventModel.countDocuments();
    if (count === 0) {
      await seedMongoInitialData();
    }
  })
  .catch((err) => {
    isMongoConnected = false;
    console.log(`ℹ️ Local MongoDB server not detected (${err.message}). Using persistent JSON database storage (data/db.json).`);
  });

// Default initial data for file DB & MongoDB seeding
const defaultData = {
  events: [
    {
      id: "evt-1",
      title: "RSS Cyber Sports Championship 2026",
      sportCategory: "Basketball",
      location: "Rich Arena, Mumbai",
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      status: "Active",
      maxTeams: 8,
      description: "Annual elite tournament featuring top varsity & club sports teams competing for the RSS Trophy."
    },
    {
      id: "evt-2",
      title: "National Football League Cup",
      sportCategory: "Soccer",
      location: "National Stadium",
      startDate: "2026-08-10",
      endDate: "2026-08-15",
      status: "Upcoming",
      maxTeams: 16,
      description: "Premier knockout tournament with AI bracket seeding and live skill leaderboard."
    }
  ],
  teams: [
    { id: "tm-1", eventId: "evt-1", name: "Titan Strikers", captain: "Alex Vance", skill_rating: 1540, seed: 1, wins: 4, losses: 1, points_scored: 185, points_conceded: 140 },
    { id: "tm-2", eventId: "evt-1", name: "Apex Warriors", captain: "Marcus Blade", skill_rating: 1480, seed: 2, wins: 3, losses: 1, points_scored: 160, points_conceded: 135 },
    { id: "tm-3", eventId: "evt-1", name: "Vortex Eagles", captain: "Sarah Connor", skill_rating: 1390, seed: 3, wins: 2, losses: 2, points_scored: 150, points_conceded: 155 },
    { id: "tm-4", eventId: "evt-1", name: "Shadow Ninjas", captain: "David Miller", skill_rating: 1320, seed: 4, wins: 2, losses: 2, points_scored: 140, points_conceded: 145 },
    { id: "tm-5", eventId: "evt-1", name: "Cyber Knights", captain: "Elena Rostova", skill_rating: 1250, seed: 5, wins: 1, losses: 3, points_scored: 130, points_conceded: 160 },
    { id: "tm-6", eventId: "evt-1", name: "Thunder Kings", captain: "Rajesh Kumar", skill_rating: 1210, seed: 6, wins: 1, losses: 3, points_scored: 125, points_conceded: 155 },
    { id: "tm-7", eventId: "evt-1", name: "Blaze Lynx", captain: "Sophie Turner", skill_rating: 1150, seed: 7, wins: 0, losses: 4, points_scored: 110, points_conceded: 170 },
    { id: "tm-8", eventId: "evt-1", name: "Neon Falcons", captain: "Liam Neeson", skill_rating: 1100, seed: 8, wins: 0, losses: 4, points_scored: 105, points_conceded: 175 }
  ],
  matches: [
    { id: "m-101", eventId: "evt-1", round: 1, match_name: "Quarterfinal 1", team1_id: "tm-1", team2_id: "tm-8", team1_score: 98, team2_score: 72, winner_id: "tm-1", status: "Completed" },
    { id: "m-102", eventId: "evt-1", round: 1, match_name: "Quarterfinal 2", team1_id: "tm-4", team2_id: "tm-5", team1_score: 85, team2_score: 81, winner_id: "tm-4", status: "Completed" },
    { id: "m-103", eventId: "evt-1", round: 1, match_name: "Quarterfinal 3", team1_id: "tm-2", team2_id: "tm-7", team1_score: 102, team2_score: 68, winner_id: "tm-2", status: "Completed" },
    { id: "m-104", eventId: "evt-1", round: 1, match_name: "Quarterfinal 4", team1_id: "tm-3", team2_id: "tm-6", team1_score: 91, team2_score: 84, winner_id: "tm-3", status: "Completed" },
    { id: "m-105", eventId: "evt-1", round: 2, match_name: "Semifinal 1", team1_id: "tm-1", team2_id: "tm-4", team1_score: 94, team2_score: 88, winner_id: "tm-1", status: "Completed" },
    { id: "m-106", eventId: "evt-1", round: 2, match_name: "Semifinal 2", team1_id: "tm-2", team2_id: "tm-3", team1_score: 0, team2_score: 0, winner_id: null, status: "Scheduled" },
    { id: "m-107", eventId: "evt-1", round: 3, match_name: "Championship Final", team1_id: "tm-1", team2_id: null, team1_score: 0, team2_score: 0, winner_id: null, status: "Scheduled" }
  ]
};

async function seedMongoInitialData() {
  await EventModel.insertMany(defaultData.events);
  await TeamModel.insertMany(defaultData.teams);
  await MatchModel.insertMany(defaultData.matches);
  console.log("🌱 MongoDB seeded with initial tournament data.");
}

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
  const sorted = [...teamList].sort((a, b) => (b.skill_rating || 1200) - (a.skill_rating || 1200));
  const rounds = [
    {
      round_number: 1,
      round_name: "Quarterfinals",
      matches: [
        { match_id: "R1-M1", round: 1, round_name: "Quarterfinal 1", team1: sorted[0], team2: sorted[7], ai_insights: { team1_win_probability: 0.85, team2_win_probability: 0.15, predicted_winner_id: sorted[0]?.id } },
        { match_id: "R1-M2", round: 1, round_name: "Quarterfinal 2", team1: sorted[3], team2: sorted[4], ai_insights: { team1_win_probability: 0.54, team2_win_probability: 0.46, predicted_winner_id: sorted[3]?.id } },
        { match_id: "R1-M3", round: 1, round_name: "Quarterfinal 3", team1: sorted[1], team2: sorted[6], ai_insights: { team1_win_probability: 0.78, team2_win_probability: 0.22, predicted_winner_id: sorted[1]?.id } },
        { match_id: "R1-M4", round: 1, round_name: "Quarterfinal 4", team1: sorted[2], team2: sorted[5], ai_insights: { team1_win_probability: 0.62, team2_win_probability: 0.38, predicted_winner_id: sorted[2]?.id } },
      ]
    },
    {
      round_number: 2,
      round_name: "Semifinals",
      matches: [
        { match_id: "R2-M1", round: 2, round_name: "Semifinal 1", team1: null, team2: null, ai_insights: { team1_win_probability: 0.5, team2_win_probability: 0.5 } },
        { match_id: "R2-M2", round: 2, round_name: "Semifinal 2", team1: null, team2: null, ai_insights: { team1_win_probability: 0.5, team2_win_probability: 0.5 } },
      ]
    },
    {
      round_number: 3,
      round_name: "Finals",
      matches: [
        { match_id: "R3-M1", round: 3, round_name: "Grand Final", team1: null, team2: null, ai_insights: { team1_win_probability: 0.5, team2_win_probability: 0.5 } }
      ]
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
      const rating = t.skill_rating + (t.wins * 25) - (t.losses * 15) + (diff * 0.5);
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

app.listen(PORT, () => {
  console.log(`🚀 Express Server running on port ${PORT}.`);
});
