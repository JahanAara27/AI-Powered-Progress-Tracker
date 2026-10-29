from __future__ import annotations
from typing import Dict, Any, List, Tuple
import pandas as pd
from app.schemas import PredictionResponse
from app.model_loader import registry

TupleList = Tuple[List[str], List[str]]

def generate_consistency_factors(features: Dict[str, Any], prob: float) -> TupleList:
    factors = []
    recommendations = []
    
    rate_7d = features.get("rate_7d", 0.0)
    rate_30d = features.get("rate_30d", 0.0)
    current_streak = features.get("current_streak", 0)
    missed_days = features.get("missed_days_count", 0)
    variance = features.get("activity_variance", 0.0)
    recent_trend = features.get("recent_trend", 0.0)
    days_since_checkin = features.get("days_since_last_checkin", 0)

    # Contributing factors
    if rate_7d >= 0.8:
        factors.append(f"Strong 7-day completion rate ({round(rate_7d * 100)}%) establishing stable habits")
    elif rate_7d >= 0.5:
        factors.append(f"Moderate 7-day completion rate ({round(rate_7d * 100)}%) with room for stabilization")
    else:
        factors.append(f"Low recent completion rate ({round(rate_7d * 100)}%) in the last 7 days")

    if current_streak >= 5:
        factors.append(f"Solid active streak of {current_streak} days providing positive momentum")
    elif current_streak == 0:
        factors.append("No active streak currently recorded; break in continuity")

    if recent_trend > 0.1:
        factors.append("Positive upward momentum: 7-day rate outperforms 30-day baseline")
    elif recent_trend < -0.15:
        factors.append("Recent downward drift: 7-day completion dropped below monthly baseline")

    if missed_days >= 5:
        factors.append(f"High number of missed check-ins ({missed_days} recently) disrupting habit retention")

    if variance > 0.15:
        factors.append("Elevated activity variance indicates irregular day-to-day commitment")
    elif variance < 0.05 and rate_7d > 0.6:
        factors.append("Low activity variance shows high discipline and routine consistency")

    # Recommendations
    if days_since_checkin > 1:
        recommendations.append("Log today's check-in immediately to reset your streak momentum")
    if variance > 0.12:
        recommendations.append("Establish a fixed daily time window (e.g. 8:00 AM) to reduce activity variance")
    if rate_7d < 0.6:
        recommendations.append("Focus on micro-habits: complete at least 1 core habit daily before scaling up")
    if current_streak < 3:
        recommendations.append("Aim for a 3-day consecutive streak target to build neurological habit loops")
    if not recommendations:
        recommendations.append("Maintain your current pace and continue logging daily practice minutes")
        recommendations.append("Gradually raise practice duration by 5-10 minutes to deepen mastery")

    return factors[:4], recommendations[:3]

def generate_goal_factors(features: Dict[str, Any], prob: float) -> TupleList:
    factors = []
    recommendations = []

    milestone_ratio = features.get("milestone_completion_ratio", 0.0)
    days_remaining = features.get("goal_days_remaining", 0)
    velocity = features.get("velocity_ratio", 1.0)
    rate_7d = features.get("rate_7d", 0.5)

    # Factors
    factors.append(f"Milestone completion progress is at {round(milestone_ratio * 100)}%")
    if days_remaining <= 7 and milestone_ratio < 0.8:
        factors.append(f"Urgent timeline constraint: only {days_remaining} days left until deadline")
    elif days_remaining > 0:
        factors.append(f"{days_remaining} days remaining until target completion date")

    if velocity >= 1.1:
        factors.append("Pace ratio is ahead of schedule relative to elapsed calendar time")
    elif velocity < 0.7:
        factors.append("Milestone velocity is trailing behind the linear timeline schedule")

    if rate_7d >= 0.75:
        factors.append("High daily habit completion supports successful goal execution")
    elif rate_7d < 0.4:
        factors.append("Low daily habit engagement hinders milestone execution velocity")

    # Recommendations
    if velocity < 0.8 and days_remaining > 0:
        recommendations.append("Break down pending milestones into smaller, 2-day actionable micro-tasks")
    if days_remaining <= 14 and milestone_ratio < 0.7:
        recommendations.append("Prioritize the highest-impact milestone and defer secondary activities")
    if rate_7d < 0.6:
        recommendations.append("Link goal milestone tasks to daily habit check-ins for steady progress")
    if not recommendations:
        recommendations.append("You are on track! Keep reviewing milestone milestones weekly")

    return factors[:4], recommendations[:3]

# Type alias
TupleList = tuple[List[str], List[str]]

def classify_probability(prob: float) -> str:
    if prob >= 0.75:
        return "High"
    elif prob >= 0.45:
        return "Moderate"
    else:
        return "Low"

def predict_consistency(feature_df: pd.DataFrame, feature_dict: Dict[str, Any], is_insufficient: bool) -> PredictionResponse:
    if is_insufficient or feature_df.empty:
        return PredictionResponse(
            prediction=None,
            category="Insufficient Data",
            prediction_horizon="7 days",
            contributing_factors=[
                "Insufficient historical activity records (minimum 3 daily check-ins required)",
                "Model requires active tracking history to detect patterns"
            ],
            recommendations=[
                "Log your daily habit check-ins for at least 3 to 7 consecutive days",
                "Ensure both completed and missed habits are recorded accurately"
            ],
            model_version="1.0-rf",
            insufficient_data=True,
            metrics={"required_records": 3, "provided_records": len(feature_df)}
        )

    model, meta = registry.get_consistency_model()
    if model is not None:
        try:
            prob = float(model.predict_proba(feature_df)[0][1])
        except Exception as e:
            print(f"Inference error in consistency model: {e}")
            # Fallback heuristic using weighted features
            prob = float(min(1.0, max(0.0, 0.45 * feature_dict.get("rate_7d", 0.5) + 0.3 * feature_dict.get("rate_30d", 0.5) + 0.15 * min(1.0, feature_dict.get("current_streak", 0) / 7.0) - 0.1 * feature_dict.get("activity_variance", 0.1))))
    else:
        # Calibrated heuristic if model not trained yet
        prob = float(min(1.0, max(0.0, 0.5 * feature_dict.get("rate_7d", 0.5) + 0.3 * feature_dict.get("rate_30d", 0.5) + 0.2 * min(1.0, feature_dict.get("current_streak", 0) / 7.0))))

    prob = round(prob, 2)
    category = classify_probability(prob)
    factors, recs = generate_consistency_factors(feature_dict, prob)
    version = meta.get("model_version", "1.0-rf")

    return PredictionResponse(
        prediction=prob,
        category=category,
        prediction_horizon="7 days",
        contributing_factors=factors,
        recommendations=recs,
        model_version=version,
        insufficient_data=False,
        metrics=feature_dict
    )

def predict_goal(feature_df: pd.DataFrame, feature_dict: Dict[str, Any], is_insufficient: bool) -> PredictionResponse:
    if is_insufficient:
        return PredictionResponse(
            prediction=None,
            category="Insufficient Data",
            prediction_horizon="Target Date",
            contributing_factors=[
                "Goal milestone parameters are not yet defined",
                "Requires at least 1 milestone to calculate completion probability"
            ],
            recommendations=[
                "Define at least 1 milestone for this goal",
                "Check off completed milestones as you make progress"
            ],
            model_version="1.0-rf",
            insufficient_data=True,
            metrics=feature_dict
        )

    model, meta = registry.get_goal_model()
    if model is not None:
        try:
            prob = float(model.predict_proba(feature_df)[0][1])
        except Exception as e:
            print(f"Inference error in goal model: {e}")
            prob = float(min(1.0, max(0.0, 0.55 * feature_dict.get("milestone_completion_ratio", 0.0) + 0.25 * min(1.0, feature_dict.get("velocity_ratio", 1.0)) + 0.2 * feature_dict.get("rate_7d", 0.5))))
    else:
        prob = float(min(1.0, max(0.0, 0.6 * feature_dict.get("milestone_completion_ratio", 0.0) + 0.25 * min(1.0, feature_dict.get("velocity_ratio", 1.0)) + 0.15 * feature_dict.get("rate_7d", 0.5))))

    prob = round(prob, 2)
    category = classify_probability(prob)
    factors, recs = generate_goal_factors(feature_dict, prob)
    version = meta.get("model_version", "1.0-rf")

    return PredictionResponse(
        prediction=prob,
        category=category,
        prediction_horizon="Target Date",
        contributing_factors=factors,
        recommendations=recs,
        model_version=version,
        insufficient_data=False,
        metrics=feature_dict
    )
