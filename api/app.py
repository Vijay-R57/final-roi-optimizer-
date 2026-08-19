"""
Flask API for Sample Drop Optimization.
Runs the ML pipeline on demand and exposes results via REST endpoints.
"""
import json, os, sys
from pathlib import Path

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from flask import Flask, jsonify, request
from flask_cors import CORS

from src.services.sample_drop_service import SampleDropService

app = Flask(__name__)
CORS(app)

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "outputs"

# ── Singleton service (loads data once) ──────────────────────────────────────
_svc = None
_last_result = None

def _get_svc():
    global _svc
    if _svc is None:
        _svc = SampleDropService()
    return _svc

def _load_json(fname):
    p = OUTPUT_DIR / fname
    if p.exists():
        with open(str(p)) as f:
            return json.load(f)
    return None

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


# ── Full prediction pipeline ───────────────────────────────────────────────────
@app.route("/api/predict", methods=["POST"])
def predict():
    global _last_result
    data = request.get_json() or {}
    req = {
        "medicine": {
            "generic_name":      data.get("generic_name", "Atorvastatin"),
            "brand_name":        data.get("brand_name", "Newstat"),
            "therapeutic_class": data.get("therapeutic_class", "Lipid Lowering"),
            "dosage_form":       data.get("dosage_form", "Tablet"),
            "strength":          data.get("strength", "10 mg"),
        },
        "total_samples":                  int(data.get("total_samples", 10000)),
        "medicine_price":                 float(data.get("medicine_price", 120)),
        "sample_cost":                    float(data.get("sample_cost", 0.0587)),
        "expected_sample_lift":           float(data.get("sample_lift", 0.10)),
        "average_units_per_prescription": float(data.get("units_per_rx", 2)),
        "variable_cost_per_unit":         float(data.get("variable_cost", 45)),
        "mode": "new_analog",
    }
    try:
        r = _get_svc().run(req)
        _last_result = r

        # Serialise non-trivial objects
        an = r["selected_similar_medicine"]
        return jsonify({
            "status": "success",
            "target":          req["medicine"],
            "analog": {
                "medicine_id":   an.get("medicine_id",""),
                "generic_name":  an.get("generic_name",""),
                "brand_name":    an.get("brand_name",""),
                "dosage_form":   an.get("dosage_form",""),
                "strength":      an.get("strength",""),
                "tier":          r["analog_tier"],
                "form_compat":   r["form_compat"],
                "score":         round(r["similarity_score"],4),
                "profile":       round(r["profile_similarity"],4),
                "behavior":      round(r["behavior_similarity"],4),
                "data_quality":  round(r["data_quality"],4),
                "historical_events":   r["historical_events"],
                "active_hcps":         r["active_hcps"],
                "historical_months":   r["historical_months"],
            },
            "dataset": {
                "events":       r["total_events"],
                "hcps":         r["unique_hcps_dataset"],
                "medicines":    r["unique_meds_dataset"],
                "date_range":   r["date_range"],
                "latest_date":  r["latest_event_date"],
                "forecast_start": r["forecast_start"],
                "forecast_end":   r["forecast_end"],
            },
            "hcp_universe": {
                "master":          r["hcp_master_count"],
                "eligible":        r["eligible_hcp_count"],
                "with_history":    r["hcps_with_history"],
                "without_history": r["hcps_without_history"],
                "predicted":       r["predicted_hcp_count"],
                "top_n":           r["top_n"],
                "selected":        r["selected_hcp_count"],
            },
            "model": {
                "best_pipeline":   r["best_pipeline"],
                "val_mae":         round(r["best_val_mae"],4),
                "val_wape":        round(r["best_val_wape"],4),
                "potential_auc":   round(r["potential_model_val_auc"],4),
                "blend_w_demand":  r["blend_w_demand"],
                "blend_w_pot":     r["blend_w_potential"],
                "val_ndcg100":     round(r["blend_val_ndcg100"],4),
            },
            "prediction_stats":     r["all_pred_stats"],
            "allocation_stats":     r["alloc_stats"],
            "allocated_samples":    r["allocated_samples"],
            "total_samples":        r["total_samples"],
            "validation":           r["validation_report"],
        })
    except Exception as e:
        import traceback
        return jsonify({"status": "error", "error": str(e),
                        "traceback": traceback.format_exc()}), 500


# ── Top 100 HCPs ───────────────────────────────────────────────────────────────
@app.route("/api/hcps/top100")
def top100():
    recs = _load_csv_records("top_100_hcps.csv")
    return jsonify({"count": len(recs), "hcps": recs})


# ── Allocation ─────────────────────────────────────────────────────────────────
@app.route("/api/allocation")
def allocation():
    recs = _load_csv_records("sample_allocation.csv")
    return jsonify({"allocations": recs})


# ── Zones ──────────────────────────────────────────────────────────────────────
@app.route("/api/zones")
def zones():
    recs = _load_csv_records("zone_distribution.csv")
    return jsonify({"zones": recs})


# ── ROI ────────────────────────────────────────────────────────────────────────
@app.route("/api/roi", methods=["GET", "POST"])
def roi():
    recs = _load_csv_records("roi_scenarios.csv")
    validation = _load_json("validation_report.json")
    if _last_result:
        r = _last_result["roi"]
        return jsonify({
            "sample_investment":   r["sample_investment"],
            "baseline_demand":     r["predicted_baseline_demand"],
            "incremental_rx":      r["expected_incremental_prescriptions"],
            "incremental_units":   r["expected_incremental_units"],
            "revenue":             r["expected_revenue"],
            "variable_cost":       r["expected_variable_cost"],
            "profit":              r["expected_incremental_profit"],
            "roi_pct":             r["projected_roi_percent"],
            "breakeven_lift":      r["breakeven_sample_lift"],
            "breakeven_price":     r["breakeven_medicine_price"],
            "breakeven_sample_cost": r["breakeven_sample_cost"],
            "breakeven_rx":        r["breakeven_incremental_prescriptions"],
            "disclaimer":          r["disclaimer"],
            "scenarios":           recs,
        })
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
    print("[Flask] Starting Sample Drop Optimization API on http://localhost:5000")
    # Run once to pre-populate outputs
    print("[Flask] Pre-running pipeline...")
    try:
        svc = _get_svc()
        req = {
            "medicine": {
                "generic_name": "Atorvastatin", "brand_name": "Newstat",
                "therapeutic_class": "Lipid Lowering",
                "dosage_form": "Tablet", "strength": "10 mg",
            },
            "total_samples": 10000, "medicine_price": 120.0,
            "sample_cost": 0.0587, "expected_sample_lift": 0.10,
            "average_units_per_prescription": 2,
            "variable_cost_per_unit": 45, "mode": "new_analog",
        }
        _last_result = svc.run(req)
        print("[Flask] Pipeline complete. API ready.")
    except Exception as e:
        print(f"[Flask] Pipeline pre-run failed: {e}")
    app.run(debug=False, port=5000, host="0.0.0.0")
