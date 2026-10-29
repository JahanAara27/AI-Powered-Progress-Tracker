from __future__ import annotations
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from app.schemas import DailyActivityRecord

MIN_REQUIRED_RECORDS = 3

FEATURE_COLUMNS_CONSISTENCY = [
    "rate_7d",
    "rate_14d",
    "rate_30d",
    "avg_rate",
    "std_rate",
    "activity_variance",
    "current_streak",
    "longest_streak",
    "missed_days_count",
    "days_since_last_checkin",
    "weekly_frequency",
    "recent_trend",
    "practice_minutes_avg"
]

FEATURE_COLUMNS_GOAL = [
    "rate_7d",
    "rate_14d",
    "rate_30d",
    "avg_rate",
    "current_streak",
    "milestone_completion_ratio",
    "goal_days_remaining",
    "velocity_ratio",
    "practice_minutes_avg",
    "recent_trend"
]

def preprocess_activities(records: List[DailyActivityRecord]) -> pd.DataFrame:
    if not records:
        return pd.DataFrame()
    
    data = [r.model_dump() for r in records]
    df = pd.DataFrame(data)
    
    # Clean and parse date
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])
    
    if df.empty:
        return pd.DataFrame()
        
    # Sort chronologically and drop duplicates keeping the last
    df = df.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    
    # Fill defaults
    df["total_habits"] = df["total_habits"].fillna(0).astype(int)
    df["completed_habits"] = df["completed_habits"].fillna(0).astype(int)
    df["missed_habits"] = df["missed_habits"].fillna(0).astype(int)
    df["completion_rate"] = df["completion_rate"].clip(0.0, 1.0)
    df["practice_minutes"] = df["practice_minutes"].fillna(0.0).clip(lower=0.0)
    df["current_streak"] = df["current_streak"].fillna(0).astype(int)
    
    return df

def extract_consistency_features(records: List[DailyActivityRecord], reference_date: datetime = None) -> Tuple[pd.DataFrame, Dict[str, Any], bool]:
    df = preprocess_activities(records)
    
    if len(df) < MIN_REQUIRED_RECORDS:
        return pd.DataFrame(), {}, True
        
    if reference_date is None:
        reference_date = df["date"].max()
    else:
        reference_date = pd.to_datetime(reference_date)
        if reference_date.tz is not None:
            reference_date = reference_date.tz_localize(None)

    # Filter out future records beyond reference_date to avoid data leakage
    df = df[df["date"] <= reference_date]
    if len(df) < MIN_REQUIRED_RECORDS:
        return pd.DataFrame(), {}, True

    # Rolling window subsets
    df_7d = df[df["date"] >= (reference_date - pd.Timedelta(days=7))]
    df_14d = df[df["date"] >= (reference_date - pd.Timedelta(days=14))]
    df_30d = df[df["date"] >= (reference_date - pd.Timedelta(days=30))]

    rate_7d = float(df_7d["completion_rate"].mean()) if not df_7d.empty else 0.0
    rate_14d = float(df_14d["completion_rate"].mean()) if not df_14d.empty else 0.0
    rate_30d = float(df_30d["completion_rate"].mean()) if not df_30d.empty else 0.0
    
    avg_rate = float(df["completion_rate"].mean())
    std_rate = float(df["completion_rate"].std()) if len(df) > 1 else 0.0
    if np.isnan(std_rate):
        std_rate = 0.0
    activity_variance = float(std_rate ** 2)

    # Streaks calculation
    current_streak = int(df.iloc[-1]["current_streak"])
    longest_streak = int(df["current_streak"].max()) if "current_streak" in df else current_streak
    
    # Days since last check-in
    last_active_date = df[df["completed_habits"] > 0]["date"].max()
    if pd.isna(last_active_date):
        days_since_last_checkin = 30.0
    else:
        days_since_last_checkin = float(max(0, (reference_date - last_active_date).days))

    # Missed days in the last 30 days
    if not df_30d.empty:
        missed_days_count = int((df_30d["completed_habits"] == 0).sum() + df_30d["missed_habits"].sum())
    else:
        missed_days_count = 0

    # Weekly frequency: active check-in days in last 14 days normalized to 7 days
    active_days_14d = int((df_14d["completed_habits"] > 0).sum()) if not df_14d.empty else 0
    weekly_frequency = min(7.0, (active_days_14d / 14.0) * 7.0 if len(df_14d) > 0 else 0.0)

    # Recent activity trend (7d vs 30d)
    recent_trend = float(rate_7d - (rate_30d if not df_30d.empty else avg_rate))

    # Average practice minutes
    practice_minutes_avg = float(df_14d["practice_minutes"].mean()) if not df_14d.empty else float(df["practice_minutes"].mean())

    feature_dict = {
        "rate_7d": round(rate_7d, 4),
        "rate_14d": round(rate_14d, 4),
        "rate_30d": round(rate_30d, 4),
        "avg_rate": round(avg_rate, 4),
        "std_rate": round(std_rate, 4),
        "activity_variance": round(activity_variance, 4),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "missed_days_count": missed_days_count,
        "days_since_last_checkin": days_since_last_checkin,
        "weekly_frequency": round(weekly_frequency, 2),
        "recent_trend": round(recent_trend, 4),
        "practice_minutes_avg": round(practice_minutes_avg, 2)
    }

    feature_df = pd.DataFrame([feature_dict])[FEATURE_COLUMNS_CONSISTENCY]
    return feature_df, feature_dict, False

def extract_goal_features(
    records: List[DailyActivityRecord],
    target_date_str: str,
    created_at_str: Optional[str],
    total_milestones: int,
    completed_milestones: int,
    reference_date: datetime = None
) -> Tuple[pd.DataFrame, Dict[str, Any], bool]:
    df = preprocess_activities(records)
    
    if reference_date is None:
        reference_date = pd.Timestamp.now("UTC").tz_localize(None)
    else:
        reference_date = pd.to_datetime(reference_date)
        if reference_date.tz is not None:
            reference_date = reference_date.tz_localize(None)

    try:
        target_date = pd.to_datetime(target_date_str)
        if target_date.tz is not None:
            target_date = target_date.tz_localize(None)
    except Exception:
        target_date = reference_date + pd.Timedelta(days=30)
        
    try:
        created_at = pd.to_datetime(created_at_str) if created_at_str else (reference_date - pd.Timedelta(days=14))
        if created_at.tz is not None:
            created_at = created_at.tz_localize(None)
    except Exception:
        created_at = reference_date - pd.Timedelta(days=14)

    # Days remaining until deadline
    goal_days_remaining = max(0, (target_date - reference_date).days)
    total_goal_span = max(1, (target_date - created_at).days)
    days_elapsed = max(1, (reference_date - created_at).days)

    # Milestone ratio
    tot_milestones = max(1, total_milestones)
    milestone_completion_ratio = min(1.0, max(0.0, completed_milestones / tot_milestones))

    # Time ratio elapsed
    time_elapsed_ratio = min(1.0, days_elapsed / total_goal_span)
    velocity_ratio = round(milestone_completion_ratio / (time_elapsed_ratio + 1e-5), 4)

    # Habit activity features
    if len(df) >= MIN_REQUIRED_RECORDS:
        df = df[df["date"] <= reference_date]
        df_7d = df[df["date"] >= (reference_date - pd.Timedelta(days=7))]
        df_14d = df[df["date"] >= (reference_date - pd.Timedelta(days=14))]
        df_30d = df[df["date"] >= (reference_date - pd.Timedelta(days=30))]

        rate_7d = float(df_7d["completion_rate"].mean()) if not df_7d.empty else 0.0
        rate_14d = float(df_14d["completion_rate"].mean()) if not df_14d.empty else 0.0
        rate_30d = float(df_30d["completion_rate"].mean()) if not df_30d.empty else 0.0
        avg_rate = float(df["completion_rate"].mean())
        current_streak = int(df.iloc[-1]["current_streak"]) if not df.empty else 0
        recent_trend = float(rate_7d - (rate_30d if not df_30d.empty else avg_rate))
        practice_minutes_avg = float(df_14d["practice_minutes"].mean()) if not df_14d.empty else float(df["practice_minutes"].mean())
        is_insufficient = False
    else:
        # Default proxy if minimal habit activity yet
        rate_7d = 0.5
        rate_14d = 0.5
        rate_30d = 0.5
        avg_rate = 0.5
        current_streak = 0
        recent_trend = 0.0
        practice_minutes_avg = 15.0
        is_insufficient = False if (total_milestones > 0 and completed_milestones >= 0) else True

    feature_dict = {
        "rate_7d": round(rate_7d, 4),
        "rate_14d": round(rate_14d, 4),
        "rate_30d": round(rate_30d, 4),
        "avg_rate": round(avg_rate, 4),
        "current_streak": current_streak,
        "milestone_completion_ratio": round(milestone_completion_ratio, 4),
        "goal_days_remaining": goal_days_remaining,
        "velocity_ratio": min(5.0, velocity_ratio),
        "practice_minutes_avg": round(practice_minutes_avg, 2),
        "recent_trend": round(recent_trend, 4)
    }

    feature_df = pd.DataFrame([feature_dict])[FEATURE_COLUMNS_GOAL]
    return feature_df, feature_dict, is_insufficient
