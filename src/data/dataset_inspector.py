"""
dataset_inspector.py
Inspects Dataset2 and writes outputs/dataset_schema_report.json
"""
import json, os
import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET2_DIR = PROJECT_ROOT / "Dataset2"
OUTPUT_DIR   = PROJECT_ROOT / "outputs"
os.makedirs(str(OUTPUT_DIR), exist_ok=True)

FILES = {
    "medicine":   "medicine_details_120_final.csv",
    "hcp":        "prescriber_master_chennai_12000_final.csv",
    "events":     "prescription_events_500k_final.csv",
    "validation": "final_dataset_validation.csv",
}

def inspect() -> dict:
    report = {}
    for role, fname in FILES.items():
        fpath = DATASET2_DIR / fname
        if not fpath.exists():
            report[role] = {"error": f"File not found: {fname}"}
            continue
        df = pd.read_csv(fpath)
        col_info = {}
        for c in df.columns:
            col_info[c] = {
                "dtype":      str(df[c].dtype),
                "missing_pct": round(df[c].isna().mean() * 100, 2),
                "n_unique":   int(df[c].nunique()),
            }
        # Date range
        date_range = {}
        for c in df.columns:
            if any(k in c.lower() for k in ["date", "dt"]):
                try:
                    d = pd.to_datetime(df[c])
                    date_range[c] = {"min": str(d.min().date()),
                                     "max": str(d.max().date())}
                except Exception:
                    pass
        report[role] = {
            "file":        fname,
            "rows":        len(df),
            "columns":     len(df.columns),
            "column_info": col_info,
            "duplicates":  int(df.duplicated().sum()),
            "date_ranges": date_range,
        }
    # Relationships
    meds = pd.read_csv(DATASET2_DIR / FILES["medicine"])
    hcps = pd.read_csv(DATASET2_DIR / FILES["hcp"])
    evs  = pd.read_csv(DATASET2_DIR / FILES["events"])
    report["relationships"] = {
        "events.Medicine_ID -> medicine.Medicine_ID":
            f"{evs['Medicine_ID'].isin(meds['Medicine_ID']).mean()*100:.2f}% valid",
        "events.HCP_ID -> hcp.HCP_ID":
            f"{evs['HCP_ID'].isin(hcps['HCP_ID']).mean()*100:.2f}% valid",
        "unique_hcps_in_events":    int(evs["HCP_ID"].nunique()),
        "unique_medicines_in_events": int(evs["Medicine_ID"].nunique()),
    }
    # Save
    out_path = OUTPUT_DIR / "dataset_schema_report.json"
    with open(str(out_path), "w") as f:
        json.dump(report, f, indent=2)

    # Print summary
    print("\n" + "="*60)
    print("DATASET2 INSPECTION")
    print("="*60)
    for role, info in report.items():
        if role == "relationships":
            print(f"\nRelationships:")
            for k, v in info.items():
                print(f"  {k}: {v}")
            continue
        if "error" in info:
            print(f"\n[ERROR] {role}: {info['error']}"); continue
        print(f"\nFile : {info['file']}")
        print(f"Rows : {info['rows']:,}  Cols: {info['columns']}")
        print(f"Cols : {list(info['column_info'].keys())}")
        for c, ci in info["column_info"].items():
            print(f"  {c:<35} {ci['dtype']:<12} "
                  f"miss={ci['missing_pct']:.1f}%  "
                  f"uniq={ci['n_unique']}")
        if info["date_ranges"]:
            for dc, dr in info["date_ranges"].items():
                print(f"  Date [{dc}]: {dr['min']} to {dr['max']}")
        print(f"Dups : {info['duplicates']}")
    print(f"\nReport saved: {out_path}")
    return report


if __name__ == "__main__":
    inspect()
