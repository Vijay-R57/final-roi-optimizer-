"""
generate_events.py
==================
Regenerates the 500K prescription event dataset so it is:

1. Compatible with ALL 120 medicines in medicine_details_120_improved.csv
2. Realistically distributed (long-tail, not uniform)
3. HCP-specialty–medicine TC affinity driven
4. Time-series with stable/growing/declining/seasonal patterns
5. Internally consistent (quantity, claims, fills, drug cost all correlated)
6. Sufficient history for all Lipid Lowering Tablets to act as analogs for
   Atorvastatin

Target: ~500,000 events across 33 months (Jan 2023 - Sep 2025)

Usage:
    python scripts/generate_events.py
"""

import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
from pathlib import Path

SEED = 42
rng  = np.random.default_rng(SEED)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR     = PROJECT_ROOT / "Dataset"
OUT_FILE     = DATA_DIR / "prescription_events_500k.csv"

TARGET_EVENTS = 500_000

# ---------------------------------------------------------------------------
# Load master files
# ---------------------------------------------------------------------------
meds = pd.read_csv(DATA_DIR / "medicine_details_120_improved.csv")
pres = pd.read_csv(DATA_DIR / "prescriber_master_chennai_12000.csv")

# Rename to internal names
meds = meds.rename(columns={"Generic_Name": "Gnrc_Name", "Brand_Name": "Brnd_Name"})

print(f"Medicines: {len(meds)}")
print(f"Prescribers: {len(pres)}")

# ---------------------------------------------------------------------------
# Time grid: 33 months Jan 2023 – Sep 2025
# ---------------------------------------------------------------------------
months = pd.date_range("2023-01-01", periods=33, freq="MS")
n_months = len(months)
print(f"Months: {n_months}  ({months[0].date()} to {months[-1].date()})")

# ---------------------------------------------------------------------------
# Specialty -> Therapeutic Class affinity
# Each specialty has a primary TC (high weight) and secondary TCs
# ---------------------------------------------------------------------------
SPEC_TC_AFFINITY = {
    # specialty: {TC: weight}
    "Cardiology":        {"Lipid Lowering":1.0, "Antihypertensive":0.9, "Antiplatelet":0.8,
                          "Antidiabetic":0.2},
    "Diabetology":       {"Antidiabetic":1.0, "Lipid Lowering":0.5, "Antihypertensive":0.4,
                          "Thyroid":0.2},
    "Endocrinology":     {"Thyroid":1.0, "Antidiabetic":0.8, "Lipid Lowering":0.3},
    "Pulmonology":       {"Respiratory":1.0, "Antibiotic":0.4},
    "Neurology":         {"CNS / Neurology":1.0, "Analgesic":0.4},
    "Psychiatry":        {"CNS / Neurology":0.9, "Analgesic":0.2},
    "Orthopedics":       {"Analgesic":1.0, "Antibiotic":0.3},
    "Dermatology":       {"Dermatology / Allergy":1.0, "Antibiotic":0.3, "Analgesic":0.1},
    "ENT":               {"Respiratory":0.7, "Antibiotic":0.8, "Analgesic":0.3,
                          "Dermatology / Allergy":0.2},
    "General Medicine":  {"Antidiabetic":0.6, "Antihypertensive":0.6, "Antibiotic":0.7,
                          "Analgesic":0.6, "Gastrointestinal":0.5, "Lipid Lowering":0.4},
    "Urology":           {"Urology":1.0, "Antibiotic":0.4, "Analgesic":0.2},
    "Pediatrics":        {"Antibiotic":0.8, "Respiratory":0.7, "Analgesic":0.5,
                          "Gastrointestinal":0.4},
}

all_tcs = meds["Therapeutic_Class"].unique()

def get_tc_weight(specialty: str, tc: str) -> float:
    aff = SPEC_TC_AFFINITY.get(specialty, {})
    return aff.get(tc, 0.05)   # base probability for unrelated TC

# ---------------------------------------------------------------------------
# Medicine demand parameters — long-tail distribution
# High volume (5-8%): block-buster medicines in each class
# Med  volume (2-5%)
# Low  volume (0.2-2%)
# ---------------------------------------------------------------------------
# Assign each medicine a base_share within its TC, then scale globally
MED_PATTERNS = {}
for tc, grp in meds.groupby("Therapeutic_Class"):
    ids = grp["Medicine_ID"].tolist()
    n   = len(ids)
    # Draw Dirichlet-like shares: first few medicines dominate
    raw_shares = rng.exponential(scale=[3.0, 2.0, 1.5, 1.2, 1.0,
                                         0.8, 0.6, 0.5, 0.4, 0.3][:n])
    raw_shares /= raw_shares.sum()

    for i, mid in enumerate(ids):
        row = grp[grp["Medicine_ID"] == mid].iloc[0]
        # Trend type: stable / growing / declining / seasonal
        trend_type = rng.choice(["stable","growing","declining","seasonal"],
                                p=[0.45, 0.25, 0.15, 0.15])
        MED_PATTERNS[mid] = {
            "tc_share":   float(raw_shares[i]),
            "trend":      trend_type,
            "price":      float(row["Unit_Price_INR"]),
            "gnrc":       row["Gnrc_Name"],
            "brand":      row["Brnd_Name"],
            "form":       row["Dosage_Form"],
        }

# Ensure Lipid Lowering Tablets (MED001-MED010) get strong TC shares
# so they have enough events as analogs
for mid in ["MED001","MED002","MED003","MED004","MED005",
            "MED006","MED007","MED008","MED009","MED010"]:
    if mid in MED_PATTERNS:
        MED_PATTERNS[mid]["tc_share"] = max(MED_PATTERNS[mid]["tc_share"], 0.08)

# Re-normalise Lipid Lowering shares
ll_ids   = [m for m in MED_PATTERNS if meds.loc[
    meds["Medicine_ID"]==m,"Therapeutic_Class"].values[0] == "Lipid Lowering"]
ll_total = sum(MED_PATTERNS[m]["tc_share"] for m in ll_ids)
for m in ll_ids:
    MED_PATTERNS[m]["tc_share"] /= ll_total

# ---------------------------------------------------------------------------
# TC event volume: how many events each TC gets (globally)
# Analgesic / Antidiabetic / Antihypertensive dominate
# ---------------------------------------------------------------------------
TC_GLOBAL_WEIGHT = {
    "Antidiabetic":        0.12,
    "Antihypertensive":    0.11,
    "Analgesic":           0.11,
    "Antibiotic":          0.10,
    "Lipid Lowering":      0.10,
    "Respiratory":         0.09,
    "Gastrointestinal":    0.09,
    "CNS / Neurology":     0.08,
    "Antiplatelet":        0.07,
    "Thyroid":             0.06,
    "Dermatology / Allergy": 0.05,
    "Urology":             0.02,
}
# Normalise
_tw = sum(TC_GLOBAL_WEIGHT.values())
TC_GLOBAL_WEIGHT = {k: v/_tw for k, v in TC_GLOBAL_WEIGHT.items()}

# ---------------------------------------------------------------------------
# Monthly trend multipliers
# ---------------------------------------------------------------------------
def get_monthly_multiplier(trend_type: str, month_idx: int,
                            n_months: int = 33) -> float:
    t = month_idx / (n_months - 1)   # 0..1
    if trend_type == "stable":
        return 1.0
    if trend_type == "growing":
        return 0.6 + 0.8 * t
    if trend_type == "declining":
        return 1.4 - 0.7 * t
    if trend_type == "seasonal":
        return 1.0 + 0.3 * np.sin(2 * np.pi * month_idx / 12)
    return 1.0

# ---------------------------------------------------------------------------
# HCP affinity: each HCP has a specialty-derived TC weight
# Plus HCP-level random affinity variation
# ---------------------------------------------------------------------------
print("Computing HCP affinity scores ...")
hcp_ids = pres["Prscrbr_NPI"].tolist()
hcp_spec = dict(zip(pres["Prscrbr_NPI"], pres["Specialty"]))

# Per-HCP random multiplier (1 value per HCP per TC)
n_hcp = len(hcp_ids)
n_tc  = len(all_tcs)
tc_list = list(all_tcs)
tc_idx  = {tc: i for i, tc in enumerate(tc_list)}

# HCP random affinity noise (shape: n_hcp × n_tc)
hcp_tc_noise = rng.lognormal(0, 0.4, size=(n_hcp, n_tc))

hcp_id_to_idx = {npi: i for i, npi in enumerate(hcp_ids)}

def hcp_tc_weight(npi: str, tc: str) -> float:
    spec   = hcp_spec.get(npi, "General Medicine")
    base_w = get_tc_weight(spec, tc)
    idx_h  = hcp_id_to_idx[npi]
    idx_tc = tc_idx.get(tc, 0)
    return base_w * hcp_tc_noise[idx_h, idx_tc]

# ---------------------------------------------------------------------------
# Decide how many events per medicine per month
# Total ≈ 500,000  → per medicine-month: varies
# ---------------------------------------------------------------------------
print("Generating event counts ...")

# Expected events per medicine per month
med_month_target = {}
for mid, pat in MED_PATTERNS.items():
    tc   = meds.loc[meds["Medicine_ID"] == mid, "Therapeutic_Class"].values[0]
    base = TARGET_EVENTS * TC_GLOBAL_WEIGHT[tc] * pat["tc_share"]
    med_month_target[mid] = base / n_months

# ---------------------------------------------------------------------------
# For each medicine × month, sample HCPs proportional to their TC affinity
# ---------------------------------------------------------------------------
print("Sampling HCP prescribers per medicine×month ...")
rows = []
event_id_counter = 1

for m_idx, month_dt in enumerate(months):
    month_str = str(month_dt.date())

    for mid, pat in MED_PATTERNS.items():
        tc     = meds.loc[meds["Medicine_ID"] == mid, "Therapeutic_Class"].values[0]
        trend  = get_monthly_multiplier(pat["trend"], m_idx, n_months)
        # Expected prescriptions this month for this medicine
        mu     = med_month_target[mid] * trend
        n_ev   = max(1, int(rng.poisson(mu)))

        # Compute HCP selection weights for this TC
        tc_weights = np.array([
            hcp_tc_weight(npi, tc) for npi in hcp_ids
        ])
        tc_weights = np.maximum(tc_weights, 1e-9)
        tc_weights /= tc_weights.sum()

        # Sample n_ev HCPs (with replacement — same HCP can prescribe multiple times)
        chosen_idx = rng.choice(n_hcp, size=n_ev, replace=True, p=tc_weights)
        chosen_npis = [hcp_ids[i] for i in chosen_idx]

        # Generate realistic feature values per event
        price  = pat["price"]
        for npi in chosen_npis:
            qty          = max(1, int(rng.lognormal(1.5, 0.6)))
            claims        = max(1, int(rng.lognormal(0.8, 0.5)))
            fills         = claims
            days_supply   = fills * 30
            drug_cost     = round(qty * price * rng.uniform(0.9, 1.1), 2)
            beneficiaries = max(1, claims)
            purchase_date = month_dt + pd.Timedelta(days=int(rng.integers(0, 28)))

            rows.append({
                "Event_ID":           f"EVT{event_id_counter:08d}",
                "Purchase_Date":      purchase_date,
                "Prscrbr_NPI":        npi,
                "Medicine_ID":        mid,
                "Brnd_Name":          pat["brand"],
                "Gnrc_Name":          pat["gnrc"],
                "Prscrbr_City":       "Chennai",
                "Prscrbr_State_Abrvtn": "TN",
                "Total_Clms":         claims,
                "Tot_30day_Fills":    fills,
                "Tot_Day_Suply":      days_supply,
                "Tot_Drug_Cst":       drug_cost,
                "Tot_Benes":          beneficiaries,
                "Quantity_Purchased": qty,
                "Days_Supply":        days_supply,
                "Event_Type":         "Prescription",
            })
            event_id_counter += 1

    if (m_idx + 1) % 5 == 0:
        print(f"  Processed {m_idx+1}/{n_months} months | "
              f"Events so far: {len(rows):,}")

print(f"\nTotal events generated: {len(rows):,}")

# ---------------------------------------------------------------------------
# Assemble DataFrame
# ---------------------------------------------------------------------------
df = pd.DataFrame(rows)
df["Purchase_Date"] = pd.to_datetime(df["Purchase_Date"])

# ---------------------------------------------------------------------------
# Validation printout
# ---------------------------------------------------------------------------
print("\n" + "=" * 54)
print("EVENT DATA VALIDATION".center(54))
print("=" * 54)
print(f"  Events            : {len(df):,}")
print(f"  Unique HCPs       : {df['Prscrbr_NPI'].nunique():,}")
print(f"  Unique Medicines  : {df['Medicine_ID'].nunique()}")
print(f"  Date Start        : {df['Purchase_Date'].min().date()}")
print(f"  Date End          : {df['Purchase_Date'].max().date()}")
print(f"  Medicine Coverage : {df['Medicine_ID'].nunique()}/120")
print(f"  HCP Coverage      : {df['Prscrbr_NPI'].nunique():,}")
valid_meds = set(meds["Medicine_ID"])
invalid_ev = (~df["Medicine_ID"].isin(valid_meds)).sum()
missing_hcp= df["Prscrbr_NPI"].isna().sum()
print(f"  Invalid Med IDs   : {invalid_ev}")
print(f"  Missing HCP IDs   : {missing_hcp}")
status = "PASS" if (invalid_ev == 0 and missing_hcp == 0 and
                    df["Medicine_ID"].nunique() == 120) else "WARN"
print(f"  Status            : {status}")
print("=" * 54)

# Lipid Lowering summary
ll = df[df["Medicine_ID"].isin([f"MED{i:03d}" for i in range(1,11)])]
print(f"\nLipid Lowering events: {len(ll):,}")
print(ll.groupby("Medicine_ID").agg(
    Events=("Event_ID","count"),
    HCPs=("Prscrbr_NPI","nunique")
).to_string())

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
df.to_csv(str(OUT_FILE), index=False)
print(f"\nSaved: {OUT_FILE}  ({OUT_FILE.stat().st_size/1e6:.1f} MB)")
