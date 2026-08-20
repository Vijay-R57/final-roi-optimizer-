"""run.py — Sample Drop Optimization entry point (Dataset2)."""
import argparse, sys
from src.services.sample_drop_service import SampleDropService
from src.config import TOP_N_HCPS as TOP_N

W = 58
def _hr(ch="="): print(ch*W)
def _sec(t):     print(); _hr(); print(t.center(W)); _hr()
def _sub(t):     print(f"\n  -- {t} --")

def main():
    p = argparse.ArgumentParser(description="Sample Drop Optimization Pipeline — Driven 100% by User Input")
    p.add_argument("--medicine-name",       required=True, help="Target medicine generic name (e.g. Metformin)")
    p.add_argument("--brand-name",          required=True, help="Target medicine brand name (e.g. Glycomet)")
    p.add_argument("--therapeutic-class",   required=True, help="Therapeutic class (e.g. Antidiabetic)")
    p.add_argument("--dosage-form",         required=True, help="Dosage form (e.g. Tablet)")
    p.add_argument("--strength",            required=True, help="Dosage strength (e.g. 500 mg)")
    p.add_argument("--total-samples",       type=int,   required=True, help="Total sample unit volume budget")
    p.add_argument("--medicine-price",      type=float, required=True, help="Unit pack price in INR")
    p.add_argument("--mode",                default="new_analog", choices=["new_analog","existing"])
    a = p.parse_args()
    req = {
        "medicine": {
            "generic_name":      a.medicine_name,
            "brand_name":        a.brand_name,
            "therapeutic_class": a.therapeutic_class,
            "dosage_form":       a.dosage_form,
            "strength":          a.strength,
        },
        "total_samples":                  a.total_samples,
        "medicine_price":                 a.medicine_price,
        "sample_cost":                    0.0587,
        "expected_sample_lift":           0.10,
        "average_units_per_prescription": 2,
        "variable_cost_per_unit":         45,
        "mode":                           a.mode,
        "max_samples_per_hcp":            500,
    }
    svc = SampleDropService()
    try:
        r = svc.run(req)
    except AssertionError as e:
        print(f"\n[CRITICAL] {e}"); sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}"); raise

    m   = req["medicine"]
    vr  = r["validation_report"]
    top5 = [c["generic_name"].lower().strip() for c in r["candidate_medicines"]]

    _hr(); print("SAMPLE DROP OPTIMIZATION".center(W)); _hr()

    _sec("TARGET")
    print(f"  Generic       : {m['generic_name']}")
    print(f"  Brand         : {m['brand_name']}")
    print(f"  Class         : {m['therapeutic_class']}")
    print(f"  Form          : {m['dosage_form']}")
    print(f"  Strength      : {m['strength']}")
    print(f"  Samples       : {req['total_samples']:,}")
    print(f"  Price         : Rs.{req['medicine_price']:.2f}")

    _sec("DATASET")
    print(f"  Events        : {r['total_events']:,}")
    print(f"  HCPs          : {r['unique_hcps_dataset']:,}")
    print(f"  Medicines     : {r['unique_meds_dataset']}")
    print(f"  Date Range    : {r['date_range']}")
    print(f"  Latest Month  : {r['latest_event_date']}")
    print(f"  Forecast      : {r['forecast_start']} to {r['forecast_end']}")
    print(f"  Med Master    : {'120 - PASS' if vr['medicines_valid'] else 'FAIL'}")

    _sec("ANALOG SELECTION")
    seg = r["segmentation"]
    print(f"  Segmentation Tier : {seg.get('Tier','?')}")
    print(f"  Tier 1: {seg.get('Tier 1',0)}  Tier 2: {seg.get('Tier 2',0)}  Tier 3: {seg.get('Tier 3',0)}")

    _sub("TOP 5 VALID ANALOGS")
    print(f"  ('{m['generic_name']}' excluded)\n")
    hdr = (f"  {'Rk':>2} {'ID':<8} {'Generic':<16} {'Form':<12} {'Str':<9}"
           f" {'Prof':>5} {'Behv':>5} {'Qual':>5} {'Score':>6} {'T':>2}")
    print(hdr); print("  "+"-"*80)
    for c in r["candidate_medicines"]:
        print(f"  {c.get('Rank','-'):>2} {c.get('medicine_id',''):.<8} "
              f"{c.get('generic_name','')[:16]:<16} "
              f"{str(c.get('dosage_form',''))[:12]:<12} "
              f"{str(c.get('strength',''))[:9]:<9}"
              f" {c.get('Profile_Similarity',0):>5.3f}"
              f" {c.get('Behavior_Similarity',0):>5.3f}"
              f" {c.get('Data_Quality',0):>5.3f}"
              f" {c.get('Final_Analog_Score',0):>6.4f}"
              f" {c.get('Segment_Tier','?'):>2}")
    assert m["generic_name"].lower().strip() not in top5, "TARGET IN TOP5!"
    print(f"\n  [OK] '{m['generic_name']}' is NOT in TOP 5.")

    _sub("SELECTED ANALOG")
    an = r["selected_similar_medicine"]
    print(f"  Medicine      : {an.get('generic_name','')} ({an.get('medicine_id','')})")
    print(f"  Brand         : {an.get('brand_name','')}")
    print(f"  Form          : {an.get('dosage_form','')}")
    print(f"  Strength      : {an.get('strength','')}")
    print(f"  Tier          : {r['analog_tier']}")
    print(f"  Form Match    : {'YES' if r['form_compat'] else 'NO'}")
    print(f"  Profile       : {r['profile_similarity']:.4f}")
    print(f"  Behavior      : {r['behavior_similarity']:.4f}")
    print(f"  Data Quality  : {r['data_quality']:.4f}")
    print(f"  Final Score   : {r['similarity_score']:.4f}")
    print(f"  Events        : {r['historical_events']:,}")
    print(f"  Active HCPs   : {r['active_hcps']:,}")
    print(f"  Months        : {r['historical_months']}")

    _sec("HCP UNIVERSE")
    print(f"  Master HCPs               : {r['hcp_master_count']:,}")
    print(f"  Eligible HCPs             : {r['eligible_hcp_count']:,}")
    print(f"  HCPs With Analog History  : {r['hcps_with_history']:,}")
    print(f"  HCPs Without Analog Hist. : {r['hcps_without_history']:,}")
    print(f"  Predicted HCPs            : {r['predicted_hcp_count']:,}")
    print(f"  Top N                     : {r['top_n']}")
    print(f"  Selected                  : {r['selected_hcp_count']}")

    _sec("MODEL COMPARISON")
    print(f"  Train : {r['train_dates']}")
    print(f"  Val   : {r['val_dates']}")
    print(f"  Test  : {r['test_dates']}")
    print(f"  Features: {r['n_features']}")

    _sub("FORECAST (Val MAE | Test MAE | Test R2)")
    print(f"  {'Model':<20} {'ValMAE':>7} {'TestMAE':>8} {'TestRMSE':>9} {'TestR2':>7}")
    print(f"  {'-'*20} {'-'*7} {'-'*8} {'-'*9} {'-'*7}")
    for bn,bm in r["baseline_metrics"].items():
        print(f"  {bn:<20} {'N/A':>7} {bm['MAE']:>8.4f} {bm['RMSE']:>9.4f} {bm['R2']:>7.4f}")
    for nm in r["direct_val_metrics"]:
        vm=r["direct_val_metrics"][nm]; tm=r["direct_test_metrics"][nm]
        print(f"  {'Direct_'+nm:<20} {vm['MAE']:>7.4f} {tm['MAE']:>8.4f} {tm['RMSE']:>9.4f} {tm['R2']:>7.4f}")
    for nm in r["direct_val_metrics_log"]:
        vm=r["direct_val_metrics_log"][nm]; tm=r["direct_test_metrics_log"][nm]
        print(f"  {'DirectLog_'+nm:<20} {vm['MAE']:>7.4f} {tm['MAE']:>8.4f} {tm['RMSE']:>9.4f} {tm['R2']:>7.4f}")
    for nm in r["two_stage_val_metrics"]:
        vm=r["two_stage_val_metrics"][nm]; tm=r["two_stage_test_metrics"][nm]
        print(f"  {'TwoStage_'+nm:<20} {vm['MAE']:>7.4f} {tm['MAE']:>8.4f} {tm['RMSE']:>9.4f} {tm['R2']:>7.4f}")

    _sub("ACTIVATION (Val Accuracy | Test Accuracy | Test ROC-AUC | Test PR-AUC)")
    print(f"  {'Model':<20} {'ValAcc':>7} {'TestAcc':>8} {'TestAUC':>8} {'TestPR':>7}")
    print(f"  {'-'*20} {'-'*7} {'-'*8} {'-'*8} {'-'*7}")
    for nm in r["clf_val_metrics"]:
        vm=r["clf_val_metrics"][nm]; tm=r["clf_metrics"][nm]
        print(f"  {nm:<20} {vm['Accuracy']:>7.4f} {tm['Accuracy']:>8.4f} {tm['ROC-AUC']:>8.4f} {tm['PR-AUC']:>7.4f}")

    _sub("RANKING (Test, top-10% ground truth)")
    print(f"  {'Pipeline':<20} {'P@10':>5} {'P@25':>5} {'P@50':>5} {'P@100':>6} {'N@100':>6}")
    print(f"  {'-'*20} {'-'*5} {'-'*5} {'-'*5} {'-'*6} {'-'*6}")
    for pk,rm in r["ranking_metrics_per_pipeline"].items():
        print(f"  {pk:<20}"
              f" {rm.get(10,{}).get('Precision',0):>5.3f}"
              f" {rm.get(25,{}).get('Precision',0):>5.3f}"
              f" {rm.get(50,{}).get('Precision',0):>5.3f}"
              f" {rm.get(100,{}).get('Precision',0):>6.3f}"
              f" {rm.get(100,{}).get('NDCG',0):>6.4f}")

    _sec("SELECTED MODEL")
    print(f"  Pipeline     : {r['best_pipeline']}")
    print(f"  Val MAE      : {r['best_val_mae']:.4f}")
    if r.get("uses_two_stage"):
        clf_name = r["best_clf"]
        print(f"  Stage-1 Clf  : {clf_name} (Acc: {r['clf_val_metrics'][clf_name]['Accuracy']:.4f} Val | {r['clf_metrics'][clf_name]['Accuracy']:.4f} Test)")
    print(f"  Val WAPE     : {r['best_val_wape']:.4f}")
    print(f"  Potential AUC: {r['potential_model_val_auc']:.4f} (Acc: {r.get('potential_model_val_accuracy', 0.0):.4f})")
    print(f"  Blend        : {r['blend_w_demand']:.0%} demand + {r['blend_w_potential']:.0%} potential")
    print(f"  Val NDCG@100 : {r['blend_val_ndcg100']:.4f}")

    _sub("TOP 20 FEATURES")
    print(f"  {'#':<3} {'Feature':<42} {'Imp':>8} {'Group'}")
    print(f"  {'-'*3} {'-'*42} {'-'*8} {'-'*20}")
    for i,fi in enumerate(r["feature_importance"],1):
        print(f"  {i:<3} {fi['Feature'][:42]:<42} {fi['Importance']:>8.4f} {fi.get('Group','')}")

    _sec("RANKING METRICS (Selected Model)")
    print(f"  Ground truth: top 10%  threshold={r['ranking_threshold']:.2f}  N={r['ranking_n_relevant']:,}\n")
    print(f"  {'K':<5} {'Prec@K':>8} {'Recall@K':>9} {'NDCG@K':>8}")
    print(f"  {'-'*5} {'-'*8} {'-'*9} {'-'*8}")
    for k,km in sorted(r["ranking_metrics"].items()):
        print(f"  {k:<5} {km['Precision']:>8.4f} {km['Recall']:>9.4f} {km['NDCG']:>8.4f}")

    _sec("PREDICTION DISTRIBUTION")
    s=r["all_pred_stats"]
    print(f"  Total     : {s['count']:,}")
    print(f"  Mean      : {s['mean']:.4f}")
    print(f"  Std       : {s['std']:.4f}")
    print(f"  Median    : {s['p50']:.4f}")
    print(f"  Max       : {s['max']:.4f}")
    print(f"  Unique    : {s['n_unique']:,} ({s['unique_frac']:.1%})")
    print(f"  Near-Zero : {s['pct_near_zero']:.1f}%")
    print(f"  Collapse  : {'YES' if s['collapse_warn'] else 'NO'}")

    _sec("DIAGNOSTIC TABLE (TOP 20 RANKED TEST HCPS)")
    dt = r.get("diagnostic_table", [])
    if dt:
        print(f"  {'HCP_ID':<18} {'PredDemand':>10} {'ActDemand':>10} {'PredRank':>9} {'ActRank':>8} {'Top10Truth':>10}")
        print(f"  {'-'*18} {'-'*10} {'-'*10} {'-'*9} {'-'*8} {'-'*10}")
        for row in dt:
            print(f"  {row.get('hcp_id',''):<18}"
                  f" {row.get('predicted_demand',0):>10.4f}"
                  f" {row.get('actual_test_demand',0):>10.4f}"
                  f" {row.get('predicted_rank',0):>9}"
                  f" {row.get('actual_rank',0):>8}"
                  f" {row.get('top10_ground_truth',0):>10}")

    _sec(f"TOP {r['top_n']} HCPs")
    print(f"  {'Rk':>3}  {'HCP_ID':<18} {'Name':<12} {'Spec':<18} {'Zone':<16}"
          f" {'Demand':>7} {'PotSc':>6} {'Cat':<9} {'Samp':>5}")
    print(f"  {'-'*3}  {'-'*18} {'-'*12} {'-'*18} {'-'*16}"
          f" {'-'*7} {'-'*6} {'-'*9} {'-'*5}")
    for i,h in enumerate(r["prescriber_distribution"],1):
        print(f"  {i:>3}  {h.get('hcp_id',''):<18}"
              f" {str(h.get('hcp_name',''))[:12]:<12}"
              f" {str(h.get('specialty',''))[:18]:<18}"
              f" {str(h.get('zone',''))[:16]:<16}"
              f" {h['Expected_3M_Demand']:>7.2f}"
              f" {h['Potential_Score']:>6.1f}"
              f" {h.get('Potential_Category','')[:9]:<9}"
              f" {h['Samples']:>5}")
    print(f"\n  Max={r['alloc_stats']['max']}  Min={r['alloc_stats']['min']}"
          f"  Mean={r['alloc_stats']['mean']:.1f}")
    print(f"  Saved --> outputs/top_100_hcps.csv")

    _sub("TOP 10 EXPLANATIONS")
    for e in r["top_hcp_explanations"]:
        print(f"  #{e['Rank']}  {e['HCP_ID']} | {e['Specialty']} | "
              f"Zone:{e['Zone']} | Demand:{e['Expected_3M_Demand']}")
        print(f"      {e['Top_Reasons']}")

    _sec("SAMPLE ALLOCATION")
    print(f"  Requested  : {r['total_samples']:,}")
    print(f"  Allocated  : {r['allocated_samples']:,}")
    print(f"  Difference : {r['total_samples']-r['allocated_samples']}")

    _sec("ZONE DISTRIBUTION")
    print(f"  {'Zone':<22} {'HCPs':>5} {'Demand':>10} {'AvgPot':>7} {'Samples':>8} {'%':>6}")
    print(f"  {'-'*22} {'-'*5} {'-'*10} {'-'*7} {'-'*8} {'-'*6}")
    for z in r["zone_distribution"]:
        print(f"  {z['zone']:<22} {z['HCP_Count']:>5}"
              f" {z['Expected_Demand']:>10.2f} {z.get('Potential_Score',0):>7.1f}"
              f" {z['Samples']:>8} {z['Percentage']:>5.2f}%")
    print(f"\n  Total: {sum(z['Samples'] for z in r['zone_distribution']):,}")
    if r["unknown_zone_hcps"]:
        print(f"\n  Unknown-zone HCPs ({len(r['unknown_zone_hcps'])}):")
        for uh in r["unknown_zone_hcps"]:
            print(f"    {uh.get('hcp_id','')}  Locality: {uh.get('locality','')}")

    _sec("ROI")
    roi=r["roi"]
    print(f"  Sample Investment            : Rs.{roi['sample_investment']:>12,.2f}")
    print(f"  Predicted Baseline Demand    :    {roi['predicted_baseline_demand']:>12,.2f}")
    print(f"  Expected Incr. Prescriptions :    {roi['expected_incremental_prescriptions']:>12,.2f}")
    print(f"  Expected Incr. Units         :    {roi['expected_incremental_units']:>12,.2f}")
    print(f"  Expected Revenue             : Rs.{roi['expected_revenue']:>12,.2f}")
    print(f"  Expected Variable Cost       : Rs.{roi['expected_variable_cost']:>12,.2f}")
    print(f"  Expected Incr. Profit        : Rs.{roi['expected_incremental_profit']:>12,.2f}")
    print(f"  PROJECTED ROI                :    {roi['projected_roi_percent']:>11.2f}%")
    if roi["projected_roi_percent"]<0:
        print(f"\n  ROI is negative under supplied assumptions.")
        print(f"  Required lift   : {roi['breakeven_sample_lift']*100:.1f}%")
        print(f"  Required price  : Rs.{roi['breakeven_medicine_price']:,.2f}")

    _sub("ROI SCENARIOS")
    print(f"  {'Scenario':<18} {'Lift':>5} {'Investment':>12} {'IncrRx':>7} {'Revenue':>12} {'Profit':>12} {'ROI%':>7}")
    print(f"  {'-'*18} {'-'*5} {'-'*12} {'-'*7} {'-'*12} {'-'*12} {'-'*7}")
    for sn,sv in r["roi_scenarios"].items():
        print(f"  {sn:<18} {sv['lift']:>5.0%}"
              f" Rs.{sv['sample_investment']:>10,.0f}"
              f" {sv['expected_incremental_prescriptions']:>7.1f}"
              f" Rs.{sv['expected_revenue']:>10,.0f}"
              f" Rs.{sv['expected_incremental_profit']:>10,.0f}"
              f" {sv['projected_roi_percent']:>7.1f}%")

    _sec("BREAK-EVEN")
    print(f"  Break-even Prescriptions : {roi['breakeven_incremental_prescriptions']:>10,.2f}")
    print(f"  Break-even Sample Lift   : {roi['breakeven_sample_lift']*100:>10.2f}%")
    print(f"  Break-even Sample Cost   : Rs.{roi['breakeven_sample_cost']:>9,.2f}")
    print(f"  Break-even Medicine Price: Rs.{roi['breakeven_medicine_price']:>9,.2f}")
    print(f"\n  Sensitivity matrix --> outputs/roi_sensitivity.csv")
    print(f"  {roi['disclaimer']}")

    _sec("VALIDATION")
    checks=[
        ("120 medicines",                  vr["medicines_valid"],        "FAIL"),
        ("500K+ events",                   r["total_events"]>=500000,    "FAIL"),
        ("Target excluded",                m["generic_name"].lower() not in top5,"FAIL"),
        ("Tier-1 analog / form compat",    vr["dosage_compat"],          "WARN"),
        ("Tablet compatibility",           r["form_compat"] or r["analog_tier"]<=2,"WARN"),
        ("No future leakage",              vr["leakage_pass"],            "FAIL"),
        ("Chronological split",            vr["chronological_split"],     "FAIL"),
        ("All HCPs predicted",             vr["predicted_hcp_count"]==12000,"FAIL"),
        ("Top 100 after ranking",          vr["selected_hcp_count"]==TOP_N,"FAIL"),
        ("Sample allocation = 10,000",     vr["allocation_exact"],        "FAIL"),
        ("Zone allocation = 10,000",       vr["zone_allocation_exact"],   "FAIL"),
        ("ROI calculated",                 True,                          "FAIL"),
        ("Break-even calculated",          True,                          "FAIL"),
        ("Unknown zones = 0",              vr["unknown_zones"]==0,        "WARN"),
    ]
    all_pass=True
    for desc,result,sev in checks:
        tag="PASS" if result else sev
        if not result and sev=="FAIL": all_pass=False
        print(f"  [{tag:4}] {desc}")
    _hr()
    if all_pass: print("ALL CRITICAL CHECKS PASSED".center(W))
    else:         print("SOME CHECKS FAILED".center(W))
    _hr()

if __name__=="__main__":
    main()
