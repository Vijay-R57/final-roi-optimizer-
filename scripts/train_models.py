"""
scripts/train_models.py — Pre-train CatBoost ML Models on Dataset3.
Saves trained CatBoost models to models/ for production inference acceleration.
"""
import os, sys, json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from src.services.sample_drop_service import SampleDropService

MODELS_DIR = BASE_DIR / "models"

def main():
    os.makedirs(str(MODELS_DIR), exist_ok=True)
    print("======================================================")
    print("      PRE-TRAINING CATBOOST MODELS ON DATASET3        ")
    print("======================================================")
    
    svc = SampleDropService()
    default_req = {
        "medicine": {
            "generic_name": "Metformin",
            "brand_name": "Glycomet",
            "therapeutic_class": "Antidiabetic",
            "dosage_form": "Tablet",
            "strength": "500 mg",
        },
        "total_samples": 22500,
        "medicine_price": 200.0,
        "sample_cost": 5.0,
        "expected_sample_lift": 0.11,
        "average_units_per_prescription": 2,
        "variable_cost_per_unit": 200.0,
        "mode": "new_analog",
    }
    
    print("[Train] Executing ML pipeline training run...")
    res = svc.run(default_req, output_dir=MODELS_DIR)
    
    metadata = {
        "dataset_events": res.get("total_events"),
        "unique_hcps": res.get("unique_hcps_dataset"),
        "best_pipeline": res.get("best_pipeline"),
        "best_val_mae": res.get("best_val_mae"),
        "potential_auc": res.get("potential_model_val_auc"),
        "status": "PRETRAINED_READY"
    }
    
    with open(str(MODELS_DIR / "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\n[Train] CatBoost models pre-trained successfully.")
    print(f"[Train] Model files saved to: {MODELS_DIR}")

if __name__ == "__main__":
    main()
