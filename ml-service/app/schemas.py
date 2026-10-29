from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DailyActivityRecord(BaseModel):
    date: str
    total_habits: int = Field(ge=0, default=0)
    completed_habits: int = Field(ge=0, default=0)
    missed_habits: int = Field(ge=0, default=0)
    completion_rate: float = Field(ge=0.0, le=1.0, default=0.0)
    practice_minutes: float = Field(ge=0.0, default=0.0)
    current_streak: int = Field(ge=0, default=0)

class HabitConsistencyRequest(BaseModel):
    user_id: str
    habits_count: int = Field(ge=0, default=1)
    historical_activities: List[DailyActivityRecord] = Field(default_factory=list)
    target_days: int = Field(default=7, ge=1, le=30)

class GoalCompletionRequest(BaseModel):
    user_id: str
    goal_id: Optional[str] = None
    title: Optional[str] = None
    target_date: str
    created_at: Optional[str] = None
    total_milestones: int = Field(ge=0, default=1)
    completed_milestones: int = Field(ge=0, default=0)
    historical_activities: List[DailyActivityRecord] = Field(default_factory=list)

class BatchPredictionRequest(BaseModel):
    consistency_requests: List[HabitConsistencyRequest] = Field(default_factory=list)
    goal_requests: List[GoalCompletionRequest] = Field(default_factory=list)

class PredictionResponse(BaseModel):
    prediction: Optional[float] = None
    category: str
    prediction_horizon: str
    contributing_factors: List[str]
    recommendations: List[str]
    model_version: str
    insufficient_data: bool = False
    metrics: Optional[Dict[str, Any]] = None

class BatchPredictionResponse(BaseModel):
    consistency_predictions: List[PredictionResponse]
    goal_predictions: List[PredictionResponse]

class ModelMetadata(BaseModel):
    model_name: str
    model_version: str
    algorithm: str
    training_date: str
    features: List[str]
    metrics: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    service: str
    models_loaded: Dict[str, bool]
