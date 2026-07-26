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

// Elo probability helper
function getWinProb(r1 = 1200, r2 = 1200) {
  const p1 = 1.0 / (1.0 + Math.pow(10, (r2 - r1) / 400.0));
  return Math.round(p1 * 100) / 100;
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
  const { matchId, eventId, team1_id, team2_id, team1_score, team2_score, winner_id } = req.body;
  const s1 = parseInt(team1_score) || 0;
  const s2 = parseInt(team2_score) || 0;
  const targetEvt = eventId || "evt-1";
  
  if (isMongoConnected) {
    const match = await MatchModel.findOneAndUpdate(
      { id: matchId },
      {
        id: matchId,
        eventId: targetEvt,
        team1_id: team1_id,
        team2_id: team2_id,
        team1_score: s1,
        team2_score: s2,
        winner_id: winner_id,
        status: "Completed"
      },
      { new: true, upsert: true }
    );

    // Update Team W/L & Points in MongoDB
    if (winner_id === team1_id) {
      await TeamModel.findOneAndUpdate({ id: team1_id }, { $inc: { wins: 1, points_scored: s1, points_conceded: s2 } });
      if (team2_id) await TeamModel.findOneAndUpdate({ id: team2_id }, { $inc: { losses: 1, points_scored: s2, points_conceded: s1 } });
    } else if (winner_id === team2_id) {
      await TeamModel.findOneAndUpdate({ id: team2_id }, { $inc: { wins: 1, points_scored: s2, points_conceded: s1 } });
      if (team1_id) await TeamModel.findOneAndUpdate({ id: team1_id }, { $inc: { losses: 1, points_scored: s1, points_conceded: s2 } });
    }

    return res.json({ message: "Score updated successfully", match });
  }

  let match = db.matches.find(m => m.id === matchId);
  if (!match) {
    match = {
      id: matchId,
      eventId: targetEvt,
      team1_id,
      team2_id,
      team1_score: s1,
      team2_score: s2,
      winner_id,
      status: "Completed"
    };
    db.matches.push(match);
  } else {
    match.team1_score = s1;
    match.team2_score = s2;
    match.winner_id = winner_id;
    match.status = "Completed";
  }

  // Update in-memory team stats
  const t1 = db.teams.find(t => t.id === team1_id);
  const t2 = db.teams.find(t => t.id === team2_id);

  if (t1 && winner_id === t1.id) {
    t1.wins = (t1.wins || 0) + 1;
    t1.points_scored = (t1.points_scored || 0) + s1;
    t1.points_conceded = (t1.points_conceded || 0) + s2;
    if (t2) {
      t2.losses = (t2.losses || 0) + 1;
      t2.points_scored = (t2.points_scored || 0) + s2;
      t2.points_conceded = (t2.points_conceded || 0) + s1;
    }
  } else if (t2 && winner_id === t2.id) {
    t2.wins = (t2.wins || 0) + 1;
    t2.points_scored = (t2.points_scored || 0) + s2;
    t2.points_conceded = (t2.points_conceded || 0) + s1;
    if (t1) {
      t1.losses = (t1.losses || 0) + 1;
      t1.points_scored = (t1.points_scored || 0) + s1;
      t1.points_conceded = (t1.points_conceded || 0) + s2;
    }
  }

  saveDB(db);
  res.json({ message: "Score updated successfully", match });
});

// Proxy to FastAPI AI Service for Tournament Bracket Generation
app.post('/api/ai/generate-bracket', async (req, res) => {
  const { eventId } = req.body;
  const targetEvt = eventId || "evt-1";
  
  const eventTeams = isMongoConnected 
    ? await TeamModel.find({ eventId: targetEvt }) 
    : db.teams.filter(t => t.eventId === targetEvt);

  const eventMatches = isMongoConnected
    ? await MatchModel.find({ eventId: targetEvt })
    : db.matches.filter(m => m.eventId === targetEvt);

  const matchesMap = new Map(eventMatches.map(m => [m.id, m]));
  const teamsMap = new Map(eventTeams.map(t => [t.id, t]));

  if (!eventTeams || eventTeams.length === 0) {
    return res.json({
      rounds: [],
      ai_summary: "No teams registered for this event yet. Please add teams in the Teams tab."
    });
  }

  let bracketRes;

  try {
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ai/generate-bracket`, {
      teams: eventTeams,
      format: "single_elimination",
      seed_by_ai_skill: true
    }, { timeout: 3000 });
    bracketRes = aiResponse.data;
  } catch (err) {
    console.log("FastAPI AI Service offline/unreachable, utilizing Node fallback bracket engine.");
    // Fallback bracket generation logic
    const sorted = [...eventTeams].sort((a, b) => (b.skill_rating || 1200) - (a.skill_rating || 1200));
    const r1 = [
      { match_id: "R1-M1", round: 1, round_name: "Quarterfinal 1", team1: sorted[0], team2: sorted[7] || null },
      { match_id: "R1-M2", round: 1, round_name: "Quarterfinal 2", team1: sorted[3], team2: sorted[4] || null },
      { match_id: "R1-M3", round: 1, round_name: "Quarterfinal 3", team1: sorted[1], team2: sorted[6] || null },
      { match_id: "R1-M4", round: 1, round_name: "Quarterfinal 4", team1: sorted[2], team2: sorted[5] || null },
    ];
    const r2 = [
      { match_id: "R2-M1", round: 2, round_name: "Semifinal 1", team1: null, team2: null },
      { match_id: "R2-M2", round: 2, round_name: "Semifinal 2", team1: null, team2: null },
    ];
    const r3 = [
      { match_id: "R3-M1", round: 3, round_name: "Grand Final", team1: null, team2: null }
    ];
    bracketRes = {
      rounds: [
        { round_number: 1, round_name: "Quarterfinals", matches: r1 },
        { round_number: 2, round_name: "Semifinals", matches: r2 },
        { round_number: 3, round_name: "Finals", matches: r3 }
      ],
      ai_summary: "AI Skill Seeded Bracket Engine."
    };
  }

  // Populate saved match scores and calculate winner progression across rounds
  if (bracketRes && bracketRes.rounds) {
    // Process round by round
    for (let rIdx = 0; rIdx < bracketRes.rounds.length; rIdx++) {
      const currentRound = bracketRes.rounds[rIdx];
      const nextRound = bracketRes.rounds[rIdx + 1];

      currentRound.matches.forEach((m, mIdx) => {
        const saved = matchesMap.get(m.match_id);
        if (saved) {
          m.team1_score = saved.team1_score;
          m.team2_score = saved.team2_score;
          m.winner_id = saved.winner_id;
          m.status = saved.status;
        }

        // If this match has a winner, advance team to the next round match slot!
        if (m.winner_id && nextRound) {
          const winnerTeam = teamsMap.get(m.winner_id) || (m.team1?.id === m.winner_id ? m.team1 : m.team2);
          const nextMatchIndex = Math.floor(mIdx / 2);
          const isSecondSlot = mIdx % 2 === 1;

          if (nextRound.matches[nextMatchIndex]) {
            const targetMatch = nextRound.matches[nextMatchIndex];
            if (isSecondSlot) {
              targetMatch.team2 = winnerTeam;
            } else {
              targetMatch.team1 = winnerTeam;
            }
            // Recalculate AI probabilities for advanced matchup
            if (targetMatch.team1 && targetMatch.team2) {
              const p1 = getWinProb(targetMatch.team1.skill_rating || 1200, targetMatch.team2.skill_rating || 1200);
              targetMatch.ai_insights = {
                team1_win_probability: p1,
                team2_win_probability: Math.round((1 - p1) * 100) / 100
              };
            }
          }
        }
      });
    }
  }

  return res.json(bracketRes);
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
