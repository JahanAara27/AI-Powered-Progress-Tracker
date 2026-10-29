import pytest
from app.main import (
    health,
    model_info,
    predict_habit_consistency,
    predict_goal_completion,
    predict_batch
)
from app.schemas import (
    DailyActivityRecord,
    HabitConsistencyRequest,
    GoalCompletionRequest,
    BatchPredictionRequest
)

def test_health():
    res = health()
    assert res.status == "healthy"
    assert "consistency_model" in res.models_loaded
    assert res.models_loaded["consistency_model"] is True
    assert res.models_loaded["goal_model"] is True

def test_model_info():
    info = model_info()
    assert info["loaded_models"]["consistency_model"] is True
    assert info["loaded_models"]["goal_model"] is True
    assert "consistency_model" in info
    assert "goal_model" in info

def test_consistency_insufficient_data():
    req = HabitConsistencyRequest(
        user_id="user_123",
        habits_count=2,
        historical_activities=[
            DailyActivityRecord(
                date="2026-10-28",
                total_habits=2,
                completed_habits=2,
                missed_habits=0,
                completion_rate=1.0,
                practice_minutes=25.0,
                current_streak=1
            )
        ]
    )
    res = predict_habit_consistency(req)
    assert res.insufficient_data is True
    assert res.category == "Insufficient Data"
    assert res.prediction is None
    assert len(res.contributing_factors) >= 1

def test_consistency_prediction_sufficient_data():
    records = []
    for i in range(12):
        records.append(
            DailyActivityRecord(
                date=f"2026-10-{10+i:02d}",
                total_habits=4,
                completed_habits=3 if i % 3 != 0 else 4,
                missed_habits=1 if i % 3 != 0 else 0,
                completion_rate=0.75 if i % 3 != 0 else 1.0,
                practice_minutes=35.0,
                current_streak=i + 1
            )
        )
    req = HabitConsistencyRequest(
        user_id="user_456",
        habits_count=4,
        historical_activities=records,
        target_days=7
    )
    res = predict_habit_consistency(req)
    assert res.insufficient_data is False
    assert res.prediction is not None
    assert 0.0 <= res.prediction <= 1.0
    assert res.category in ["Low", "Moderate", "High"]
    assert len(res.contributing_factors) > 0
    assert len(res.recommendations) > 0

def test_goal_prediction():
    records = [
        DailyActivityRecord(
            date=f"2026-10-{15+i:02d}",
            total_habits=3,
            completed_habits=3,
            missed_habits=0,
            completion_rate=1.0,
            practice_minutes=40.0,
            current_streak=i + 1
        )
        for i in range(6)
    ]
    req = GoalCompletionRequest(
        user_id="user_789",
        goal_id="goal_ml_1",
        title="Complete ML Project",
        target_date="2026-11-20",
        created_at="2026-10-01",
        total_milestones=5,
        completed_milestones=3,
        historical_activities=records
    )
    res = predict_goal_completion(req)
    assert res.insufficient_data is False
    assert res.prediction is not None
    assert 0.0 <= res.prediction <= 1.0
    assert len(res.contributing_factors) > 0
    assert len(res.recommendations) > 0

def test_batch_prediction():
    c_req = HabitConsistencyRequest(
        user_id="u1",
        historical_activities=[
            DailyActivityRecord(
                date=f"2026-10-{10+i:02d}",
                total_habits=2,
                completed_habits=2,
                completion_rate=1.0,
                practice_minutes=30.0,
                current_streak=i+1
            )
            for i in range(5)
        ]
    )
    g_req = GoalCompletionRequest(
        user_id="u1",
        target_date="2026-11-15",
        total_milestones=4,
        completed_milestones=2,
        historical_activities=c_req.historical_activities
    )
    batch_req = BatchPredictionRequest(
        consistency_requests=[c_req],
        goal_requests=[g_req]
    )
    batch_res = predict_batch(batch_req)
    assert len(batch_res.consistency_predictions) == 1
    assert len(batch_res.goal_predictions) == 1
    assert batch_res.consistency_predictions[0].prediction is not None
    assert batch_res.goal_predictions[0].prediction is not None
