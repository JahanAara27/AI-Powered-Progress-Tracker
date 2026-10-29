# ProgressIQ — Machine Learning Predictive Service

The **ProgressIQ ML Service** is a dedicated, production-style Python FastAPI microservice providing machine learning predictions for:
1. **Habit Consistency Prediction**: Estimates the probability (0-100%) of a user meeting their predefined habit frequency target over the next 7 days.
2. **Goal Completion Prediction**: Estimates the probability of achieving goal milestones before the designated deadline.

## Tech Stack
- **Python 3.11+**
- **FastAPI** + **Uvicorn**
- **Scikit-learn** (Logistic Regression baseline & Random Forest classifier)
- **Pandas** & **NumPy** for feature engineering & rolling statistics
- **Joblib** for model serialization
- **Pytest** for service test coverage

## Feature Engineering
The service extracts 13 key temporal, rolling, and behavioral features:
- `rate_7d`, `rate_14d`, `rate_30d`: Rolling habit completion rates
- `avg_rate`, `std_rate`, `activity_variance`: Long-term stability & variance
- `current_streak`, `longest_streak`: Consistency streak signals
- `missed_days_count`: Count of inactive days within the observation window
- `days_since_last_checkin`: Decay/recency indicator
- `weekly_frequency`: Active days per week
- `recent_trend`: Momentum indicator (`rate_7d - rate_30d`)
- `practice_minutes_avg`: Average daily engagement depth
- `milestone_completion_ratio` & `velocity_ratio`: Milestone completion pace relative to elapsed time

## API Endpoints
- `GET /health`: Health status & model loading verification
- `POST /predict/consistency`: 7-day habit consistency probability & factor analysis
- `POST /predict/goal`: Goal milestone completion probability & recommendations
- `POST /predict/batch`: High-throughput batch inference endpoint
- `GET /model/info`: Model metadata, version info, algorithm rationale, and metrics

## Run Locally
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train models (if not already trained)
python training/generate_data.py
python training/train_consistency.py
python training/train_goal.py

# 3. Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
