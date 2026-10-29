import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

# Fix seed for reproducibility
np.random.seed(42)
random.seed(42)

OUTPUT_DIR = Path(__file__).resolve().parent

def generate_synthetic_user_history(user_id: str, persona: str, num_days: int = 90, start_date: datetime = None):
    if start_date is None:
        start_date = datetime(2026, 1, 1)

    records = []
    current_streak = 0
    
    # Baseline probabilities per persona
    if persona == "consistent":
        base_rate = 0.88
        variance = 0.08
        base_minutes = 45
    elif persona == "improver":
        base_rate = 0.35  # grows daily
        variance = 0.12
        base_minutes = 25
    elif persona == "erratic":
        base_rate = 0.52
        variance = 0.25
        base_minutes = 30
    elif persona == "declining":
        base_rate = 0.85  # decays daily
        variance = 0.15
        base_minutes = 40
    else: # struggling
        base_rate = 0.28
        variance = 0.10
        base_minutes = 15

    for day_idx in range(num_days):
        current_date = start_date + timedelta(days=day_idx)
        
        # Persona dynamic adjustment
        if persona == "improver":
            daily_mean = min(0.92, base_rate + (day_idx / num_days) * 0.55)
        elif persona == "declining":
            daily_mean = max(0.15, base_rate - (day_idx / num_days) * 0.65)
        else:
            daily_mean = base_rate

        # Day of week variation (e.g. erratic does better on weekends)
        is_weekend = current_date.weekday() >= 5
        if persona == "erratic" and is_weekend:
            daily_mean = min(0.90, daily_mean + 0.30)
        elif persona == "erratic" and not is_weekend:
            daily_mean = max(0.20, daily_mean - 0.15)

        total_habits = random.choice([3, 4, 5])
        prob = np.clip(np.random.normal(daily_mean, variance), 0.0, 1.0)
        completed_habits = int(round(prob * total_habits))
        missed_habits = total_habits - completed_habits
        completion_rate = completed_habits / total_habits

        if completed_habits > 0:
            current_streak += 1
            practice_minutes = max(10, int(np.random.normal(base_minutes, 10)))
        else:
            current_streak = 0
            practice_minutes = 0

        records.append({
            "user_id": user_id,
            "persona": persona,
            "date": current_date.strftime("%Y-%m-%d"),
            "total_habits": total_habits,
            "completed_habits": completed_habits,
            "missed_habits": missed_habits,
            "completion_rate": round(completion_rate, 4),
            "practice_minutes": practice_minutes,
            "current_streak": current_streak
        })

    return pd.DataFrame(records)

def extract_sliding_features(df_user: pd.DataFrame, cutoff_idx: int):
    # Past records up to cutoff_idx
    past_df = df_user.iloc[:cutoff_idx].copy()
    if len(past_df) < 14:
        return None

    future_df = df_user.iloc[cutoff_idx:cutoff_idx+7].copy()
    if len(future_df) < 7:
        return None

    # Future ground truth target for 7-day consistency (>= 70% avg completion)
    future_7d_rate = future_df["completion_rate"].mean()
    future_label_consistency = 1 if future_7d_rate >= 0.70 else 0

    # Extract historical features (strictly past data)
    past_df["date_dt"] = pd.to_datetime(past_df["date"])
    ref_date = past_df["date_dt"].max()

    df_7d = past_df[past_df["date_dt"] >= (ref_date - pd.Timedelta(days=7))]
    df_14d = past_df[past_df["date_dt"] >= (ref_date - pd.Timedelta(days=14))]
    df_30d = past_df[past_df["date_dt"] >= (ref_date - pd.Timedelta(days=30))]

    rate_7d = float(df_7d["completion_rate"].mean())
    rate_14d = float(df_14d["completion_rate"].mean())
    rate_30d = float(df_30d["completion_rate"].mean()) if not df_30d.empty else float(past_df["completion_rate"].mean())
    avg_rate = float(past_df["completion_rate"].mean())
    std_rate = float(past_df["completion_rate"].std()) if len(past_df) > 1 else 0.0
    activity_variance = float(std_rate ** 2)

    current_streak = int(past_df.iloc[-1]["current_streak"])
    longest_streak = int(past_df["current_streak"].max())
    
    last_active = past_df[past_df["completed_habits"] > 0]["date_dt"].max()
    days_since_checkin = float((ref_date - last_active).days) if pd.notna(last_active) else 30.0

    missed_days_count = int((df_30d["completed_habits"] == 0).sum() + df_30d["missed_habits"].sum()) if not df_30d.empty else 0
    active_days_14d = int((df_14d["completed_habits"] > 0).sum())
    weekly_frequency = min(7.0, (active_days_14d / 14.0) * 7.0)
    recent_trend = float(rate_7d - rate_30d)
    practice_minutes_avg = float(df_14d["practice_minutes"].mean())

    return {
        "rate_7d": round(rate_7d, 4),
        "rate_14d": round(rate_14d, 4),
        "rate_30d": round(rate_30d, 4),
        "avg_rate": round(avg_rate, 4),
        "std_rate": round(std_rate, 4),
        "activity_variance": round(activity_variance, 4),
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "missed_days_count": missed_days_count,
        "days_since_last_checkin": days_since_checkin,
        "weekly_frequency": round(weekly_frequency, 2),
        "recent_trend": round(recent_trend, 4),
        "practice_minutes_avg": round(practice_minutes_avg, 2),
        "label_consistency": future_label_consistency,
        "future_7d_rate": round(future_7d_rate, 4),
        "cutoff_date": ref_date.strftime("%Y-%m-%d")
    }

def generate_datasets(num_users: int = 160):
    personas = ["consistent", "improver", "erratic", "declining", "struggling"]
    all_daily_records = []
    consistency_features = []

    print(f"Generating synthetic daily records for {num_users} users across 90 days...")
    for u in range(num_users):
        user_id = f"user_{u+1:03d}"
        persona = personas[u % len(personas)]
        user_df = generate_synthetic_user_history(user_id, persona, num_days=90)
        all_daily_records.append(user_df)

        # Sliding window samples for this user
        for cutoff in range(21, 83, 7):
            feat = extract_sliding_features(user_df, cutoff)
            if feat:
                feat["user_id"] = user_id
                consistency_features.append(feat)

    daily_activity_master = pd.concat(all_daily_records, ignore_index=True)
    df_consistency = pd.DataFrame(consistency_features)

    # Generate goal dataset
    goal_records = []
    for u in range(num_users):
        user_id = f"user_{u+1:03d}"
        user_df = daily_activity_master[daily_activity_master["user_id"] == user_id]
        
        # Simulate 2-3 goals per user
        for g in range(random.choice([2, 3])):
            total_milestones = random.choice([3, 4, 5, 6])
            days_span = random.choice([30, 45, 60])
            elapsed_days = random.choice([10, 20, 30, 40])
            days_remaining = max(1, days_span - elapsed_days)

            # Habit backing performance
            user_habit_rate = float(user_df["completion_rate"].mean())
            current_streak = int(user_df["current_streak"].max())
            rate_7d = float(user_df.iloc[-7:]["completion_rate"].mean())
            rate_14d = float(user_df.iloc[-14:]["completion_rate"].mean())
            rate_30d = float(user_df.iloc[-30:]["completion_rate"].mean())
            avg_rate = user_habit_rate
            practice_minutes_avg = float(user_df.iloc[-14:]["practice_minutes"].mean())

            time_elapsed_ratio = elapsed_days / days_span
            
            # Milestone completion depends on habit discipline & time elapsed
            expected_milestones_ratio = np.clip(
                time_elapsed_ratio * (0.6 * user_habit_rate + 0.4) + np.random.normal(0, 0.1),
                0.0, 1.0
            )
            completed_milestones = int(round(expected_milestones_ratio * total_milestones))
            milestone_ratio = completed_milestones / total_milestones
            velocity_ratio = round(milestone_ratio / (time_elapsed_ratio + 1e-5), 4)

            # Future outcome: goal completed before deadline
            # High milestone ratio + good habit rate + sufficient remaining time -> 1
            projected_final_ratio = milestone_ratio + (days_remaining / days_span) * (user_habit_rate * 1.1)
            label_goal_completed = 1 if projected_final_ratio >= 0.95 else 0

            goal_records.append({
                "user_id": user_id,
                "goal_id": f"goal_{u+1}_{g+1}",
                "rate_7d": round(rate_7d, 4),
                "rate_14d": round(rate_14d, 4),
                "rate_30d": round(rate_30d, 4),
                "avg_rate": round(avg_rate, 4),
                "current_streak": current_streak,
                "milestone_completion_ratio": round(milestone_ratio, 4),
                "goal_days_remaining": days_remaining,
                "velocity_ratio": min(5.0, velocity_ratio),
                "practice_minutes_avg": round(practice_minutes_avg, 2),
                "recent_trend": round(rate_7d - rate_30d, 4),
                "total_milestones": total_milestones,
                "completed_milestones": completed_milestones,
                "label_goal_completed": label_goal_completed
            })

    df_goal = pd.DataFrame(goal_records)

    # Save to disk
    daily_path = OUTPUT_DIR / "synthetic_daily_activity.csv"
    consistency_path = OUTPUT_DIR / "habit_consistency_dataset.csv"
    goal_path = OUTPUT_DIR / "goal_completion_dataset.csv"

    daily_activity_master.to_csv(daily_path, index=False)
    df_consistency.to_csv(consistency_path, index=False)
    df_goal.to_csv(goal_path, index=False)

    print(f"Generated {len(daily_activity_master)} daily records.")
    print(f"Generated {len(df_consistency)} habit consistency training samples. Positive rate: {df_consistency['label_consistency'].mean():.2%}")
    print(f"Generated {len(df_goal)} goal completion training samples. Positive rate: {df_goal['label_goal_completed'].mean():.2%}")

if __name__ == "__main__":
    generate_datasets()
