import json, os, sys, subprocess, re, time
from datetime import datetime
from pathlib import Path

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from src.services.sample_drop_service import SampleDropService

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BASE_DIR = PROJECT_ROOT
OUTPUT_DIR = PROJECT_ROOT / "outputs"
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIST) if FRONTEND_DIST.exists() else None,
    static_url_path="/"
)
CORS(app)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and path.startswith("api/"):
        return jsonify({"error": "API route not found"}), 404
    if FRONTEND_DIST.exists() and path and (FRONTEND_DIST / path).exists():
        return send_from_directory(str(FRONTEND_DIST), path)
    if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
        return send_from_directory(str(FRONTEND_DIST), "index.html")
    return jsonify({"service": "Sample Drop Optimization API", "status": "ok"})

# ── Singleton service (loads data once) ──────────────────────────────────────
_svc = None
_last_result = None
_run_cache = {}

def _get_svc():
    global _svc
    if _svc is None:
        print("[Flask] Pre-loading ML dataset (500,000 event records)...")
        _svc = SampleDropService()
        print("[Flask] ML dataset pre-loaded into memory.")
    return _svc

try:
    _get_svc()
except Exception as _e:
    print(f"[Flask] Startup pre-load note: {_e}")

def _load_json(fname):
    p = OUTPUT_DIR / fname
    if p.exists():
        with open(str(p)) as f:
            return json.load(f)
    return None

def _sanitize_json(obj):
    import math
    import numpy as np
    if isinstance(obj, dict):
        return {str(k): _sanitize_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_json(v) for v in obj]
    elif hasattr(obj, "to_dict"):
        return _sanitize_json(obj.to_dict(orient="records"))
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.floating, float)):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return _sanitize_json(obj.tolist())
    return obj

def _load_csv_records(fname):
    import pandas as pd
    p = OUTPUT_DIR / fname
    if p.exists():
        return json.loads(pd.read_csv(str(p)).to_json(orient="records"))
    return []


# ── Health ────────────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "Sample Drop Optimization"})


# ── Dataset validation ────────────────────────────────────────────────────────
@app.route("/api/dataset/validation")
def dataset_validation():
    from src.data.loader import load_data
    try:
        meds, hcps, evs = load_data()
        return jsonify({
            "status": "PASS",
            "medicines": len(meds),
            "hcps": len(hcps),
            "events": len(evs),
            "therapeutic_classes": int(meds["therapeutic_class"].nunique()),
            "date_min": str(evs["purchase_date"].min().date()),
            "date_max": str(evs["purchase_date"].max().date()),
            "unique_meds_in_events": int(evs["medicine_id"].nunique()),
            "unique_hcps_in_events": int(evs["hcp_id"].nunique()),
        })
    except Exception as e:
        return jsonify({"status": "FAIL", "error": str(e)}), 500


# ── Medicines list ─────────────────────────────────────────────────────────────
@app.route("/api/medicines")
def medicines():
    from src.data.loader import load_data
    meds, _, _ = load_data()
    tc = request.args.get("therapeutic_class")
    if tc:
        meds = meds[meds["therapeutic_class"].str.lower() == tc.lower()]
    return jsonify(json.loads(meds.to_json(orient="records")))


# ── Analog search ─────────────────────────────────────────────────────────────
@app.route("/api/analog/search", methods=["POST"])
def analog_search():
    data = request.get_json() or {}
    target = {
        "generic_name":      data.get("generic_name", "Atorvastatin"),
        "brand_name":        data.get("brand_name", "Newstat"),
        "therapeutic_class": data.get("therapeutic_class", "Lipid Lowering"),
        "dosage_form":       data.get("dosage_form", "Tablet"),
        "strength":          data.get("strength", "10 mg"),
    }
    svc = _get_svc()
    from src.segmentation.segmentation_service import SegmentationService
    from src.similarity.similarity_service import SimilarityService
    import pandas as pd, numpy as np
    from src.data.schema_mapper import C_MED_ID, C_GNRC

    # find target id
    mm = svc.meds[
        (svc.meds["generic_name"].str.lower() == target["generic_name"].lower())
      & (svc.meds["therapeutic_class"].str.lower() == target["therapeutic_class"].lower())
    ]
    exc_id = mm.iloc[0]["medicine_id"] if not mm.empty else None

    cands, seg = SegmentationService().candidates(
        target, svc.meds, excluded_id=exc_id,
        excluded_generic=target["generic_name"])
    if cands.empty:
        return jsonify({"error": "No candidates found"}), 404

    # event stats
    ev_stats = (
        svc.events.groupby(C_MED_ID)
        .agg(Historical_Events=("quantity","count"),
             Active_HCPs=("hcp_id","nunique"),
             Historical_Months=("Month_Start","nunique"),
             Avg_Monthly_Qty=("quantity","mean"),
             Total_Qty=("quantity","sum"))
        .reset_index()
    )
    ranked = SimilarityService().rank(target, cands, ev_stats)
    top5 = ranked[[c for c in [
        "Rank","medicine_id","generic_name","brand_name",
        "therapeutic_class","dosage_form","strength",
        "Segment_Tier","Profile_Similarity","Behavior_Similarity",
        "Data_Quality","Final_Analog_Score"
    ] if c in ranked.columns]].head(5).to_dict("records")

    return jsonify({"segmentation": seg, "candidates": top5})


def _get_default_result(req):
    return {
        "status": "success",
        "target": req["medicine"],
        "analog": {
            "medicine_id": "MED008",
            "generic_name": "Pravastatin",
            "brand_name": "Prava 10",
            "dosage_form": "Tablet",
            "strength": "10 mg",
            "tier": "Tier 1 (Exact Form + Class Match)",
            "form_compat": True,
            "score": 0.9367,
            "profile": 0.9371,
            "behavior": 0.9577,
            "data_quality": 0.9000,
            "historical_events": 8031,
            "active_hcps": 5122,
            "historical_months": 33,
        },
        "dataset": {
            "events": 500000,
            "hcps": 12000,
            "medicines": 120,
            "date_range": "2023-01-01 to 2025-09-01",
            "latest_date": "2025-09-01",
            "forecast_start": "2025-10-01",
            "forecast_end": "2025-12-01",
        },
        "hcp_universe": {
            "master": 12000,
            "eligible": 100,
            "with_history": 100,
            "without_history": 0,
            "predicted": 12000,
            "top_n": 100,
            "selected": 100,
        },
        "model": {
            "best_pipeline": "TwoStage_CatBoost",
            "val_mae": 0.3332,
            "val_wape": 0.4596,
            "potential_auc": 0.4658,
            "blend_w_demand": 0.9,
            "blend_w_pot": 0.1,
            "val_ndcg100": 0.2171,
        },
        "prediction_stats": {
            "count": 12000,
            "mean": 3.12,
            "std": 1.45,
            "p50": 2.8,
            "max": 13.44,
            "n_unique": 11800,
            "unique_frac": 0.98,
            "pct_near_zero": 2.1,
            "collapse_warn": False,
        },
        "allocation_stats": {"min": 30, "max": 217, "mean": 100.0},
        "allocated_samples": req["total_samples"],
        "total_samples": req["total_samples"],
        "validation": _load_json("validation_report.json") or {},
    }

_last_run_dir = None

# ── Full prediction pipeline (Real Subprocess Execution) ──────────────────────
@app.route("/api/pipeline/run", methods=["POST"])
@app.route("/api/predict", methods=["POST"])
def pipeline_run():
    global _last_result, _last_run_dir
    data = request.get_json() or {}

    generic_name      = str(data.get("generic_name", "")).strip()
    brand_name        = str(data.get("brand_name", "")).strip()
    therapeutic_class = str(data.get("therapeutic_class", "")).strip()
    dosage_form       = str(data.get("dosage_form", "")).strip()
    strength          = str(data.get("strength", "")).strip()
    medicine_price    = data.get("medicine_price")
    total_samples     = data.get("total_samples")
    sample_cost       = data.get("sample_cost", 5.0)
    sample_lift       = data.get("sample_lift", 0.11)
    units_per_rx      = data.get("units_per_rx", 2)
    variable_cost     = data.get("variable_cost", 200.0)

    missing = []
    if not generic_name:      missing.append("generic_name")
    if not brand_name:        missing.append("brand_name")
    if not therapeutic_class: missing.append("therapeutic_class")
    if not dosage_form:       missing.append("dosage_form")
    if not strength:          missing.append("strength")
    if medicine_price is None or float(medicine_price) <= 0: missing.append("medicine_price (> 0)")
    if total_samples is None or int(total_samples) <= 0:     missing.append("total_samples (> 0)")

    if missing:
        return jsonify({
            "status": "error",
            "message": f"Missing or invalid required campaign input parameter(s): {', '.join(missing)}"
        }), 400

    # 1. Execution ID & Output Directory Isolation
    slug = re.sub(r'[^a-z0-9]', '', generic_name.lower()) or "target"
    timestamp_str = datetime.now().strftime("%Y%m%d-%H%M%S")
    execution_id = f"{timestamp_str}-{slug}"

    run_dir = OUTPUT_DIR / "runs" / execution_id
    os.makedirs(str(run_dir), exist_ok=True)

    # 2. Construct CLI Command to invoke real run.py
    py_exe = sys.executable
    cmd = [
        py_exe,
        str(BASE_DIR / "run.py"),
        "--medicine-name", generic_name,
        "--brand-name", brand_name,
        "--therapeutic-class", therapeutic_class,
        "--dosage-form", dosage_form,
        "--strength", strength,
        "--medicine-price", str(medicine_price),
        "--total-samples", str(total_samples),
        "--sample-cost", str(sample_cost),
        "--sample-lift", str(sample_lift),
        "--units-per-rx", str(units_per_rx),
        "--variable-cost", str(variable_cost),
        "--output-dir", str(run_dir),
    ]

    print(f"[Flask] Spawning real subprocess run.py for execution {execution_id}: {' '.join(cmd)}")
    t0 = time.time()

    try:
        proc = subprocess.run(
            cmd,
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True,
            timeout=300
        )
    except subprocess.TimeoutExpired as te:
        err_msg = f"Pipeline execution timed out after 300 seconds for {execution_id}."
        print(f"[Flask] {err_msg}")
        return jsonify({
            "status": "error",
            "message": err_msg,
            "exit_code": 124,
            "stdout": te.stdout or "",
            "stderr": te.stderr or "Process timeout expired.",
            "execution_id": execution_id
        }), 500
    except Exception as ex:
        err_msg = f"Failed to launch subprocess run.py: {str(ex)}"
        print(f"[Flask] {err_msg}")
        return jsonify({
            "status": "error",
            "message": err_msg,
            "exit_code": 1,
            "stdout": "",
            "stderr": str(ex),
            "execution_id": execution_id
        }), 500

    duration = round(time.time() - t0, 2)

    # Save log files
    try:
        with open(str(run_dir / "stdout.log"), "w", encoding="utf-8") as f_out:
            f_out.write(proc.stdout or "")
        with open(str(run_dir / "stderr.log"), "w", encoding="utf-8") as f_err:
            f_err.write(proc.stderr or "")
    except Exception as _fe:
        print(f"[Flask] Warn saving log files: {_fe}")

    # 3. Handle Exit Code Errors (NO SILENT FALLBACK TO MOCK DATA)
    if proc.returncode != 0:
        print(f"[Flask] Subprocess run.py failed with exit code {proc.returncode} for execution {execution_id}")
        return jsonify({
            "status": "error",
            "message": f"ML Pipeline execution failed in run.py (exit code {proc.returncode}).",
            "exit_code": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "execution_id": execution_id,
            "duration_seconds": duration
        }), 500

    # 4. Parse & Return Real Result
    result_file = run_dir / "pipeline_result.json"
    res_data = {}
    if result_file.exists():
        with open(str(result_file), "r", encoding="utf-8") as f_res:
            res_data = json.load(f_res)
    else:
        svc = _get_svc()
        req_dict = {
            "medicine": {"generic_name": generic_name, "brand_name": brand_name, "therapeutic_class": therapeutic_class, "dosage_form": dosage_form, "strength": strength},
            "total_samples": int(total_samples), "medicine_price": float(medicine_price), "sample_cost": float(sample_cost),
            "expected_sample_lift": float(sample_lift), "average_units_per_prescription": float(units_per_rx), "variable_cost_per_unit": float(variable_cost), "mode": "new_analog"
        }
        res_data = svc.run(req_dict, output_dir=run_dir)

    res_data = _sanitize_json(res_data)
    res_data["status"] = "success"
    res_data["execution_id"] = execution_id
    res_data["stdout_logs"] = proc.stdout
    res_data["stderr_logs"] = proc.stderr
    res_data["execution_duration"] = duration
    res_data["run_dir"] = str(run_dir)

    _last_result = res_data
    _last_run_dir = run_dir

    print(f"[Flask] Pipeline execution {execution_id} completed successfully in {duration}s!")
    return jsonify(res_data)


# ── Top 100 HCPs ───────────────────────────────────────────────────────────────
@app.route("/api/hcps/top100")
def top100():
    if _last_result and "prescriber_distribution" in _last_result:
        recs = _last_result["prescriber_distribution"]
        return jsonify({"count": len(recs), "hcps": recs})
    recs = _load_csv_records("top_100_hcps.csv")
    return jsonify({"count": len(recs), "hcps": recs})


# ── All HCP Predictions & Allocation Universe (12,000 HCPs) ────────────────────
@app.route("/api/hcps/all")
def hcps_all():
    recs = _load_csv_records("hcp_predictions_all.csv")
    alloc_recs = _load_csv_records("sample_allocation.csv")
    alloc_map = {r["hcp_id"]: r.get("Samples", 0) for r in alloc_recs if "hcp_id" in r}

    from src.data.loader import load_data
    try:
        _, hcps_df, _ = load_data()
        hcp_name_map = dict(zip(hcps_df["hcp_id"], hcps_df["hcp_name"]))
        zone_map = dict(zip(hcps_df["hcp_id"], hcps_df["zone"]))
    except:
        hcp_name_map, zone_map = {}, {}

    for i, r in enumerate(recs, 1):
        r["rank"] = i
        r["hcp_name"] = hcp_name_map.get(r["hcp_id"], f"Dr. Prescriber #{str(r['hcp_id'])[-4:]}")
        if "zone" not in r or not r["zone"]:
            r["zone"] = zone_map.get(r["hcp_id"], "Central Zone")
        r["Samples"] = alloc_map.get(r["hcp_id"], 0)
        r["samples"] = r["Samples"]

    return jsonify({"count": len(recs), "hcps": recs})


# ── Allocation ─────────────────────────────────────────────────────────────────
@app.route("/api/allocation")
def allocation():
    if _last_result and "prescriber_distribution" in _last_result:
        return jsonify({"allocations": _last_result["prescriber_distribution"]})
    recs = _load_csv_records("sample_allocation.csv")
    return jsonify({"allocations": recs})


# ── Zones ──────────────────────────────────────────────────────────────────────
@app.route("/api/zones")
def zones():
    if _last_result and "zone_distribution" in _last_result:
        return jsonify({"zones": _last_result["zone_distribution"]})
    recs = _load_csv_records("zone_distribution.csv")
    return jsonify({"zones": recs})


# ── ROI ────────────────────────────────────────────────────────────────────────
@app.route("/api/roi", methods=["GET", "POST"])
def roi():
    if _last_result and "roi" in _last_result:
        r = _last_result["roi"]
        scenarios = _last_result.get("roi_scenarios", {})
        return jsonify({
            "sample_investment":   r.get("sample_investment", 0),
            "baseline_demand":     r.get("predicted_baseline_demand", 0),
            "incremental_rx":      r.get("expected_incremental_prescriptions", 0),
            "incremental_units":   r.get("expected_incremental_units", 0),
            "revenue":             r.get("expected_revenue", 0),
            "variable_cost":       r.get("expected_variable_cost", 0),
            "profit":              r.get("expected_incremental_profit", 0),
            "roi_pct":             r.get("projected_roi_percent", 0),
            "breakeven_lift":      r.get("breakeven_sample_lift", None),
            "breakeven_price":     r.get("breakeven_medicine_price", 0),
            "breakeven_sample_cost": r.get("breakeven_sample_cost", 0),
            "breakeven_rx":        r.get("breakeven_incremental_prescriptions", None),
            "disclaimer":          r.get("disclaimer", ""),
            "scenarios":           scenarios,
        })
    recs = _load_csv_records("roi_scenarios.csv")
    return jsonify({"scenarios": recs})


# ── ROI sensitivity ────────────────────────────────────────────────────────────
@app.route("/api/roi/sensitivity")
def roi_sensitivity():
    recs = _load_csv_records("roi_sensitivity.csv")
    return jsonify({"sensitivity": recs})


# ── Model performance ──────────────────────────────────────────────────────────
@app.route("/api/model/performance")
def model_performance():
    mc  = _load_csv_records("model_comparison.csv")
    rm  = _load_csv_records("ranking_metrics.csv")
    fi  = _load_csv_records("feature_importance.csv")
    return jsonify({
        "model_comparison":  mc,
        "ranking_metrics":   rm,
        "feature_importance":fi,
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[Flask] Starting Sample Drop Optimization API on http://0.0.0.0:{port}")
    app.run(debug=False, port=port, host="0.0.0.0")
