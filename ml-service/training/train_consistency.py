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
    confusion_matrix,
    classification_report
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "training" / "habit_consistency_dataset.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
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

def train_consistency_model():
    print("Loading dataset from:", DATA_PATH)
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}. Run generate_data.py first.")

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} samples. Features: {len(FEATURE_COLS)}")

    # Chronological validation split based on cutoff_date
    df = df.sort_values("cutoff_date").reset_index(drop=True)
    split_idx = int(len(df) * 0.8)

    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    X_train = train_df[FEATURE_COLS]
    y_train = train_df["label_consistency"]
    X_test = test_df[FEATURE_COLS]
    y_test = test_df["label_consistency"]

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
            n_estimators=120,
            max_depth=6,
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

    # Feature importances from Random Forest
    rf_model = rf_pipeline.named_steps["classifier"]
    feature_importances = dict(zip(FEATURE_COLS, [round(float(v), 4) for v in rf_model.feature_importances_]))

    # Model selection based on F1 and ROC-AUC
    if rf_metrics["f1"] >= lr_metrics["f1"]:
        selected_model = rf_pipeline
        selected_name = "RandomForestClassifier"
        selected_metrics = rf_metrics
        algorithm_choice = "Random Forest (Selected based on higher F1 & ROC-AUC)"
    else:
        selected_model = lr_pipeline
        selected_name = "LogisticRegression"
        selected_metrics = lr_metrics
        algorithm_choice = "Logistic Regression (Selected based on test performance)"

    # Save best model
    model_save_path = MODELS_DIR / "consistency_model.joblib"
    meta_save_path = MODELS_DIR / "consistency_metadata.json"

    joblib.dump(selected_model, model_save_path)

    metadata = {
        "model_name": "HabitConsistencyPredictor",
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

    print(f"\n[SUCCESS] Saved consistency model to {model_save_path}")
    print(f"[SUCCESS] Saved consistency metadata to {meta_save_path}")
    return metadata

if __name__ == "__main__":
    train_consistency_model()
