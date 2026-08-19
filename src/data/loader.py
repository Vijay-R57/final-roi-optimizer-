"""
loader.py
Loads Dataset2 files, applies schema mapping, validates IDs.
All downstream code uses internal column names from schema_mapper.
"""

import os, json, sys
from pathlib import Path

import pandas as pd

from src.config import DATASET_DIR, OUTPUT_DIR, MEDICINE_FILE, HCP_FILE, EVENT_FILE
from src.data.schema_mapper import (
    apply_medicine_schema, apply_hcp_schema, apply_event_schema,
    C_MED_ID, C_HCP_ID, C_GNRC, C_TC, C_FORM, C_STR, C_PRICE, C_ELIG,
    C_PDATE, C_QTY,
)

os.makedirs(str(OUTPUT_DIR), exist_ok=True)


# ---------------------------------------------------------------------------
# Medicine master validation
# ---------------------------------------------------------------------------
def _validate_medicine(df: pd.DataFrame) -> bool:
    n_total = len(df)
    n_tc    = df[C_TC].nunique()
    tcs     = df.groupby(C_TC).size()
    dup_ids = df[C_MED_ID].duplicated().sum()
    miss    = df[[C_GNRC, C_TC, C_FORM, C_STR, C_PRICE]].isna().sum().sum()
    bad_px  = (df[C_PRICE] <= 0).sum()

    print("\n" + "="*54)
    print("MEDICINE MASTER VALIDATION".center(54))
    print("="*54)
    print(f"  Total Medicines        : {n_total}")
    print(f"  Therapeutic Classes    : {n_tc}")
    for tc, cnt in tcs.items():
        print(f"      {tc:<32}: {cnt}")
    print(f"  Duplicate IDs          : {dup_ids}")
    print(f"  Missing Values         : {miss}")
    print(f"  Invalid Prices (<=0)   : {bad_px}")

    ok = (n_total == 120 and n_tc == 12 and dup_ids == 0
          and miss == 0 and bad_px == 0)
    print(f"\n  Status: {'PASS' if ok else 'FAIL'}")
    print("="*54)

    # Save validation row
    import pandas as _pd
    _pd.DataFrame([{
        "total_medicines": n_total, "therapeutic_classes": n_tc,
        "duplicate_ids": int(dup_ids), "missing_values": int(miss),
        "invalid_prices": int(bad_px), "status": "PASS" if ok else "FAIL"
    }]).to_csv(str(OUTPUT_DIR / "dataset_validation.csv"), index=False)
    return ok


# ---------------------------------------------------------------------------
# Event validation
# ---------------------------------------------------------------------------
def _validate_events(ev: pd.DataFrame, med_ids: set, hcp_ids: set) -> pd.DataFrame:
    total     = len(ev)
    valid_med = ev[C_MED_ID].isin(med_ids)
    valid_hcp = ev[C_HCP_ID].isin(hcp_ids)
    n_bad_med = int((~valid_med).sum())
    n_bad_hcp = int((~valid_hcp).sum())
    pct_med   = valid_med.mean() * 100
    pct_hcp   = valid_hcp.mean() * 100

    print("\n" + "="*54)
    print("EVENT DATA VALIDATION".center(54))
    print("="*54)
    print(f"  Total Events           : {total:,}")
    print(f"  Valid Medicine IDs     : {int(valid_med.sum()):,} ({pct_med:.2f}%)")
    print(f"  Invalid Medicine IDs   : {n_bad_med}")
    print(f"  Valid HCP IDs          : {int(valid_hcp.sum()):,} ({pct_hcp:.2f}%)")
    print(f"  Invalid HCP IDs        : {n_bad_hcp}")
    print(f"  Unique HCPs            : {ev[C_HCP_ID].nunique():,}")
    print(f"  Unique Medicines       : {ev[C_MED_ID].nunique()}")

    status = "PASS" if (n_bad_med == 0 and n_bad_hcp == 0) else "FAIL"
    print(f"\n  Status: {status}")
    print("="*54)

    if status == "FAIL":
        if n_bad_med > 0:
            print(f"[WARN] Dropping {n_bad_med} events with invalid Medicine IDs")
        if n_bad_hcp > 0:
            print(f"[WARN] Dropping {n_bad_hcp} events with invalid HCP IDs")
        ev = ev[valid_med & valid_hcp].copy()
    return ev


# ---------------------------------------------------------------------------
# Main loader
# ---------------------------------------------------------------------------
def load_data():
    """
    Load Dataset3 files, apply schema mapping, validate.
    Returns (medicines, hcps, events) — all using internal column names.
    """
    for fpath in [DATASET_DIR/MEDICINE_FILE, DATASET_DIR/HCP_FILE, DATASET_DIR/EVENT_FILE]:
        if not fpath.exists():
            raise FileNotFoundError(
                f"Dataset3 file not found: {fpath}\n"
                "Ensure Dataset3/ folder contains the three required CSV files."
            )

    # Load and rename
    meds = apply_medicine_schema(pd.read_csv(DATASET_DIR / MEDICINE_FILE))
    hcps = apply_hcp_schema(pd.read_csv(DATASET_DIR / HCP_FILE))
    evs  = apply_event_schema(pd.read_csv(DATASET_DIR / EVENT_FILE,
                                           parse_dates=["Purchase_Date"]))

    # Attach therapeutic class to events for TC-affinity features
    evs = evs.merge(meds[[C_MED_ID, C_TC]], on=C_MED_ID, how="left")

    # Validate medicine master
    if not _validate_medicine(meds):
        print("[FATAL] Medicine master validation FAILED. Stopping.")
        sys.exit(1)

    # Validate events
    med_ids = set(meds[C_MED_ID])
    hcp_ids = set(hcps[C_HCP_ID])
    evs = _validate_events(evs, med_ids, hcp_ids)

    return meds, hcps, evs
