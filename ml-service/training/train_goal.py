import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "training" / "goal_completion_dataset.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
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

def train_goal_model():
    print("Loading goal dataset from:", DATA_PATH)
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Goal dataset not found at {DATA_PATH}. Run generate_data.py first.")

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} goal samples. Features: {len(FEATURE_COLS)}")

    # Split chronologically by user order / time
    split_idx = int(len(df) * 0.8)

    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    X_train = train_df[FEATURE_COLS]
    y_train = train_df["label_goal_completed"]
    X_test = test_df[FEATURE_COLS]
    y_test = test_df["label_goal_completed"]

    print(f"Train samples: {len(X_train)} (Positive: {y_train.mean():.2%})")
    print(f"Test samples:  {len(X_test)} (Positive: {y_test.mean():.2%})")

    # 1. Baseline Model: Logistic Regression
    lr_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(random_state=42, max_iter=1000))
    ])
    lr_pipeline.fit(X_train, y_train)
    y_pred_lr = lr_pipeline.predict(X_test)
    y_prob_lr = lr_pipeline.predict_proba(X_test)[:, 1]

    lr_metrics = {
        "precision": float(round(precision_score(y_test, y_pred_lr, zero_division=0), 4)),
        "recall": float(round(recall_score(y_test, y_pred_lr, zero_division=0), 4)),
        "f1": float(round(f1_score(y_test, y_pred_lr, zero_division=0), 4)),
        "roc_auc": float(round(roc_auc_score(y_test, y_prob_lr), 4)),
        "confusion_matrix": confusion_matrix(y_test, y_pred_lr).tolist()
    }
    print("\n--- Baseline: Logistic Regression ---")
    print(f"Precision: {lr_metrics['precision']}, Recall: {lr_metrics['recall']}, F1: {lr_metrics['f1']}, ROC-AUC: {lr_metrics['roc_auc']}")

    # 2. Candidate Model: Random Forest Classifier
    rf_pipeline = Pipeline([
        ("classifier", RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            min_samples_split=4,
            random_state=42
        ))
    ])
    rf_pipeline.fit(X_train, y_train)
    y_pred_rf = rf_pipeline.predict(X_test)
    y_prob_rf = rf_pipeline.predict_proba(X_test)[:, 1]

    rf_metrics = {
        "precision": float(round(precision_score(y_test, y_pred_rf, zero_division=0), 4)),
        "recall": float(round(recall_score(y_test, y_pred_rf, zero_division=0), 4)),
        "f1": float(round(f1_score(y_test, y_pred_rf, zero_division=0), 4)),
        "roc_auc": float(round(roc_auc_score(y_test, y_prob_rf), 4)),
        "confusion_matrix": confusion_matrix(y_test, y_pred_rf).tolist()
    }
    print("\n--- Candidate: Random Forest Classifier ---")
    print(f"Precision: {rf_metrics['precision']}, Recall: {rf_metrics['recall']}, F1: {rf_metrics['f1']}, ROC-AUC: {rf_metrics['roc_auc']}")

    rf_model = rf_pipeline.named_steps["classifier"]
    feature_importances = dict(zip(FEATURE_COLS, [round(float(v), 4) for v in rf_model.feature_importances_]))

    if rf_metrics["f1"] >= lr_metrics["f1"]:
        selected_model = rf_pipeline
        selected_name = "RandomForestClassifier"
        selected_metrics = rf_metrics
        algorithm_choice = "Random Forest (Selected based on superior non-linear milestone interaction modeling)"
    else:
        selected_model = lr_pipeline
        selected_name = "LogisticRegression"
        selected_metrics = lr_metrics
        algorithm_choice = "Logistic Regression (Selected based on test performance)"

    model_save_path = MODELS_DIR / "goal_model.joblib"
    meta_save_path = MODELS_DIR / "goal_metadata.json"

    joblib.dump(selected_model, model_save_path)

    metadata = {
        "model_name": "GoalCompletionPredictor",
        "model_version": "1.0-rf",
        "selected_algorithm": selected_name,
        "algorithm_choice_rationale": algorithm_choice,
        "training_date": datetime.now().isoformat(),
        "features": FEATURE_COLS,
        "feature_importances": feature_importances,
        "baseline_logistic_regression": lr_metrics,
        "candidate_random_forest": rf_metrics,
        "selected_metrics": selected_metrics,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "validation_strategy": "Chronological split (80/20)"
    }

    with open(meta_save_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[SUCCESS] Saved goal model to {model_save_path}")
    print(f"[SUCCESS] Saved goal metadata to {meta_save_path}")
    return metadata

if __name__ == "__main__":
    train_goal_model()
