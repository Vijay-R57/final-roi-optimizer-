"""
SampleDropService — fully adapted for Dataset2.

All column references use internal schema names from schema_mapper.py.
Dataset2 columns:
  Medicine : medicine_id, generic_name, brand_name, therapeutic_class,
             dosage_form, strength, unit_price, sample_eligible
  HCP      : hcp_id, hcp_name, specialty, city, locality, zone
  Events   : hcp_id, medicine_id, purchase_date,
             claims, fills, days_supply, quantity,
             beneficiaries, drug_cost
"""

import json, os, warnings
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier, CatBoostRegressor
from sklearn.metrics import (
    accuracy_score, auc, f1_score, mean_absolute_error, mean_squared_error,
    precision_recall_curve, precision_score, r2_score,
    recall_score, roc_auc_score,
)

from src.allocation import allocate
from src.config import (
    MIN_ACTIVE_PRESCRIBERS, MIN_EVENTS, MIN_MONTHS_HISTORY,
    OUTPUT_DIR, TOP_N_HCPS, MAX_SAMPLES_PER_HCP,
    PREDICTION_COLLAPSE_THRESHOLD,
    TRAIN_SPLIT_RATIO, VAL_SPLIT_RATIO,
    BLEND_WEIGHT_CANDIDATES, DEFAULT_BLEND_DEMAND_WEIGHT,
    POTENTIAL_TIER_THRESHOLDS,
)
from src.data.loader import load_data
from src.data.schema_mapper import (
    C_MED_ID, C_GNRC, C_BRAND, C_TC, C_FORM, C_STR, C_PRICE, C_ELIG,
    C_HCP_ID, C_HCP_NAME, C_SPEC, C_CITY, C_LOCALITY, C_ZONE,
    C_PDATE, C_CLAIMS, C_FILLS, C_DAYS, C_QTY, C_BENES, C_DCOST,
)
from src.roi import calculate, calculate_scenarios, sensitivity_matrix
from src.segmentation.segmentation_service import SegmentationService
from src.similarity.similarity_service import SimilarityService

warnings.filterwarnings("ignore")
os.makedirs(str(OUTPUT_DIR), exist_ok=True)

# ── metric helpers ────────────────────────────────────────────────────────────
def _wape(yt, yp):
    d = np.sum(np.abs(yt))
    return float(np.sum(np.abs(yt-yp))/d) if d>0 else 0.0
def _pr_auc(yt,yp):
    p,r,_=precision_recall_curve(yt,yp); return float(auc(r,p))
def _mae(a,b):  return float(mean_absolute_error(a,b))
def _rmse(a,b): return float(np.sqrt(mean_squared_error(a,b)))
def _r2(a,b):   return float(r2_score(a,b))
def _reg_metrics(yt,yp):
    return {"MAE":_mae(yt,yp),"RMSE":_rmse(yt,yp),
            "WAPE":_wape(np.asarray(yt,float),np.asarray(yp,float)),"R2":_r2(yt,yp)}

def _expanding_cv_r2(X, y, dates, params, folds=3):
    """Rolling validation using only pre-test rows; returns fold R2 values."""
    unique = sorted(pd.Series(dates).dropna().unique())
    if len(unique) < folds + 2:
        return []
    edges = np.linspace(max(2, len(unique)//3), len(unique)-1, folds, dtype=int)
    scores=[]
    for edge in edges:
        train_dates=set(unique[:edge]); val_date=unique[edge]
        tr=np.array([d in train_dates for d in dates]); va=np.array([d == val_date for d in dates])
        if tr.sum()==0 or va.sum()==0: continue
        model=XGBRegressor(**params, random_state=100+len(scores), n_jobs=-1)
        model.fit(X[tr], y[tr]); scores.append(float(r2_score(y[va], np.maximum(model.predict(X[va]),0))))
    return scores

# ── ranking helpers ───────────────────────────────────────────────────────────
def _dcg(rel):
    return sum(v/np.log2(i+2) for i,v in enumerate(rel))
def _ndcg_k(ys,k):
    n=min(k,len(ys)); d=_dcg(ys[:n]); id=_dcg(sorted(ys,reverse=True)[:n])
    return d/id if id>0 else 0.0
def ranking_metrics(y_true, y_pred, ks=(10,25,50,100)):
    y_true=np.asarray(y_true,float); y_pred=np.asarray(y_pred,float)
    n_rel=max(1,int(np.ceil(len(y_true)*0.10)))
    thresh=np.sort(y_true)[::-1][n_rel-1]
    rel=(y_true>=thresh).astype(float); total=int(rel.sum())
    order=np.argsort(-y_pred); rel_s=rel[order]; y_s=y_true[order]
    out={}
    for k in ks:
        k=min(k,len(y_true)); hits=int(rel_s[:k].sum())
        out[k]={"Precision":round(hits/k,4),
                "Recall":round(hits/total,4) if total>0 else 0.0,
                "NDCG":round(_ndcg_k((y_s>=thresh).astype(float),k),4)}
    return out, total, float(thresh)

# ── trend slope ───────────────────────────────────────────────────────────────
def _rolling_slope(series, window):
    n=window; xs=n*(n-1)/2.0; xsq=n*(n-1)*(2*n-1)/6.0
    denom=float(n*xsq-xs**2)
    if denom==0: return pd.Series(0.0,index=series.index)
    vals=series.to_numpy(dtype=float); out=np.zeros(len(vals)); xa=np.arange(n,dtype=float)
    for i in range(n,len(vals)):
        w=vals[i-n:i]
        if np.any(np.isnan(w)): continue
        out[i]=(n*np.dot(xa,w)-xs*w.sum())/denom
    return pd.Series(out,index=series.index)

# ── leakage checker ───────────────────────────────────────────────────────────
def check_leakage(features, agg_df):
    issues=[]
    # The agg DataFrame uses capitalised "Quantity" after groupby.agg
    qty_col = "Quantity" if "Quantity" in agg_df.columns else C_QTY
    q=agg_df[qty_col].values
    for shift,tag in [(np.roll(q,-1),"T+1"),(np.roll(q,-2),"T+2"),(np.roll(q,-3),"T+3")]:
        shift[-abs(int(tag[-1])):]=np.nan
        for f in features:
            if f not in agg_df.columns: continue
            fv=agg_df[f].fillna(0).values; mask=~np.isnan(shift)
            if mask.sum()<10: continue
            if np.allclose(fv[mask],shift[mask],atol=1e-6):
                issues.append({"feature":f,"leaks":tag})
    return {"leakage_detected":len(issues)>0,"issues":issues}


class SampleDropService:
    def __init__(self):
        self.meds, self.hcps, self.events = load_data()
        self.events["Month_Start"] = (
            self.events[C_PDATE].dt.to_period("M").dt.to_timestamp()
        )

    # =========================================================================
    def run(self, req, output_dir=None):
        target = req["medicine"]
        mode   = req.get("mode","new_analog")
        MAX_CAP = req.get("max_samples_per_hcp", MAX_SAMPLES_PER_HCP)
        out_dir = str(output_dir) if output_dir else str(OUTPUT_DIR)
        os.makedirs(out_dir, exist_ok=True)

        # ── 1. Dataset stats ──────────────────────────────────────────────
        n_events  = len(self.events)
        n_hcps    = self.events[C_HCP_ID].nunique()
        n_meds    = self.events[C_MED_ID].nunique()
        date_min  = self.events[C_PDATE].min()
        date_max  = self.events[C_PDATE].max()

        inference_date = self.events["Month_Start"].max()
        forecast_start = inference_date + pd.DateOffset(months=1)
        forecast_end   = inference_date + pd.DateOffset(months=3)

        print(f"\n[DATASET] Events={n_events:,}  HCPs={n_hcps:,}  "
              f"Meds={n_meds}  Range={date_min.date()} to {date_max.date()}")
        print(f"[FORECAST] Through {inference_date.date()}  "
              f"| Next: {forecast_start.date()} to {forecast_end.date()}")

        # ── 2. Resolve target ────────────────────────────────────────────
        med_match = self.meds[
            (self.meds[C_GNRC].str.lower()  == target["generic_name"].lower())
          & (self.meds[C_TC].str.lower()    == target["therapeutic_class"].lower())
          & (self.meds[C_FORM].str.lower()  == target["dosage_form"].lower())
          & (self.meds[C_STR].fillna("").astype(str).str.lower()
             == str(target.get("strength","")).lower())
        ]
        medicine_exists = not med_match.empty
        matched_id      = med_match.iloc[0][C_MED_ID] if medicine_exists else None
        excluded_id      = matched_id if mode=="new_analog" else None
        excluded_generic = target["generic_name"] if mode=="new_analog" else None

        # ── 3. Segmentation ───────────────────────────────────────────────
        candidates, seg_info = SegmentationService().candidates(
            target, self.meds,
            excluded_id=excluded_id, excluded_generic=excluded_generic,
        )
        if candidates.empty:
            raise ValueError("No eligible candidates after target exclusion.")
        cand_generics = set(candidates[C_GNRC].str.lower().str.strip())
        assert target["generic_name"].lower().strip() not in cand_generics, \
            f"CRITICAL: target in candidates!"

        # ── 4. Event stats for scoring ───────────────────────────────────
        ev_stats = (
            self.events.groupby(C_MED_ID)
            .agg(Historical_Events =(C_QTY,"count"),
                 Active_HCPs       =(C_HCP_ID,"nunique"),
                 Historical_Months =("Month_Start","nunique"),
                 Avg_Monthly_Qty   =(C_QTY,"mean"),
                 Total_Qty         =(C_QTY,"sum"))
            .reset_index()
        )
        c3m = inference_date - pd.DateOffset(months=3)
        c6m = inference_date - pd.DateOffset(months=6)
        for cutoff,col in [(c3m,"Recent_3M_Qty"),(c6m,"Recent_6M_Qty")]:
            tmp = (self.events[self.events["Month_Start"]>cutoff]
                   .groupby(C_MED_ID)[C_QTY].sum().reset_index(name=col))
            ev_stats = ev_stats.merge(tmp,on=C_MED_ID,how="left")
            ev_stats[col] = ev_stats[col].fillna(0)
        ev_stats["Monthly_Avg"] = ev_stats["Total_Qty"]/ev_stats["Historical_Months"].clip(lower=1)
        ev_stats["Growth_Rate"] = (
            (ev_stats["Recent_3M_Qty"]/3)/ev_stats["Monthly_Avg"].clip(lower=0.01)-1
        ).clip(-2,2)
        ev_stats["HCP_Coverage"] = ev_stats["Active_HCPs"]/len(self.hcps)

        # ── 5. Similarity ranking ────────────────────────────────────────
        ranked = SimilarityService().rank(target, candidates, ev_stats)
        assert target["generic_name"].lower().strip() not in set(
            ranked[C_GNRC].str.lower().str.strip())
        top5_cols = ["Rank",C_MED_ID,C_GNRC,C_BRAND,C_TC,C_FORM,C_STR,
                     "Segment_Tier","Strength_Compat",
                     "Profile_Similarity","Behavior_Similarity",
                     "Data_Quality","Final_Analog_Score"]
        top_candidates = ranked[[c for c in top5_cols if c in ranked.columns]].head(5).to_dict("records")
        ranked_ws = ranked.merge(ev_stats,on=C_MED_ID,how="left").fillna(0)

        # ── 6. Analog selection ──────────────────────────────────────────
        qualified = ranked_ws[
            (ranked_ws["Historical_Events"] >= MIN_EVENTS)
          & (ranked_ws["Active_HCPs"]       >= MIN_ACTIVE_PRESCRIBERS)
          & (ranked_ws["Historical_Months"] >= MIN_MONTHS_HISTORY)
        ].copy()
        if qualified.empty:
            raise ValueError("No candidate passes data-quality gates.")

        def _norm(s):
            mn,mx=s.min(),s.max()
            return (s-mn)/(mx-mn) if mx>mn else pd.Series(np.zeros(len(s)),index=s.index)

        qualified["_comp"] = (
            0.5*_norm(qualified["Final_Analog_Score"])
          + 0.3*_norm(np.log1p(qualified["Historical_Events"]))
          + 0.2*_norm(qualified["Active_HCPs"])
        )
        analog = qualified.sort_values("_comp",ascending=False).iloc[0]
        assert analog[C_GNRC].lower().strip() != target["generic_name"].lower().strip()

        target_form = str(target.get("dosage_form","")).strip().lower()
        analog_form = str(analog.get(C_FORM,"")).strip().lower()
        form_compat = (target_form == analog_form)
        analog_tier = int(analog.get("Segment_Tier",3))
        print(f"\n[ANALOG] {analog[C_GNRC]} ({analog[C_FORM]}) "
              f"Tier={analog_tier} Score={analog['Final_Analog_Score']:.4f} Form={form_compat}")

        # Save analog candidates CSV
        analog_cands_df = ranked_ws[[c for c in [
            "Rank",C_MED_ID,C_GNRC,C_BRAND,C_TC,C_FORM,C_STR,
            "Segment_Tier","Profile_Similarity","Behavior_Similarity",
            "Data_Quality","Final_Analog_Score",
            "Historical_Events","Active_HCPs","Historical_Months",
        ] if c in ranked_ws.columns]].copy()
        analog_cands_df["Quality_Status"] = analog_cands_df.apply(
            lambda r: "OK" if (
                r.get("Historical_Events",0)>=MIN_EVENTS
                and r.get("Active_HCPs",0)>=MIN_ACTIVE_PRESCRIBERS
                and r.get("Historical_Months",0)>=MIN_MONTHS_HISTORY
            ) else "INSUFFICIENT", axis=1)
        analog_cands_df.to_csv(str(OUTPUT_DIR/"analog_candidates.csv"),index=False)
        cands_records = []
        for i, r in enumerate(analog_cands_df.head(10).to_dict("records"), 1):
            cands_records.append({
                "rank": i,
                "medicine_id": r.get(C_MED_ID, ""),
                "generic_name": r.get(C_GNRC, ""),
                "brand_name": r.get(C_BRAND, ""),
                "therapeutic_class": r.get(C_TC, ""),
                "dosage_form": r.get(C_FORM, ""),
                "strength": r.get(C_STR, ""),
                "tier": r.get("Segment_Tier", ""),
                "profile_similarity": float(r.get("Profile_Similarity", 0.9)),
                "behavior_similarity": float(r.get("Behavior_Similarity", 0.9)),
                "data_quality": float(r.get("Data_Quality", 0.9)),
                "final_analog_score": float(r.get("Final_Analog_Score", 0.9)),
                "historical_events": int(r.get("Historical_Events", 0)),
                "active_hcps": int(r.get("Active_HCPs", 0)),
                "historical_months": int(r.get("Historical_Months", 0)),
            })

        # ── 7. HCP × Month panel for selected analog ──────────────────────
        ev = self.events[self.events[C_MED_ID]==analog[C_MED_ID]].copy()
        agg = (ev.groupby([C_HCP_ID,"Month_Start"])
               .agg(Quantity    =(C_QTY,   "sum"),
                    Claims      =(C_CLAIMS, "sum"),
                    Beneficiaries=(C_BENES, "sum"),
                    Drug_Cost   =(C_DCOST,  "sum"),
                    Fills       =(C_FILLS,  "sum"),
                    Days_Supply =(C_DAYS,   "sum"))
               .reset_index())

        all_analog_hcps = agg[C_HCP_ID].unique()
        min_date, max_date = agg["Month_Start"].min(), agg["Month_Start"].max()
        all_months = pd.date_range(min_date, max_date, freq="MS")
        n_months   = len(all_months)
        idx = pd.MultiIndex.from_product(
            [all_analog_hcps, all_months], names=[C_HCP_ID,"Month_Start"])
        agg = (agg.set_index([C_HCP_ID,"Month_Start"]).reindex(idx)
               .fillna(0).reset_index().sort_values([C_HCP_ID,"Month_Start"]))
        g = agg.groupby(C_HCP_ID)

        # ── 8. Targets ────────────────────────────────────────────────────
        agg["future_3_month_demand"] = (
            g["Quantity"].shift(-1).fillna(0)
          + g["Quantity"].shift(-2).fillna(0)
          + g["Quantity"].shift(-3).fillna(0)
        )
        agg["future_3m_log1p"] = np.log1p(agg["future_3_month_demand"])
        agg["target_active"]   = (agg["future_3_month_demand"]>0).astype(int)

        # ── 9. Lag / rolling features ─────────────────────────────────────
        for lag in [1,2,3,6,12]:
            agg[f"qty_lag_{lag}"] = g["Quantity"].shift(lag)
        for lag in [1,2,3]:
            agg[f"claims_lag_{lag}"] = g["Claims"].shift(lag)
            agg[f"benes_lag_{lag}"]  = g["Beneficiaries"].shift(lag)
        for win,lbl in [(3,"3m"),(6,"6m"),(12,"12m")]:
            agg[f"qty_mean_{lbl}"] = g["Quantity"].transform(
                lambda x,w=win: x.shift(1).rolling(w,min_periods=1).mean())
            agg[f"qty_std_{lbl}"]  = g["Quantity"].transform(
                lambda x,w=win: x.shift(1).rolling(w,min_periods=1).std()).fillna(0)
        # Persistent HCP-level prior, computed only from observations before T.
        # This gives the regressor a stable signal for HCPs with repeated behavior.
        agg["hcp_prior_qty_mean"] = g["Quantity"].transform(
            lambda x: x.shift(1).expanding(min_periods=1).mean()).fillna(0)
        for col in ["Claims","Beneficiaries","Drug_Cost","Fills","Days_Supply"]:
            for win,lbl in [(3,"3m"),(6,"6m")]:
                agg[f"{col.lower()}_mean_{lbl}"] = g[col].transform(
                    lambda x,w=win: x.shift(1).rolling(w,min_periods=1).mean())
        agg["qty_max_6m"] = g["Quantity"].transform(
            lambda x: x.shift(1).rolling(6,min_periods=1).max())
        agg["qty_min_6m"] = g["Quantity"].transform(
            lambda x: x.shift(1).rolling(6,min_periods=1).min())

        # Analog recent windows (features, not targets)
        c1m = inference_date - pd.DateOffset(months=1)
        for cutoff,col in [(c1m,"analog_r1m"),(c3m,"analog_r3m"),(c6m,"analog_r6m")]:
            tmp = (ev[ev["Month_Start"]>cutoff].groupby(C_HCP_ID)[C_QTY]
                   .sum().reset_index(name=col))
            agg = agg.merge(tmp,on=C_HCP_ID,how="left"); agg[col]=agg[col].fillna(0)

        # Growth
        agg["growth_1m"]  = agg["qty_lag_1"].fillna(0)-agg["qty_lag_2"].fillna(0)
        agg["growth_3m"]  = agg["qty_lag_1"].fillna(0)-agg["qty_lag_3"].fillna(0)
        agg["growth_6m"]  = agg["qty_lag_1"].fillna(0)-agg["qty_lag_6"].fillna(0)
        agg["growth_12m"] = agg["qty_lag_1"].fillna(0)-agg["qty_lag_12"].fillna(0)

        # Trend slopes
        for win in [3,6,12]:
            agg[f"trend_slope_{win}m"] = g["Quantity"].transform(
                lambda x,w=win: _rolling_slope(x,w)).fillna(0)

        # ── 10. Analog aggregate features ─────────────────────────────────
        hcp_analog = (agg.groupby(C_HCP_ID)
                      .agg(analog_total_qty   =("Quantity","sum"),
                           analog_total_claims=("Claims","sum"),
                           analog_total_benes =("Beneficiaries","sum"),
                           analog_total_dcost =("Drug_Cost","sum"),
                           analog_active_months=("Quantity",lambda x:(x>0).sum()))
                      .reset_index())
        agg = agg.merge(hcp_analog,on=C_HCP_ID,how="left")
        agg["analog_frequency"] = agg["analog_active_months"]/n_months
        agg["analog_avg_qty"]   = (agg["analog_total_qty"]
                                   /agg["analog_active_months"].clip(lower=1))
        agg["analog_qty_var"]   = (agg["qty_std_6m"]
                                   /agg["qty_mean_6m"].clip(lower=0.01))

        def _recency(s):
            out,last=[],np.nan
            for i,v in enumerate(s.values):
                if v>0: last=i
                out.append(i-last if not np.isnan(last) else n_months)
            return pd.Series(out,index=s.index,dtype=float)
        agg["analog_recency"] = g["Quantity"].transform(_recency)
        m_tot = agg.groupby("Month_Start")["Quantity"].transform("sum")
        agg["analog_share"] = np.where(m_tot>0,agg["Quantity"]/m_tot,0.0)

        for win,lbl in [(3,"3m"),(6,"6m"),(12,"12m")]:
            agg[f"pfreq_{lbl}"] = g["Quantity"].transform(
                lambda x,w=win: x.shift(1).rolling(w,min_periods=1)
                                 .apply(lambda v:(v>0).sum(),raw=True))

        # Seasonal
        agg["month"]     = agg["Month_Start"].dt.month
        agg["month_sin"] = np.sin(2*np.pi*agg["month"]/12)
        agg["month_cos"] = np.cos(2*np.pi*agg["month"]/12)

        # ── 11. Merge HCP master (Zone comes directly from Dataset2!) ─────
        agg = agg.merge(self.hcps,on=C_HCP_ID,how="left")
        agg[C_SPEC]     = agg[C_SPEC].fillna("Unknown").astype(str)
        agg[C_LOCALITY] = agg[C_LOCALITY].fillna("Unknown").astype(str)
        agg[C_ZONE]     = agg[C_ZONE].fillna("Unknown").astype(str)

        # ── 12. HCP overall features (ALL events) ─────────────────────────
        hcp_overall = (
            self.events.groupby(C_HCP_ID)
            .agg(hcp_total_qty   =(C_QTY,   "sum"),
                 hcp_total_claims=(C_CLAIMS, "sum"),
                 hcp_total_fills =(C_FILLS,  "sum"),
                 hcp_total_benes =(C_BENES,  "sum"),
                 hcp_total_dcost =(C_DCOST,  "sum"),
                 hcp_active_months=("Month_Start","nunique"),
                 hcp_med_count   =(C_MED_ID, "nunique"))
            .reset_index()
        )
        hcp_overall["hcp_avg_qty"] = (hcp_overall["hcp_total_qty"]
                                       /hcp_overall["hcp_active_months"].clip(lower=1))
        # Recent windows
        c12m = inference_date - pd.DateOffset(months=12)
        for cutoff,lbl in [(c1m,"1m"),(c3m,"3m"),(c6m,"6m"),(c12m,"12m")]:
            for src,feat in [(C_QTY,f"hcp_r{lbl}_qty"),(C_CLAIMS,f"hcp_r{lbl}_claims")]:
                tmp = (self.events[self.events["Month_Start"]>cutoff]
                       .groupby(C_HCP_ID)[src].sum().reset_index(name=feat))
                hcp_overall = hcp_overall.merge(tmp,on=C_HCP_ID,how="left")
                hcp_overall[feat] = hcp_overall[feat].fillna(0)

        hcp_overall["hcp_growth_3m"]  = (hcp_overall["hcp_r3m_qty"]
                                          -hcp_overall["hcp_r6m_qty"]/2).fillna(0)
        hcp_overall["hcp_growth_6m"]  = (hcp_overall["hcp_r6m_qty"]
                                          -hcp_overall["hcp_r12m_qty"]/2).fillna(0)
        hcp_overall["hcp_growth_12m"] = hcp_overall["hcp_r12m_qty"].fillna(0)

        # HCP trend slopes
        hm = (self.events.groupby([C_HCP_ID,"Month_Start"])[C_QTY]
              .sum().reset_index().sort_values([C_HCP_ID,"Month_Start"]))
        hmg = hm.groupby(C_HCP_ID)
        for win in [3,6,12]:
            hm[f"hts_{win}m"] = hmg[C_QTY].transform(
                lambda x,w=win: _rolling_slope(x,w)).fillna(0)
        last_hm = hm.groupby(C_HCP_ID).last().reset_index()[
            [C_HCP_ID,"hts_3m","hts_6m","hts_12m"]]
        last_hm.columns=[C_HCP_ID,"hcp_ts_3m","hcp_ts_6m","hcp_ts_12m"]
        hcp_overall = hcp_overall.merge(last_hm,on=C_HCP_ID,how="left")
        for c in ["hcp_ts_3m","hcp_ts_6m","hcp_ts_12m"]:
            hcp_overall[c] = hcp_overall[c].fillna(0)

        # TC count + diversity
        tc_cnt = (self.events.groupby(C_HCP_ID)[C_TC].nunique()
                  .reset_index(name="hcp_tc_count"))
        hcp_overall = hcp_overall.merge(tc_cnt,on=C_HCP_ID,how="left")
        hcp_overall["hcp_tc_count"] = hcp_overall["hcp_tc_count"].fillna(0)
        hcp_overall["med_diversity"] = (hcp_overall["hcp_med_count"]
                                         /hcp_overall["hcp_active_months"].clip(lower=1))
        hcp_overall["tc_diversity"]  = (hcp_overall["hcp_tc_count"]
                                         /hcp_overall["hcp_med_count"].clip(lower=1))

        # months since last prescription
        last_pres = (self.events.groupby(C_HCP_ID)["Month_Start"].max()
                     .reset_index(name="_lp"))
        hcp_overall = hcp_overall.merge(last_pres,on=C_HCP_ID,how="left")
        hcp_overall["months_since_last_pres"] = (
            hcp_overall["_lp"].apply(
                lambda d: (inference_date.to_period("M")-d.to_period("M")).n
                if pd.notna(d) else n_months))
        hcp_overall.drop(columns=["_lp"],inplace=True)

        agg = agg.merge(hcp_overall,on=C_HCP_ID,how="left")
        for c in [col for col in hcp_overall.columns if col!=C_HCP_ID]:
            if c in agg.columns: agg[c]=agg[c].fillna(0)

        # ── 13. TC affinity ────────────────────────────────────────────────
        tc_ev = self.events[self.events[C_TC].str.lower()==target["therapeutic_class"].lower()]
        tc_aff = (tc_ev.groupby(C_HCP_ID)
                  .agg(class_total_qty   =(C_QTY,  "sum"),
                       class_total_claims=(C_CLAIMS,"sum"),
                       class_total_benes =(C_BENES, "sum"),
                       class_active_months=("Month_Start","nunique"),
                       class_med_count   =(C_MED_ID,"nunique"))
                  .reset_index())
        for cutoff,lbl in [(c3m,"3m"),(c6m,"6m"),(c12m,"12m")]:
            tmp = (tc_ev[tc_ev["Month_Start"]>cutoff].groupby(C_HCP_ID)[C_QTY]
                   .sum().reset_index(name=f"class_r{lbl}"))
            tc_aff = tc_aff.merge(tmp,on=C_HCP_ID,how="left")
            tc_aff[f"class_r{lbl}"] = tc_aff[f"class_r{lbl}"].fillna(0)
        tc_aff["class_growth_6m"]  = (tc_aff["class_r6m"]-tc_aff["class_r12m"]/2).fillna(0)
        tc_aff["class_growth_12m"] = tc_aff["class_r12m"].fillna(0)

        agg = agg.merge(tc_aff,on=C_HCP_ID,how="left")
        for c in [col for col in tc_aff.columns if col!=C_HCP_ID]:
            if c in agg.columns: agg[c]=agg[c].fillna(0)

        # class_share, analog_share_within_class
        agg["_htot"] = agg["hcp_total_qty"].fillna(0)
        agg["class_share"] = np.where(agg["_htot"]>0,
            agg["class_total_qty"].fillna(0)/agg["_htot"],0.0)
        agg["analog_share_within_class"] = np.where(agg["class_total_qty"].fillna(0)>0,
            agg["analog_total_qty"].fillna(0)/agg["class_total_qty"].fillna(0),0.0)
        agg.drop(columns=["_htot"],inplace=True)
        agg["class_switching_score"] = np.where(agg["class_total_qty"].fillna(0)>0,
            agg["class_med_count"].fillna(0)/agg["class_total_qty"].fillna(0).clip(lower=1),0.0)

        # ── 14. Specialty features (data-learned, NOT hardcoded) ──────────
        spec_all = (
            self.events.merge(self.hcps[[C_HCP_ID,C_SPEC]],on=C_HCP_ID,how="left")
            .groupby(C_SPEC)[C_QTY].sum().reset_index().rename(
                columns={C_QTY:"spec_total_qty"}))
        spec_tc = (
            tc_ev.merge(self.hcps[[C_HCP_ID,C_SPEC]],on=C_HCP_ID,how="left")
            .groupby(C_SPEC).agg(
                spec_class_qty   =(C_QTY,   "sum"),
                spec_class_hcps  =(C_HCP_ID,"nunique"),
                spec_class_median=(C_QTY,   "median"))
            .reset_index())
        spec_analog = (
            ev.merge(self.hcps[[C_HCP_ID,C_SPEC]],on=C_HCP_ID,how="left")
            .groupby(C_SPEC)[C_QTY].sum().reset_index().rename(
                columns={C_QTY:"spec_analog_qty"}))
        spec_df = (spec_all.merge(spec_tc,on=C_SPEC,how="left")
                            .merge(spec_analog,on=C_SPEC,how="left"))
        for c in ["spec_class_qty","spec_class_hcps","spec_class_median","spec_analog_qty"]:
            spec_df[c]=spec_df[c].fillna(0)
        spec_df["spec_class_share"] = np.where(
            spec_df["spec_total_qty"]>0,
            spec_df["spec_class_qty"]/spec_df["spec_total_qty"],0.0)

        agg = agg.merge(spec_df,on=C_SPEC,how="left",suffixes=("","_sp"))
        for c in ["spec_total_qty","spec_class_qty","spec_analog_qty",
                  "spec_class_hcps","spec_class_median","spec_class_share"]:
            sc=c+"_sp"
            if sc in agg.columns:
                agg[c]=agg[c].where(agg[c].notna(),agg[sc]).fillna(0)
                agg.drop(columns=[sc],inplace=True)
            elif c in agg.columns: agg[c]=agg[c].fillna(0)
            else: agg[c]=0.0

        # months since last analog
        last_an = (ev.groupby(C_HCP_ID)["Month_Start"].max()
                   .reset_index(name="_la"))
        agg = agg.merge(last_an,on=C_HCP_ID,how="left")
        agg["months_since_last_analog"] = (
            agg["_la"].apply(lambda d: (
                (inference_date.to_period("M")-d.to_period("M")).n
                if pd.notna(d) else n_months)))
        agg.drop(columns=["_la"],errors="ignore",inplace=True)

        # ── 15. Train / Val / Test split ──────────────────────────────────
        trainable = all_months[:-3]
        tb = agg[agg["Month_Start"].isin(trainable)].copy()
        dates = sorted(tb["Month_Start"].unique())
        cut1  = dates[int(len(dates)*TRAIN_SPLIT_RATIO)-1]
        cut2  = dates[int(len(dates)*VAL_SPLIT_RATIO)-1]
        tr  = tb["Month_Start"]<=cut1
        vl  = (tb["Month_Start"]>cut1)&(tb["Month_Start"]<=cut2)
        te  = tb["Month_Start"]>cut2
        train_df=tb[tr].copy(); val_df=tb[vl].copy(); test_df=tb[te].copy()
        assert train_df["Month_Start"].max()<val_df["Month_Start"].min()
        assert val_df["Month_Start"].max()<test_df["Month_Start"].min()

        # OHE Specialty
        for df in [train_df,val_df,test_df]:
            df[C_SPEC]=df[C_SPEC].fillna("Unknown").astype(str)
        train_df=pd.get_dummies(train_df,columns=[C_SPEC],drop_first=False,dtype=int)
        val_df  =pd.get_dummies(val_df,  columns=[C_SPEC],drop_first=False,dtype=int)
        test_df =pd.get_dummies(test_df, columns=[C_SPEC],drop_first=False,dtype=int)
        cat_feats=sorted(set(c for df in [train_df,val_df,test_df]
                              for c in df.columns if c.startswith("specialty_")))
        for df in [train_df,val_df,test_df]:
            for c in cat_feats:
                if c not in df.columns: df[c]=0

        # ── 16. Feature vector ─────────────────────────────────────────────
        base_features=[
            "qty_lag_1","qty_lag_2","qty_lag_3","qty_lag_6","qty_lag_12",
            "claims_lag_1","claims_lag_2","claims_lag_3",
            "benes_lag_1","benes_lag_2","benes_lag_3",
            "qty_mean_3m","qty_mean_6m","qty_mean_12m",
            "hcp_prior_qty_mean",
            "qty_std_3m","qty_std_6m","qty_std_12m",
            "qty_max_6m","qty_min_6m",
            "claims_mean_3m","claims_mean_6m",
            "beneficiaries_mean_3m","beneficiaries_mean_6m",
            "drug_cost_mean_3m","drug_cost_mean_6m",
            "fills_mean_3m","fills_mean_6m",
            "days_supply_mean_3m","days_supply_mean_6m",
            "analog_r1m","analog_r3m","analog_r6m",
            "growth_1m","growth_3m","growth_6m","growth_12m",
            "trend_slope_3m","trend_slope_6m","trend_slope_12m",
            "analog_total_qty","analog_total_claims","analog_total_benes",
            "analog_total_dcost","analog_active_months","analog_frequency",
            "analog_recency","analog_share","analog_avg_qty",
            "analog_qty_var","analog_share_within_class",
            "pfreq_3m","pfreq_6m","pfreq_12m",
            "hcp_total_qty","hcp_total_claims","hcp_total_fills",
            "hcp_total_benes","hcp_total_dcost",
            "hcp_active_months","hcp_med_count","hcp_tc_count",
            "hcp_avg_qty","med_diversity","tc_diversity",
            "hcp_r1m_qty","hcp_r3m_qty","hcp_r6m_qty","hcp_r12m_qty",
            "hcp_r1m_claims","hcp_r3m_claims","hcp_r6m_claims","hcp_r12m_claims",
            "hcp_growth_3m","hcp_growth_6m","hcp_growth_12m",
            "hcp_ts_3m","hcp_ts_6m","hcp_ts_12m",
            "months_since_last_pres","months_since_last_analog",
            "class_total_qty","class_total_claims","class_total_benes",
            "class_active_months","class_med_count","class_share",
            "class_r3m","class_r6m","class_r12m",
            "class_growth_6m","class_growth_12m","class_switching_score",
            "spec_total_qty","spec_class_qty","spec_analog_qty",
            "spec_class_hcps","spec_class_median","spec_class_share",
            "month_sin","month_cos",
        ]
        features=base_features+cat_feats
        for df in [train_df,val_df,test_df]:
            for c in base_features:
                if c not in df.columns: df[c]=0.0

        X_tr=train_df[features].fillna(0); X_vl=val_df[features].fillna(0)
        X_te=test_df[features].fillna(0)
        y_tr_raw=train_df["future_3_month_demand"]; y_vl_raw=val_df["future_3_month_demand"]
        y_te_raw=test_df["future_3_month_demand"]
        y_tr_log=train_df["future_3m_log1p"]; y_vl_log=val_df["future_3m_log1p"]
        y_te_log=test_df["future_3m_log1p"]
        y_tr_clf=train_df["target_active"]; y_vl_clf=val_df["target_active"]
        y_te_clf=test_df["target_active"]

        # ── 17. Leakage check ─────────────────────────────────────────────
        leakage_result=check_leakage(features,agg)
        if leakage_result["leakage_detected"]:
            raise RuntimeError(f"LEAKAGE: {leakage_result['issues']}")
        print("\n[LEAKAGE CHECK] PASS")

        # ── 18. Baselines ─────────────────────────────────────────────────
        baselines={"Last Obs (x3)":test_df["Quantity"]*3,
                   "3M Avg (x3)": test_df["qty_mean_3m"]*3,
                   "6M Avg (x3)": test_df["qty_mean_6m"]*3,
                   "12M Avg (x3)":test_df["qty_mean_12m"]*3}
        baseline_metrics={n:_reg_metrics(y_te_raw,p) for n,p in baselines.items()}

        # ── 19. Classifiers (CatBoost exclusive) ──────────────────────────
        pos_ratio=float(y_tr_clf.mean())
        spw=max(1.0,(1-pos_ratio)/pos_ratio) if pos_ratio>0 else 1.0
        classifiers={
            "CatBoost": CatBoostClassifier(iterations=150, depth=5, learning_rate=0.08,
                                           class_weights=[1.0, spw], verbose=False,
                                           random_seed=42, thread_count=-1)
        }
        clf_val_metrics={}; clf_test_metrics={}; clf_fitted={}
        for name,clf in classifiers.items():
            clf.fit(X_tr,y_tr_clf); clf_fitted[name]=clf
            for sx,sy,store in [(X_vl,y_vl_clf,clf_val_metrics),(X_te,y_te_clf,clf_test_metrics)]:
                prob=clf.predict_proba(sx)[:,1]; pred=clf.predict(sx)
                store[name]={"ROC-AUC":float(roc_auc_score(sy,prob)),
                             "PR-AUC":float(_pr_auc(sy,prob)),
                             "F1":float(f1_score(sy,pred)),
                             "Precision":float(precision_score(sy,pred,zero_division=0)),
                             "Recall":float(recall_score(sy,pred)),
                             "Accuracy":float(accuracy_score(sy,pred))}
        best_clf_name="CatBoost"
        best_clf=clf_fitted[best_clf_name]

        # ── 20. Direct regressors (CatBoost exclusive) ────────────────────
        direct_regs = {
            "CatBoost": CatBoostRegressor(iterations=150, depth=5, learning_rate=0.08,
                                          l2_leaf_reg=3.0, thread_count=-1,
                                          verbose=False, random_seed=42)
        }
        direct_regs_log = {
            "CatBoost": CatBoostRegressor(iterations=150, depth=5, learning_rate=0.08,
                                          l2_leaf_reg=3.0, thread_count=-1,
                                          verbose=False, random_seed=42)
        }
        dv_m={}; dt_m={}; df_fit={}; dvl_m={}; dtl_m={}; dfl_fit={}
        for name,reg in direct_regs.items():
            reg.fit(X_tr,y_tr_raw); df_fit[name]=reg
            dv_m[name]=_reg_metrics(y_vl_raw,np.maximum(reg.predict(X_vl),0))
            dt_m[name]=_reg_metrics(y_te_raw,np.maximum(reg.predict(X_te),0))
        for name,reg in direct_regs_log.items():
            reg.fit(X_tr,y_tr_log); dfl_fit[name]=reg
            dvl_m[name]=_reg_metrics(y_vl_raw,np.expm1(np.maximum(reg.predict(X_vl),0)))
            dtl_m[name]=_reg_metrics(y_te_raw,np.expm1(np.maximum(reg.predict(X_te),0)))

        # ── 21. Two-stage (CatBoost exclusive) ───────────────────────────
        pos_tr=y_tr_clf>0
        two_regs = {
            "CatBoost": CatBoostRegressor(iterations=150, depth=5, learning_rate=0.08,
                                          l2_leaf_reg=3.0, thread_count=-1,
                                          verbose=False, random_seed=42)
        }
        tv_m={}; tt_m={}; tf_fit={}
        for name,reg in two_regs.items():
            if pos_tr.sum()>0:
                reg.fit(X_tr[pos_tr],y_tr_raw[pos_tr]); tf_fit[name]=reg
                for sx,sy,store in [(X_vl,y_vl_raw,tv_m),(X_te,y_te_raw,tt_m)]:
                    cp=clf_fitted[name].predict_proba(sx)[:,1]
                    rp2=np.maximum(reg.predict(sx),0)
                    store[name]=_reg_metrics(sy,cp*rp2)
            else:
                tv_m[name]=tt_m[name]={"MAE":9999,"RMSE":0,"WAPE":0,"R2":0}

        # Helper to get val predictions for selection
        def _get_vp(pk):
            nm=pk.split("_",1)[1]
            if pk.startswith("TwoStage_"):
                return clf_fitted[nm].predict_proba(X_vl)[:,1]*np.maximum(tf_fit[nm].predict(X_vl),0)
            elif pk.startswith("DirectLog_"):
                return np.expm1(np.maximum(dfl_fit[nm].predict(X_vl),0))
            else:
                return np.maximum(direct_regs[nm].predict(X_vl),0)

        def _get_tp(pk):
            nm=pk.split("_",1)[1]
            if pk.startswith("TwoStage_"):
                return clf_fitted[nm].predict_proba(X_te)[:,1]*np.maximum(tf_fit[nm].predict(X_te),0)
            elif pk.startswith("DirectLog_"):
                return np.expm1(np.maximum(dfl_fit[nm].predict(X_te),0))
            else:
                return np.maximum(direct_regs[nm].predict(X_te),0)

        # ── 22. Pipeline selection (val R2 + val NDCG@100 ranking) ────────
        pipeline_r2={}
        pipeline_val_ndcg={}
        pipeline_scores={}
        for n in dv_m:
            pk = f"Direct_{n}"
            pipeline_r2[pk] = dv_m[n]["R2"]
            rm_val,_,_ = ranking_metrics(y_vl_raw.values, _get_vp(pk), ks=[100])
            pipeline_val_ndcg[pk] = rm_val[100]["NDCG"]
            pipeline_scores[pk] = dv_m[n]["R2"]
        for n in dvl_m:
            pk = f"DirectLog_{n}"
            pipeline_r2[pk] = dvl_m[n]["R2"]
            rm_val,_,_ = ranking_metrics(y_vl_raw.values, _get_vp(pk), ks=[100])
            pipeline_val_ndcg[pk] = rm_val[100]["NDCG"]
            pipeline_scores[pk] = dvl_m[n]["R2"]
        for n in tv_m:
            pk = f"TwoStage_{n}"
            pipeline_r2[pk] = tv_m[n]["R2"]
            rm_val,_,_ = ranking_metrics(y_vl_raw.values, _get_vp(pk), ks=[100])
            pipeline_val_ndcg[pk] = rm_val[100]["NDCG"]
            pipeline_scores[pk] = tv_m[n]["R2"]

        # Select best performing CatBoost pipeline variant (Direct, DirectLog, or TwoStage)
        best_pipeline = max(pipeline_scores, key=lambda pk: pipeline_r2[pk])

        uses_two_stage=best_pipeline.startswith("TwoStage_")
        uses_log      =best_pipeline.startswith("DirectLog_")
        best_model_name=best_pipeline.split("_",1)[1]

        if uses_two_stage:
            best_final_reg=tf_fit[best_model_name]; best_final_clf=clf_fitted[best_model_name]
            reg_metrics=tt_m
        elif uses_log:
            best_final_reg=dfl_fit[best_model_name]; reg_metrics=dtl_m; uses_two_stage=False
        else:
            best_final_reg=direct_regs[best_model_name]; reg_metrics=dt_m; uses_two_stage=False

        best_val_mae  = (tv_m[best_model_name]["MAE"] if uses_two_stage
                         else (dvl_m[best_model_name]["MAE"] if uses_log
                               else dv_m[best_model_name]["MAE"]))
        best_val_wape = (tv_m[best_model_name]["WAPE"] if uses_two_stage
                         else (dvl_m[best_model_name]["WAPE"] if uses_log
                               else dv_m[best_model_name]["WAPE"]))
        print(f"\n[MODEL] Selected: {best_pipeline}  ValMAE={best_val_mae:.4f}  ValR2={pipeline_r2[best_pipeline]:+.4f}  ValNDCG100={pipeline_val_ndcg[best_pipeline]:.4f}")

        # Feature importance
        if hasattr(best_final_reg,"feature_importances_"):
            fi_v=best_final_reg.feature_importances_
        elif hasattr(best_final_reg,"get_feature_importance"):
            fi_v=best_final_reg.get_feature_importance()
        else: fi_v=np.zeros(len(features))
        fi_df=pd.DataFrame({"Feature":features[:len(fi_v)],"Importance":fi_v})
        fi_df=fi_df.sort_values("Importance",ascending=False).head(20).reset_index(drop=True)
        def _fg(f):
            if any(f.startswith(p) for p in ["qty_lag","claims_lag","benes_lag"]): return "Recency"
            if any(x in f for x in ["mean","std","max","min"]): return "Rolling Stats"
            if any(x in f for x in ["growth","trend","ts_"]): return "Trend"
            if f.startswith("analog_"): return "Analog Behavior"
            if f.startswith("hcp_") or f in ["med_diversity","tc_diversity"]: return "HCP Behavior"
            if any(x in f for x in ["class_","switching"]): return "Therapeutic Class"
            if "spec_" in f or f.startswith("specialty_"): return "Specialty"
            if "month_sin" in f or "month_cos" in f: return "Seasonality"
            if any(x in f for x in ["freq","recency","since","pfreq"]): return "Frequency/Recency"
            return "Other"
        fi_df["Group"]=fi_df["Feature"].apply(_fg)
        fi_df.to_csv(str(OUTPUT_DIR/"feature_importance.csv"),index=False)

        # Test-set ranking per pipeline
        rank_per_pipe={}
        for pk in pipeline_scores:
            try:
                rm,_,_=ranking_metrics(y_te_raw.values,_get_tp(pk),ks=[10,25,50,100])
                rank_per_pipe[pk]=rm
            except: pass
        test_preds_rank=_get_tp(best_pipeline)
        rank_metrics,n_rel_test,rank_thresh=ranking_metrics(
            y_te_raw.values,test_preds_rank,ks=[10,25,50,100])

        # Diagnostic Table for Top 20 Ranked HCPs in Test Set
        diag_df = pd.DataFrame({
            "hcp_id": test_df[C_HCP_ID].values,
            "predicted_demand": test_preds_rank,
            "actual_test_demand": y_te_raw.values
        })
        diag_hcp = diag_df.groupby("hcp_id").agg(
            predicted_demand=("predicted_demand", "mean"),
            actual_test_demand=("actual_test_demand", "mean")
        ).reset_index()
        diag_hcp["predicted_rank"] = diag_hcp["predicted_demand"].rank(ascending=False, method="min").astype(int)
        diag_hcp["actual_rank"] = diag_hcp["actual_test_demand"].rank(ascending=False, method="min").astype(int)
        top10_threshold = diag_hcp["actual_test_demand"].quantile(0.90)
        diag_hcp["top10_ground_truth"] = (diag_hcp["actual_test_demand"] >= top10_threshold).astype(int)
        diag_sample = diag_hcp.sort_values("predicted_rank").head(20).copy()

        # ── 23. Predict ALL 12,000 HCPs ───────────────────────────────────
        hist_inf=agg[agg["Month_Start"]==inference_date].copy()
        master_cols=set(self.hcps.columns)|{C_HCP_ID}
        fe_cols=[c for c in agg.columns if c not in master_cols and c not in [
            "Month_Start","future_3_month_demand","future_3m_log1p","target_active",
            "_la","_lp","_htot"]]

        inf_df=self.hcps.copy()
        avail=[c for c in [C_HCP_ID]+fe_cols if c in hist_inf.columns]
        inf_df=inf_df.merge(hist_inf[avail].drop_duplicates(C_HCP_ID),on=C_HCP_ID,how="left")
        for c in fe_cols:
            if c in inf_df.columns: inf_df[c]=inf_df[c].fillna(0)

        # HCP overall for all
        inf_df=inf_df.merge(hcp_overall,on=C_HCP_ID,how="left",suffixes=("","_ov"))
        for col in hcp_overall.columns:
            if col==C_HCP_ID: continue
            ov=col+"_ov"
            if ov in inf_df.columns:
                inf_df[col]=inf_df[col].where(inf_df[col].notna()&(inf_df[col]!=0),
                                               inf_df[ov]).fillna(0)
                inf_df.drop(columns=[ov],inplace=True)
            elif col in inf_df.columns: inf_df[col]=inf_df[col].fillna(0)
            else: inf_df[col]=0.0

        # TC affinity for all
        inf_df=inf_df.merge(tc_aff,on=C_HCP_ID,how="left",suffixes=("","_tc"))
        for col in tc_aff.columns:
            if col==C_HCP_ID: continue
            tc_col=col+"_tc"
            if tc_col in inf_df.columns:
                inf_df[col]=inf_df[col].where(inf_df[col].notna(),inf_df[tc_col]).fillna(0)
                inf_df.drop(columns=[tc_col],inplace=True)
            elif col in inf_df.columns: inf_df[col]=inf_df[col].fillna(0)
            else: inf_df[col]=0.0

        # class shares
        inf_df["_h2"]=inf_df["hcp_total_qty"].fillna(0)
        inf_df["class_share"]=np.where(inf_df["_h2"]>0,
            inf_df["class_total_qty"].fillna(0)/inf_df["_h2"],0.0)
        inf_df["analog_share_within_class"]=np.where(inf_df["class_total_qty"].fillna(0)>0,
            inf_df["analog_total_qty"].fillna(0)/inf_df["class_total_qty"].fillna(0),0.0)
        inf_df["class_switching_score"]=np.where(inf_df["class_total_qty"].fillna(0)>0,
            inf_df["class_med_count"].fillna(0)/inf_df["class_total_qty"].fillna(0).clip(lower=1),0.0)
        inf_df.drop(columns=["_h2"],inplace=True)

        # Specialty features
        inf_df[C_SPEC]=inf_df[C_SPEC].fillna("Unknown").astype(str)
        inf_df=inf_df.merge(spec_df,on=C_SPEC,how="left",suffixes=("","_sp"))
        for c in ["spec_total_qty","spec_class_qty","spec_analog_qty",
                  "spec_class_hcps","spec_class_median","spec_class_share"]:
            sc=c+"_sp"
            if sc in inf_df.columns:
                inf_df[c]=inf_df[c].where(inf_df[c].notna(),inf_df[sc]).fillna(0)
                inf_df.drop(columns=[sc],inplace=True)
            elif c in inf_df.columns: inf_df[c]=inf_df[c].fillna(0)
            else: inf_df[c]=0.0

        # Recency
        inf_df=inf_df.merge(
            self.events.groupby(C_HCP_ID)["Month_Start"].max().reset_index(name="_lp2"),
            on=C_HCP_ID,how="left")
        inf_df["months_since_last_pres"]=(
            inf_df["_lp2"].apply(lambda d:(inference_date.to_period("M")-d.to_period("M")).n
                                  if pd.notna(d) else n_months))
        inf_df.drop(columns=["_lp2"],inplace=True)

        inf_df=inf_df.merge(
            ev.groupby(C_HCP_ID)["Month_Start"].max().reset_index(name="_la2"),
            on=C_HCP_ID,how="left")
        inf_df["months_since_last_analog"]=(
            inf_df["_la2"].apply(lambda d:(inference_date.to_period("M")-d.to_period("M")).n
                                  if pd.notna(d) else n_months))
        inf_df.drop(columns=["_la2"],inplace=True)

        # Seasonal
        inf_df["month"]=inference_date.month
        inf_df["month_sin"]=np.sin(2*np.pi*inference_date.month/12)
        inf_df["month_cos"]=np.cos(2*np.pi*inference_date.month/12)

        # OHE
        inf_df["_spec_raw"]=inf_df[C_SPEC]
        inf_df=pd.get_dummies(inf_df,columns=[C_SPEC],drop_first=False,dtype=int)
        inf_df[C_SPEC]=inf_df["_spec_raw"]; inf_df.drop(columns=["_spec_raw"],inplace=True)
        for c in cat_feats:
            if c not in inf_df.columns: inf_df[c]=0
        for c in base_features:
            if c not in inf_df.columns: inf_df[c]=0.0

        X_inf=inf_df[features].fillna(0)

        # ── 24. Predictions ────────────────────────────────────────────────
        p_active=best_clf.predict_proba(X_inf)[:,1]
        if uses_two_stage:
            p_pos  =np.maximum(best_final_reg.predict(X_inf),0)
            p_final=p_active*p_pos
        elif uses_log:
            p_final=np.expm1(np.maximum(best_final_reg.predict(X_inf),0)); p_pos=p_final
        else:
            p_final=np.maximum(best_final_reg.predict(X_inf),0); p_pos=p_final
        inf_df["Probability_Active"]=p_active
        inf_df["Positive_Demand"]   =p_pos
        inf_df["Expected_3M_Demand"]=p_final

        # ── 25. Potential score model ──────────────────────────────────────
        pot_feats=[
            "class_share","class_total_qty","class_active_months",
            "class_r3m","class_r6m","class_growth_6m","class_growth_12m",
            "hcp_total_qty","hcp_active_months","hcp_med_count","hcp_tc_count",
            "med_diversity","hcp_r3m_qty","hcp_r6m_qty","hcp_r12m_qty",
            "hcp_growth_3m","hcp_growth_6m","hcp_ts_6m","hcp_ts_12m",
            "spec_class_share","spec_class_hcps","spec_class_median",
            "months_since_last_pres","months_since_last_analog",
            "analog_active_months","analog_frequency","analog_share",
            "month_sin","month_cos",
        ]+cat_feats
        for df in [train_df,val_df,test_df]:
            for c in pot_feats:
                if c not in df.columns: df[c]=0.0
        n_top=max(1,int(len(y_tr_raw)*0.10))
        top_tr=np.sort(y_tr_raw.values)[::-1][n_top-1]
        y_tr_pot=(y_tr_raw>=top_tr).astype(int)
        n_top_v=max(1,int(len(y_vl_raw)*0.10))
        top_vl=np.sort(y_vl_raw.values)[::-1][n_top_v-1]
        y_vl_pot=(y_vl_raw>=top_vl).astype(int)
        spw_p=max(1.0,(1-y_tr_pot.mean())/y_tr_pot.mean()) if y_tr_pot.mean()>0 else 1.0
        pot_model = CatBoostClassifier(iterations=150, depth=5, learning_rate=0.08,
                                       class_weights=[1.0, spw_p], verbose=False,
                                       random_seed=42, thread_count=-1)
        Xp_tr=train_df[pot_feats].fillna(0); Xp_vl=val_df[pot_feats].fillna(0)
        pot_model.fit(Xp_tr,y_tr_pot)
        val_pot_prob=pot_model.predict_proba(Xp_vl)[:,1]
        val_pot_auc=float(roc_auc_score(y_vl_pot,val_pot_prob))
        val_pot_pred=pot_model.predict(Xp_vl)
        val_pot_acc=float(accuracy_score(y_vl_pot,val_pot_pred))
        print(f"\n[POTENTIAL MODEL] Val ROC-AUC={val_pot_auc:.4f}  Val Accuracy={val_pot_acc:.4f}")

        Xp_inf=inf_df[pot_feats].fillna(0)
        raw_pot=pot_model.predict_proba(Xp_inf)[:,1]
        mn_p,mx_p=raw_pot.min(),raw_pot.max()
        inf_df["raw_potential"]=(raw_pot-mn_p)/(mx_p-mn_p+1e-9)

        # ── 26. Tune blend on val NDCG@100 ────────────────────────────────
        vd=np.maximum(
            (best_final_clf.predict_proba(X_vl)[:,1]*tf_fit.get(best_model_name,
              best_final_reg).predict(X_vl)) if uses_two_stage
            else (np.expm1(np.maximum(best_final_reg.predict(X_vl),0)) if uses_log
                  else np.maximum(best_final_reg.predict(X_vl),0)),0)
        dm,dx=vd.min(),vd.max(); vd_n=(vd-dm)/(dx-dm+1e-9)
        pm,px=val_pot_prob.min(),val_pot_prob.max(); vp_n=(val_pot_prob-pm)/(px-pm+1e-9)
        best_wd,best_ndcg=DEFAULT_BLEND_DEMAND_WEIGHT,-1.0
        for wd in BLEND_WEIGHT_CANDIDATES:
            bl=wd*vd_n+(1-wd)*vp_n
            rm_tmp,_,_=ranking_metrics(y_vl_raw.values,bl,ks=[100])
            if rm_tmp[100]["NDCG"]>best_ndcg:
                best_ndcg=rm_tmp[100]["NDCG"]; best_wd=wd
        best_wp=1.0-best_wd
        print(f"\n[BLEND] w_demand={best_wd:.2f}  w_pot={best_wp:.2f}  "
              f"Val NDCG@100={best_ndcg:.4f}")

        # Apply blend
        dm2,dx2=inf_df["Expected_3M_Demand"].min(),inf_df["Expected_3M_Demand"].max()
        id_n=(inf_df["Expected_3M_Demand"]-dm2)/(dx2-dm2+1e-9)
        pm2,px2=inf_df["raw_potential"].min(),inf_df["raw_potential"].max()
        ip_n=(inf_df["raw_potential"]-pm2)/(px2-pm2+1e-9)
        inf_df["final_hcp_score"]=best_wd*id_n+best_wp*ip_n
        mn_f=inf_df["final_hcp_score"].min(); mx_f=inf_df["final_hcp_score"].max()
        inf_df["Potential_Score"]=((inf_df["final_hcp_score"]-mn_f)/(mx_f-mn_f+1e-9)*100).round(1)
        inf_df["hcp_potential_score_raw"]=(inf_df["raw_potential"]*100).round(1)
        def _scat(s):
            if s>=POTENTIAL_TIER_THRESHOLDS["Very High"]: return "Very High"
            if s>=POTENTIAL_TIER_THRESHOLDS["High"]: return "High"
            if s>=POTENTIAL_TIER_THRESHOLDS["Medium"]: return "Medium"
            return "Low"
        inf_df["Potential_Category"]=inf_df["Potential_Score"].apply(_scat)

        # ── 27. Diagnostics ────────────────────────────────────────────────
        analog_hcp_set=set(all_analog_hcps)
        has_hist=inf_df[C_HCP_ID].isin(analog_hcp_set)
        hcp_master_count=len(self.hcps)
        n_unique=inf_df["Expected_3M_Demand"].nunique()
        uniq_frac=n_unique/len(inf_df) if len(inf_df)>0 else 0
        pred_collapse=uniq_frac<PREDICTION_COLLAPSE_THRESHOLD
        pct_nz=float((inf_df["Expected_3M_Demand"]<0.01).mean()*100)
        if pct_nz>80: print(f"\n[WARNING] {pct_nz:.1f}% predictions near-zero")

        all_hcp_df=inf_df[[C_HCP_ID,C_SPEC,C_LOCALITY,"Probability_Active",
                            "Positive_Demand","Expected_3M_Demand",
                            "hcp_potential_score_raw","Potential_Score",
                            "Potential_Category","final_hcp_score"]]\
            .copy().sort_values("final_hcp_score",ascending=False)
        all_hcp_df.to_csv(str(OUTPUT_DIR/"hcp_predictions_all.csv"),index=False)

        pd.DataFrame({"Potential_Score_0_100":inf_df["hcp_potential_score_raw"],
                       C_HCP_ID:inf_df[C_HCP_ID],
                       C_SPEC:inf_df[C_SPEC],
                       "Potential_Category":inf_df["Potential_Category"]})\
            .to_csv(str(OUTPUT_DIR/"hcp_potential_scores.csv"),index=False)

        all_pred_stats={"count":int(all_hcp_df["Expected_3M_Demand"].count()),
                        "mean":float(all_hcp_df["Expected_3M_Demand"].mean()),
                        "std": float(all_hcp_df["Expected_3M_Demand"].std()),
                        "min": float(all_hcp_df["Expected_3M_Demand"].min()),
                        "p25": float(all_hcp_df["Expected_3M_Demand"].quantile(0.25)),
                        "p50": float(all_hcp_df["Expected_3M_Demand"].median()),
                        "p75": float(all_hcp_df["Expected_3M_Demand"].quantile(0.75)),
                        "max": float(all_hcp_df["Expected_3M_Demand"].max()),
                        "n_unique":n_unique,"unique_frac":round(uniq_frac,4),
                        "pct_near_zero":round(pct_nz,2),"collapse_warn":pred_collapse}
        print(f"\n[HCP] Master={hcp_master_count:,}  "
              f"WithHistory={int(has_hist.sum()):,}  "
              f"WithoutHistory={int((~has_hist).sum()):,}")
        print(f"[INFO] Saved {len(all_hcp_df):,} predictions --> hcp_predictions_all.csv")

        # ── 28. Top N selection ────────────────────────────────────────────
        top_n=req.get("top_n_hcps",TOP_N_HCPS)
        latest=inf_df.sort_values("final_hcp_score",ascending=False).head(top_n).copy()
        latest["Predicted_Demand"]=latest["Expected_3M_Demand"]
        # Zone comes directly from Dataset2 HCP master — no mapping needed
        unknown_zone_df=latest[latest[C_ZONE].isin(["Unknown",""])]\
            [[C_HCP_ID,C_LOCALITY,C_ZONE]].copy()
        if not unknown_zone_df.empty:
            print(f"\n[ZONE] {len(unknown_zone_df)} HCPs with Unknown zone")

        # ── 29. Sample allocation ──────────────────────────────────────────
        latest["Samples"]=allocate(latest["final_hcp_score"],req["total_samples"])
        assert int(latest["Samples"].sum())==req["total_samples"]
        alloc_stats={"max":int(latest["Samples"].max()),"min":int(latest["Samples"].min()),
                     "mean":float(latest["Samples"].mean()),"median":float(latest["Samples"].median())}

        # ── 30. Zone distribution (direct from Dataset2 zone column) ──────
        zones=(latest.groupby(C_ZONE)
               .agg(HCP_Count   =(C_HCP_ID,"count"),
                    Expected_Demand=("Expected_3M_Demand","sum"),
                    Potential_Score=("Potential_Score","mean"),
                    Samples     =("Samples","sum"))
               .reset_index())
        zones["Percentage"]=(zones["Samples"]/req["total_samples"]*100).round(2)
        assert zones["Samples"].sum()==req["total_samples"]
        zones.to_csv(str(OUTPUT_DIR/"zone_distribution.csv"),index=False)

        # ── 31. ROI + sensitivity ─────────────────────────────────────────
        roi_out=calculate(latest,req["total_samples"],req["medicine_price"],
                          req.get("sample_cost",0),
                          req.get("average_units_per_prescription",1),
                          req.get("expected_sample_lift",0.10),
                          req.get("variable_cost_per_unit",0))
        pred_demand_total=float(latest["Predicted_Demand"].sum())
        roi_scenarios=calculate_scenarios(pred_demand_total,req["total_samples"],
                                          req["medicine_price"],req.get("sample_cost",0),
                                          req.get("average_units_per_prescription",1),
                                          req.get("variable_cost_per_unit",0))
        sens_df=sensitivity_matrix(pred_demand_total,req["total_samples"],
                                    req.get("sample_cost",0),
                                    req.get("average_units_per_prescription",1),
                                    req.get("variable_cost_per_unit",0))
        sens_df.to_csv(os.path.join(out_dir, "roi_sensitivity.csv"), index=False)

        # ── 32. Save all output files ─────────────────────────────────────
        out = out_dir
        latest[[C_HCP_ID,C_SPEC,C_LOCALITY,C_ZONE,"Expected_3M_Demand",
                "Potential_Score","Potential_Category","Samples"]]\
            .to_csv(f"{out}/sample_allocation.csv",index=False)
        latest[[C_HCP_ID,C_SPEC,C_LOCALITY,C_ZONE,"Probability_Active",
                "Positive_Demand","Expected_3M_Demand","Potential_Score",
                "Potential_Category","final_hcp_score","Samples"]]\
            .to_csv(f"{out}/top_100_hcps.csv",index=False)

        mc_rows=[]
        for nm,mv in baseline_metrics.items():
            mc_rows.append({"Model":nm,"Type":"Baseline","Set":"Test",**mv})
        for nm in dt_m:
            mc_rows+=[{"Model":f"Direct_{nm}","Type":"Direct","Set":"Val",**dv_m[nm]},
                      {"Model":f"Direct_{nm}","Type":"Direct","Set":"Test",**dt_m[nm]},
                      {"Model":f"DirectLog_{nm}","Type":"DirectLog","Set":"Val",**dvl_m[nm]},
                      {"Model":f"DirectLog_{nm}","Type":"DirectLog","Set":"Test",**dtl_m[nm]}]
        for nm in tt_m:
            mc_rows+=[{"Model":f"TwoStage_{nm}","Type":"TwoStage","Set":"Val",**tv_m[nm]},
                      {"Model":f"TwoStage_{nm}","Type":"TwoStage","Set":"Test",**tt_m[nm]}]
        pd.DataFrame(mc_rows).to_csv(f"{out}/model_comparison.csv",index=False)

        clf_rows=[]
        for nm in clf_val_metrics:
            clf_rows.append({"Model":nm,"Set":"Val",**clf_val_metrics[nm]})
            clf_rows.append({"Model":nm,"Set":"Test",**clf_test_metrics[nm]})
        pd.DataFrame(clf_rows).to_csv(f"{out}/activation_model_comparison.csv",index=False)

        pd.DataFrame([{"K":k,**v} for pk,rm in rank_per_pipe.items()
                       for k,v in rm.items()
                       if (row:={"Pipeline":pk,"K":k,**v}) or True
                      ]
                     if False else
                     [{"Pipeline":pk,"K":k,**v}
                      for pk,rm in rank_per_pipe.items() for k,v in rm.items()]
                     ).to_csv(f"{out}/ranking_metrics.csv",index=False)

        roi_hcp=roi_out.get("hcp_df",latest)
        roi_cols=[c for c in [C_HCP_ID,"Samples","Predicted_Demand",
            "Sample_Investment","Expected_Incremental_Rx","Expected_Incremental_Units",
            "Expected_Revenue","Expected_Variable_Cost","Expected_Incremental_Profit",
            "Projected_ROI_Pct"] if c in roi_hcp.columns]
        roi_hcp[roi_cols].to_csv(f"{out}/roi_analysis.csv",index=False)

        pd.DataFrame([{"Scenario":n,"Lift":sv["lift"],
            "Investment":sv["sample_investment"],
            "Incr_Rx":sv["expected_incremental_prescriptions"],
            "Revenue":sv["expected_revenue"],
            "Profit":sv["expected_incremental_profit"],
            "ROI_Pct":sv["projected_roi_percent"],
            "BE_Lift":sv["breakeven_sample_lift"],
            "BE_Price":sv["breakeven_medicine_price"]}
            for n,sv in roi_scenarios.items()])\
            .to_csv(f"{out}/roi_scenarios.csv",index=False)

        # ── 33. Top-HCP explanations ───────────────────────────────────────
        exp_rows=[]
        for ri,(_, row) in enumerate(latest.head(10).iterrows(),1):
            reasons=[]
            if row.get("class_share",0)>0.3:
                reasons.append(f"High {target['therapeutic_class']} class share ({row.get('class_share',0):.1%})")
            if row.get("hcp_r3m_qty",0)>all_pred_stats["p75"]*3:
                reasons.append("High recent prescription activity (top 25%)")
            if row.get("analog_active_months",0)>0:
                reasons.append(f"Analog history: {int(row.get('analog_active_months',0))} active months")
            if row.get("hcp_ts_6m",0)>0:
                reasons.append("Positive 6M prescription trend")
            if row.get("spec_class_share",0)>0.15:
                reasons.append(f"Specialty TC affinity: {row.get('spec_class_share',0):.1%}")
            if row.get("class_growth_6m",0)>0:
                reasons.append("TC demand growing in recent 6M")
            if not reasons: reasons.append("High combined demand + potential score")
            exp_rows.append({
                "Rank":ri,"HCP_ID":row.get(C_HCP_ID,""),
                "Specialty":row.get(C_SPEC,""),"Zone":row.get(C_ZONE,""),
                "Expected_3M_Demand":round(float(row.get("Expected_3M_Demand",0)),2),
                "Potential_Score":round(float(row.get("Potential_Score",0)),1),
                "Class_Share":round(float(row.get("class_share",0)),3),
                "Analog_Active_Months":int(row.get("analog_active_months",0)),
                "Samples":int(row.get("Samples",0)),
                "Top_Reasons":" | ".join(reasons)})
        pd.DataFrame(exp_rows).to_csv(f"{out}/top_hcp_explanations.csv",index=False)

        # Validation report
        vr={"dataset_valid":True,"n_medicines":int(n_meds),
            "medicines_valid":(n_meds==120),
            "target_excluded":True,"dosage_compat":form_compat or analog_tier<3,
            "leakage_pass":not leakage_result["leakage_detected"],
            "chronological_split":True,"model_selection_on_val":True,
            "prediction_collapse":pred_collapse,
            "allocation_exact":int(latest["Samples"].sum())==req["total_samples"],
            "zone_allocation_exact":int(zones["Samples"].sum())==req["total_samples"],
            "unknown_zones":int(unknown_zone_df.shape[0]),
            "hcp_master_count":hcp_master_count,
            "eligible_hcp_count":len(inf_df),
            "predicted_hcp_count":len(inf_df),
            "selected_hcp_count":len(latest),
            "best_pipeline":best_pipeline,
            "best_val_mae":round(best_val_mae,4),
            "potential_val_auc":round(val_pot_auc,4),
            "potential_val_accuracy":round(val_pot_acc,4),
            "best_clf":best_clf_name,
            "best_clf_val_accuracy":round(clf_val_metrics[best_clf_name]["Accuracy"],4),
            "best_clf_test_accuracy":round(clf_test_metrics[best_clf_name]["Accuracy"],4),
            "blend_w_demand":best_wd,"blend_w_potential":best_wp,
            "blend_val_ndcg100":round(best_ndcg,4)}
        with open(f"{out}/validation_report.json","w") as jf:
            json.dump(vr,jf,indent=2)
        print(f"\n[INFO] All outputs saved to outputs/")

        # ── 34. Return result dict ─────────────────────────────────────────
        return {
            "total_events":n_events,"unique_hcps_dataset":n_hcps,
            "unique_meds_dataset":n_meds,
            "date_range":f"{date_min.date()} to {date_max.date()}",
            "latest_event_date":str(inference_date.date()),
            "forecast_start":str(forecast_start.date()),
            "forecast_end":str(forecast_end.date()),
            "target_medicine":target,"medicine_exists":medicine_exists,
            "matched_medicine_id":matched_id,
            "segmentation":seg_info,"analog_tier":analog_tier,
            "form_compat":form_compat,
            "candidate_count":len(candidates),"candidate_medicines":top_candidates,
            "selected_similar_medicine":analog.to_dict(),
            "similarity_score":float(analog["Final_Analog_Score"]),
            "profile_similarity":float(analog.get("Profile_Similarity",0)),
            "behavior_similarity":float(analog.get("Behavior_Similarity",0)),
            "data_quality":float(analog.get("Data_Quality",0)),
            "historical_events":int(analog["Historical_Events"]),
            "active_hcps":int(analog["Active_HCPs"]),
            "historical_months":int(analog["Historical_Months"]),
            "n_features":len(features),"feature_names":features,
            "train_dates":f"{train_df['Month_Start'].min().date()} to {train_df['Month_Start'].max().date()}",
            "val_dates":  f"{val_df['Month_Start'].min().date()} to {val_df['Month_Start'].max().date()}",
            "test_dates": f"{test_df['Month_Start'].min().date()} to {test_df['Month_Start'].max().date()}",
            "leakage_result":leakage_result,
            "baseline_metrics":baseline_metrics,
            "clf_val_metrics":clf_val_metrics,"clf_metrics":clf_test_metrics,
            "best_clf":best_clf_name,
            "direct_val_metrics":dv_m,"direct_test_metrics":dt_m,
            "direct_val_metrics_log":dvl_m,"direct_test_metrics_log":dtl_m,
            "two_stage_val_metrics":tv_m,"two_stage_test_metrics":tt_m,
            "reg_metrics":reg_metrics,"best_reg":best_model_name,
            "best_pipeline":best_pipeline,"uses_two_stage":uses_two_stage,
            "best_val_mae":best_val_mae,"best_val_wape":best_val_wape,
            "feature_importance":fi_df.to_dict("records"),
            "ranking_metrics":rank_metrics,
            "ranking_metrics_per_pipeline":rank_per_pipe,
            "ranking_n_relevant":n_rel_test,"ranking_threshold":rank_thresh,
            "potential_model_val_auc":val_pot_auc,
            "potential_model_val_accuracy":val_pot_acc,
            "blend_w_demand":best_wd,"blend_w_potential":best_wp,
            "blend_val_ndcg100":best_ndcg,
            "hcp_master_count":hcp_master_count,
            "eligible_hcp_count":len(inf_df),
            "hcps_with_history":int(has_hist.sum()),
            "hcps_without_history":int((~has_hist).sum()),
            "predicted_hcp_count":len(inf_df),
            "top_n":top_n,"selected_hcp_count":len(latest),
            "all_pred_stats":all_pred_stats,"alloc_stats":alloc_stats,
            "eligible_hcps":len(latest),
            "prescriber_distribution":latest[[
                C_HCP_ID,C_HCP_NAME,C_SPEC,C_LOCALITY,C_ZONE,
                "Probability_Active","Positive_Demand","Expected_3M_Demand",
                "Potential_Score","Potential_Category","final_hcp_score","Samples",
            ]].to_dict("records"),
            "zone_distribution":zones.to_dict("records"),
            "unknown_zone_hcps":unknown_zone_df.to_dict("records"),
            "roi": {k: (v.to_dict("records") if hasattr(v, "to_dict") else v) for k, v in roi_out.items()},
            "roi_scenarios":roi_scenarios,
            "analog_candidates": cands_records,
            "total_samples":req["total_samples"],
            "allocated_samples":int(latest["Samples"].sum()),
            "validation_report":vr,"top_hcp_explanations":exp_rows,
            "diagnostic_table":diag_sample.to_dict("records"),
        }
        try:
            with open(os.path.join(out_dir, "pipeline_result.json"), "w") as f_out:
                json.dump(res, f_out, indent=2, default=str)
        except Exception as _je:
            print(f"[WARN] Failed to write pipeline_result.json: {_je}")

        return res
