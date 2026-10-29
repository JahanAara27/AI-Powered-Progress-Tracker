import os
import json
import joblib
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

class ModelRegistry:
    def __init__(self):
        self.consistency_model = None
        self.consistency_metadata = {}
        self.goal_model = None
        self.goal_metadata = {}
        self.load_models()

    def load_models(self):
        consistency_path = MODELS_DIR / "consistency_model.joblib"
        consistency_meta_path = MODELS_DIR / "consistency_metadata.json"
        
        goal_path = MODELS_DIR / "goal_model.joblib"
        goal_meta_path = MODELS_DIR / "goal_metadata.json"

        if consistency_path.exists():
            try:
                self.consistency_model = joblib.load(consistency_path)
                if consistency_meta_path.exists():
                    with open(consistency_meta_path, "r", encoding="utf-8") as f:
                        self.consistency_metadata = json.load(f)
                print(f"[ModelRegistry] Loaded Consistency Model from {consistency_path}")
            except Exception as e:
                print(f"[ModelRegistry] Error loading consistency model: {e}")

        if goal_path.exists():
            try:
                self.goal_model = joblib.load(goal_path)
                if goal_meta_path.exists():
                    with open(goal_meta_path, "r", encoding="utf-8") as f:
                        self.goal_metadata = json.load(f)
                print(f"[ModelRegistry] Loaded Goal Model from {goal_path}")
            except Exception as e:
                print(f"[ModelRegistry] Error loading goal model: {e}")

    def get_consistency_model(self):
        return self.consistency_model, self.consistency_metadata

    def get_goal_model(self):
        return self.goal_model, self.goal_metadata

    def status(self) -> Dict[str, bool]:
        return {
            "consistency_model": self.consistency_model is not None,
            "goal_model": self.goal_model is not None
        }

registry = ModelRegistry()
