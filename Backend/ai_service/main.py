import math
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Sports Event Manager - AI Service",
    description="AI Microservice for Tournament Bracket Generation and Dynamic Skill Ranking",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TeamInput(BaseModel):
    id: str
    name: str
    seed: Optional[int] = None
    skill_rating: Optional[float] = 1200.0
    wins: Optional[int] = 0
    losses: Optional[int] = 0
    points_scored: Optional[int] = 0
    points_conceded: Optional[int] = 0

class BracketRequest(BaseModel):
    teams: List[TeamInput]
    format: Optional[str] = "single_elimination" # single_elimination, round_robin
    seed_by_ai_skill: Optional[bool] = True

class MatchResult(BaseModel):
    id: str
    team1_id: str
    team2_id: str
    team1_score: int
    team2_score: int
    winner_id: str

class RankingRequest(BaseModel):
    teams: List[TeamInput]
    matches: List[MatchResult]
    k_factor: Optional[float] = 32.0


def calculate_win_probability(rating_a: float, rating_b: float) -> float:
    """Elo probability formula: P(A beats B)"""
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400.0))


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Sports Event Manager AI Service",
        "features": ["auto_tournament_bracket_gen", "ranking_calculator"]
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ai/generate-bracket")
def generate_bracket(req: BracketRequest):
    if not req.teams or len(req.teams) < 2:
        raise HTTPException(status_code=400, detail="At least 2 teams are required to generate a bracket.")

    teams_data = [t.dict() for t in req.teams]

    # Seed teams using AI skill rating or explicit seed
    if req.seed_by_ai_skill:
        teams_sorted = sorted(teams_data, key=lambda x: x.get('skill_rating', 1200), reverse=True)
    else:
        teams_sorted = sorted(teams_data, key=lambda x: x.get('seed', 999))

    for idx, team in enumerate(teams_sorted):
        team['assigned_seed'] = idx + 1

    num_teams = len(teams_sorted)
    
    # Calculate next power of 2 for standard single elimination
    next_pow2 = 1 << (num_teams - 1).bit_length() if num_teams > 1 else 2
    byes_needed = next_pow2 - num_teams

    # Pairings logic for seeded bracket (1 vs N, 2 vs N-1, etc.)
    # Standard bracket seeding placement
    seeded_slots = [None] * next_pow2
    
    # Fill slots with standard seeding algorithm
    def get_seed_order(n):
        if n == 1:
            return [1]
        half = get_seed_order(n // 2)
        res = []
        for s in half:
            res.append(s)
            res.append(n + 1 - s)
        return res

    seed_order = get_seed_order(next_pow2)
    
    team_by_seed = {t['assigned_seed']: t for t in teams_sorted}

    first_round_matches = []
    match_counter = 1

    for i in range(0, next_pow2, 2):
        s1 = seed_order[i]
        s2 = seed_order[i+1]
        
        t1 = team_by_seed.get(s1)
        t2 = team_by_seed.get(s2)

        p1_win_prob = 0.5
        p2_win_prob = 0.5
        predicted_winner = None

        if t1 and t2:
            rating1 = t1.get('skill_rating', 1200)
            rating2 = t2.get('skill_rating', 1200)
            p1_win_prob = round(calculate_win_probability(rating1, rating2), 3)
            p2_win_prob = round(1.0 - p1_win_prob, 3)
            predicted_winner = t1['id'] if p1_win_prob >= 0.5 else t2['id']
        elif t1:
            p1_win_prob = 1.0
            p2_win_prob = 0.0
            predicted_winner = t1['id']

        first_round_matches.append({
            "match_id": f"R1-M{match_counter}",
            "round": 1,
            "round_name": "Quarter Finals" if next_pow2 == 8 else ("Semi Finals" if next_pow2 == 4 else f"Round of {next_pow2}"),
            "team1": t1,
            "team2": t2,
            "is_bye": t2 is None,
            "ai_insights": {
                "team1_win_probability": p1_win_prob,
                "team2_win_probability": p2_win_prob,
                "predicted_winner_id": predicted_winner,
                "confidence": max(p1_win_prob, p2_win_prob)
            }
        })
        match_counter += 1

    total_rounds = int(math.log2(next_pow2))
    
    rounds = [
        {
            "round_number": 1,
            "round_name": "Round 1" if total_rounds > 3 else ("Quarterfinals" if total_rounds == 3 else "Semifinals"),
            "matches": first_round_matches
        }
    ]

    # Generate placeholder rounds for progression visualization
    prev_matches_count = len(first_round_matches)
    for r in range(2, total_rounds + 1):
        matches_in_round = prev_matches_count // 2
        r_name = "Finals" if r == total_rounds else ("Semifinals" if r == total_rounds - 1 else f"Round {r}")
        round_matches = []
        for m in range(1, matches_in_round + 1):
            round_matches.append({
                "match_id": f"R{r}-M{m}",
                "round": r,
                "round_name": r_name,
                "team1": None,
                "team2": None,
                "is_bye": False,
                "ai_insights": {
                    "team1_win_probability": 0.5,
                    "team2_win_probability": 0.5,
                    "predicted_winner_id": None,
                    "confidence": 0.5
                }
            })
        rounds.append({
            "round_number": r,
            "round_name": r_name,
            "matches": round_matches
        })
        prev_matches_count = matches_in_round

    return {
        "tournament_structure": {
            "total_teams": num_teams,
            "bracket_size": next_pow2,
            "byes": byes_needed,
            "total_rounds": total_rounds,
            "format": req.format
        },
        "rounds": rounds,
        "ai_summary": f"Bracket optimized by AI Skill Seeding. Generated {total_rounds} rounds with {num_teams} teams."
    }


@app.post("/ai/calculate-rankings")
def calculate_rankings(req: RankingRequest):
    # Map teams by ID
    teams_dict = {
        t.id: {
            "id": t.id,
            "name": t.name,
            "rating": t.skill_rating if t.skill_rating else 1200.0,
            "initial_rating": t.skill_rating if t.skill_rating else 1200.0,
            "wins": t.wins or 0,
            "losses": t.losses or 0,
            "points_scored": t.points_scored or 0,
            "points_conceded": t.points_conceded or 0,
            "win_streak": 0,
            "matches_played": 0
        }
        for t in req.teams
    }

    # Process match results to update Elo rating & stats
    for m in req.matches:
        if m.team1_id not in teams_dict or m.team2_id not in teams_dict:
            continue
        
        t1 = teams_dict[m.team1_id]
        t2 = teams_dict[m.team2_id]

        r1 = t1["rating"]
        r2 = t2["rating"]

        p1 = calculate_win_probability(r1, r2)
        p2 = 1.0 - p1

        # Actual result
        if m.winner_id == t1["id"]:
            s1, s2 = 1.0, 0.0
            t1["wins"] += 1
            t2["losses"] += 1
            t1["win_streak"] += 1
            t2["win_streak"] = 0
        elif m.winner_id == t2["id"]:
            s1, s2 = 0.0, 1.0
            t2["wins"] += 1
            t1["losses"] += 1
            t2["win_streak"] += 1
            t1["win_streak"] = 0
        else:
            s1, s2 = 0.5, 0.5

        # Margin multiplier to reward decisive victories
        score_diff = abs(m.team1_score - m.team2_score)
        margin_multiplier = math.log(max(score_diff, 1) + 1.0)

        # Dynamic Elo adjustment
        k = req.k_factor * margin_multiplier
        t1["rating"] += k * (s1 - p1)
        t2["rating"] += k * (s2 - p2)

        t1["points_scored"] += m.team1_score
        t1["points_conceded"] += m.team2_score
        t2["points_scored"] += m.team2_score
        t2["points_conceded"] += m.team1_score

        t1["matches_played"] += 1
        t2["matches_played"] += 1

    # Format AI Rankings response
    ranked_teams = list(teams_dict.values())
    for item in ranked_teams:
        item["rating"] = round(item["rating"], 1)
        item["rating_change"] = round(item["rating"] - item["initial_rating"], 1)
        item["point_difference"] = item["points_scored"] - item["points_conceded"]
        
        # Calculate AI Performance Index (0-100)
        win_rate = item["wins"] / max(item["matches_played"], 1)
        base_perf = min(100, max(0, (item["rating"] - 800) / 10))
        item["ai_performance_index"] = round((base_perf * 0.7) + (win_rate * 30), 1)

    # Sort by AI Rating
    ranked_teams.sort(key=lambda x: x["rating"], reverse=True)

    for rank_idx, item in enumerate(ranked_teams):
        item["rank"] = rank_idx + 1

    return {
        "rankings": ranked_teams,
        "total_processed_matches": len(req.matches),
        "ai_model": "Dynamic Margin-Adjusted Elo & Performance Index Engine v1.0"
    }
