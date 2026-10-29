# ProgressIQ — Complete API Specification

All Main Backend endpoints are prefixed with `/api`. Protected routes require a Bearer token in the `Authorization` header: `Authorization: Bearer <jwt_token>`.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Create a new user account.
```json
// Request
{
  "name": "Jane Developer",
  "email": "jane@progressiq.dev",
  "password": "password123"
}

// Response (201 Created)
{
  "success": true,
  "user": {
    "id": "64f1c93a...",
    "name": "Jane Developer",
    "email": "jane@progressiq.dev",
    "createdAt": "2026-10-30T00:00:00.000Z"
  },
  "token": "eyJhbGciOi..."
}
```

### `POST /api/auth/login`
Authenticate with email and password.
```json
// Request
{
  "email": "jane@progressiq.dev",
  "password": "password123"
}

// Response (200 OK)
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOi..."
}
```

### `GET /api/auth/me` (Protected)
Retrieve authenticated user profile.

### `POST /api/auth/seed` (Protected)
Pre-populate realistic 14-day history with 4 habits, check-ins, and 2 active goals.

---

## 2. Habits Endpoints

### `POST /api/habits` (Protected)
Create a new habit.
```json
// Request
{
  "title": "Morning Deep Work",
  "description": "90 mins focused technical execution",
  "frequency": "daily"
}
```

### `GET /api/habits` (Protected)
Retrieve all user habits with calculated `currentStreak` and `longestStreak`.

### `PATCH /api/habits/:id` (Protected)
Update habit properties.

### `DELETE /api/habits/:id` (Protected)
Delete habit and its associated check-in history.

---

## 3. Check-ins Endpoints

### `POST /api/checkins` (Protected)
Record or update a check-in for a specific date.
```json
// Request
{
  "habitId": "64f1c93a...",
  "date": "2026-10-30",
  "status": "completed",
  "practiceMinutes": 45
}
```

### `GET /api/checkins?date=YYYY-MM-DD` (Protected)
Get check-ins for a specific day.

### `GET /api/checkins/history` (Protected)
Get chronological check-in history.

---

## 4. Goals Endpoints

### `POST /api/goals` (Protected)
Create a new personal goal with milestones.
```json
// Request
{
  "title": "Deploy Distributed Cluster",
  "description": "Kubernetes migration",
  "targetDate": "2026-12-15",
  "milestones": [
    { "title": "Terraform VPC Setup", "completed": true },
    { "title": "Deploy Ingress Controller", "completed": false }
  ]
}
```

### `GET /api/goals` (Protected)
Retrieve all user goals with calculated `completionPercentage` and `daysRemaining`.

### `PATCH /api/goals/:id` (Protected)
Update goal status or toggle milestone completion.

### `DELETE /api/goals/:id` (Protected)
Delete goal.

---

## 5. Analytics Endpoints

### `GET /api/analytics/dashboard` (Protected)
Returns overview KPI cards, 7-day velocity summary, and latest ML forecasts.

### `GET /api/analytics/weekly` (Protected)
Returns 7-day completion rates and daily practice duration distribution.

### `GET /api/analytics/monthly` (Protected)
Returns 30-day chronological completion trends, activity variance ($\sigma^2$), and missed check-in counts.

---

## 6. Prediction Endpoints

### `POST /api/predictions/consistency` (Protected)
Requests 7-day habit consistency prediction from the Python ML service.
```json
// Response (200 OK)
{
  "success": true,
  "prediction": {
    "prediction": 0.85,
    "category": "High",
    "prediction_horizon": "7 days",
    "contributing_factors": [
      "Strong 7-day completion rate (85%) establishing stable habits",
      "Solid active streak of 7 days providing positive momentum"
    ],
    "recommendations": [
      "Maintain your current pace and continue logging daily practice minutes"
    ],
    "model_version": "1.0-rf",
    "insufficient_data": false
  }
}
```

### `POST /api/predictions/goal` (Protected)
Requests goal completion prediction before deadline.
```json
// Request
{
  "goalId": "64f1c93a..."
}

// Response (200 OK)
{
  "success": true,
  "goal": { "id": "...", "title": "...", "targetDate": "..." },
  "prediction": {
    "prediction": 0.80,
    "category": "High",
    "prediction_horizon": "Target Date",
    "contributing_factors": [
      "Milestone completion progress is at 60%",
      "Pace ratio is ahead of schedule relative to elapsed calendar time"
    ],
    "recommendations": [
      "You are on track! Keep reviewing milestones weekly"
    ],
    "model_version": "1.0-rf",
    "insufficient_data": false
  }
}
```

### `GET /api/predictions/history` (Protected)
Retrieve stored prediction audit logs from MongoDB.

---

## 7. Python FastAPI Endpoints (Direct ML Service)

- `GET /health`: Health status & loaded model verification
- `POST /predict/consistency`: Computes habit consistency probability
- `POST /predict/goal`: Computes goal completion probability
- `POST /predict/batch`: Batch inference for multiple users/goals
- `GET /model/info`: Model metadata, versioning, and feature importances
