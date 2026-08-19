"""config.py — Central configuration. Dataset3 is the active data source."""

from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATASET_DIR  = PROJECT_ROOT / "Dataset3"          # Active data source
OUTPUT_DIR   = PROJECT_ROOT / "outputs"
MODEL_DIR    = PROJECT_ROOT / "models"

# Dataset3 filenames
MEDICINE_FILE = "medicine_details_120_final.csv"
HCP_FILE      = "prescriber_master_chennai_12000_final.csv"
EVENT_FILE    = "prescription_events_500k_corrected.csv"

# ---------------------------------------------------------------------------
# Data-quality gates for analog eligibility
# ---------------------------------------------------------------------------
MIN_EVENTS             = 500
MIN_ACTIVE_PRESCRIBERS = 50
MIN_MONTHS_HISTORY     = 12

# ---------------------------------------------------------------------------
# HCP selection
# ---------------------------------------------------------------------------
TOP_N_HCPS          = 100
MAX_SAMPLES_PER_HCP = 500

# ---------------------------------------------------------------------------
# Analog scoring weights (must sum to 1.0)
# ---------------------------------------------------------------------------
ANALOG_WEIGHT_PROFILE  = 0.60
ANALOG_WEIGHT_BEHAVIOR = 0.25
ANALOG_WEIGHT_QUALITY  = 0.15

# Dosage-form mismatch penalty (tier 3)
FORM_PENALTY = 0.70

# Strength compatibility table: (min_ratio_inclusive, score)
STRENGTH_COMPAT_THRESHOLDS = [
    (1.00, 1.00),
    (0.80, 0.80),
    (0.50, 0.50),
    (0.25, 0.25),
    (0.00, 0.10),
]

# ---------------------------------------------------------------------------
# ROI scenario lifts
# ---------------------------------------------------------------------------
ROI_SCENARIOS = {
    "Conservative":   0.05,
    "Base":           0.10,
    "Optimistic":     0.20,
    "High":           0.30,
    "Very High (50%)":0.50,
}

# ---------------------------------------------------------------------------
# Prediction collapse detection
# ---------------------------------------------------------------------------
PREDICTION_COLLAPSE_THRESHOLD = 0.10
