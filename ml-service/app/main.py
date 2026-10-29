from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from app.schemas import (
    HabitConsistencyRequest,
    GoalCompletionRequest,
    BatchPredictionRequest,
    PredictionResponse,
    BatchPredictionResponse,
    HealthResponse
)
from app.features import extract_consistency_features, extract_goal_features
from app.predict import predict_consistency, predict_goal
from app.model_loader import registry

app = FastAPI(
    title="ProgressIQ Machine Learning Service",
    description="Dedicated predictive intelligence API for habit consistency and goal completion",
    version="1.0.0"
)

# CORS middleware for local development and inter-service calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="healthy",
        service="ProgressIQ ML Service",
        models_loaded=registry.status()
    )

@app.post("/predict/consistency", response_model=PredictionResponse)
def predict_habit_consistency(req: HabitConsistencyRequest):
    try:
        feature_df, feature_dict, is_insufficient = extract_consistency_features(req.historical_activities)
        response = predict_consistency(feature_df, feature_dict, is_insufficient)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Consistency prediction failed: {str(e)}")

@app.post("/predict/goal", response_model=PredictionResponse)
def predict_goal_completion(req: GoalCompletionRequest):
    try:
        feature_df, feature_dict, is_insufficient = extract_goal_features(
            records=req.historical_activities,
            target_date_str=req.target_date,
            created_at_str=req.created_at,
            total_milestones=req.total_milestones,
            completed_milestones=req.completed_milestones
        )
        response = predict_goal(feature_df, feature_dict, is_insufficient)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Goal completion prediction failed: {str(e)}")

@app.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(req: BatchPredictionRequest):
    consistency_preds = []
    goal_preds = []

    for c_req in req.consistency_requests:
        feature_df, feature_dict, is_insufficient = extract_consistency_features(c_req.historical_activities)
        consistency_preds.append(predict_consistency(feature_df, feature_dict, is_insufficient))

    for g_req in req.goal_requests:
        feature_df, feature_dict, is_insufficient = extract_goal_features(
            records=g_req.historical_activities,
            target_date_str=g_req.target_date,
            created_at_str=g_req.created_at,
            total_milestones=g_req.total_milestones,
            completed_milestones=g_req.completed_milestones
        )
        goal_preds.append(predict_goal(feature_df, feature_dict, is_insufficient))

    return BatchPredictionResponse(
        consistency_predictions=consistency_preds,
        goal_predictions=goal_preds
    )

@app.get("/model/info")
def model_info():
    _, consistency_meta = registry.get_consistency_model()
    _, goal_meta = registry.get_goal_model()
    return {
        "service": "ProgressIQ Predictive Intelligence Engine",
        "loaded_models": registry.status(),
        "consistency_model": consistency_meta if consistency_meta else {"status": "not_loaded"},
        "goal_model": goal_meta if goal_meta else {"status": "not_loaded"}
    }
