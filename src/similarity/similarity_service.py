"""
similarity_service.py — Dataset2 compatible.
Uses internal column names from schema_mapper.
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

from src.config import (
    ANALOG_WEIGHT_PROFILE, ANALOG_WEIGHT_BEHAVIOR, ANALOG_WEIGHT_QUALITY,
    FORM_PENALTY,
)
from src.data.schema_mapper import C_MED_ID, C_GNRC, C_TC, C_FORM, C_STR, C_PRICE
from src.segmentation.segmentation_service import _norm_form, _strength_compat


def _safe_norm(s):
    mn, mx = s.min(), s.max()
    return (s - mn) / (mx - mn) if mx > mn else pd.Series(
        np.full(len(s), 0.5), index=s.index)


class SimilarityService:
    def rank(self, target, candidates, event_stats=None):
        if candidates.empty:
            return candidates.assign(
                Profile_Similarity=pd.Series(dtype=float),
                Behavior_Similarity=pd.Series(dtype=float),
                Data_Quality=pd.Series(dtype=float),
                Final_Analog_Score=pd.Series(dtype=float),
                Similarity_Score=pd.Series(dtype=float),
                Rank=pd.Series(dtype=int),
            )

        d = candidates.copy()

        # ── Profile similarity (cosine on TC + Form + price + strength compat) ─
        cat_cols = [C_TC, C_FORM]
        enc = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        cat_mat = enc.fit_transform(d[cat_cols].fillna(""))
        sc  = StandardScaler()
        price_mat = sc.fit_transform(d[[C_PRICE]].fillna(0))

        if "Strength_Compat" not in d.columns:
            target_str = str(target.get("strength", "")).strip()
            d["Strength_Compat"] = d[C_STR].apply(
                lambda s: _strength_compat(target_str, s))
        str_mat = d[["Strength_Compat"]].values

        cand_mat = np.hstack([cat_mat, price_mat, str_mat])
        t_cat    = enc.transform(pd.DataFrame([{
            C_TC:   target.get("therapeutic_class", ""),
            C_FORM: target.get("dosage_form", ""),
        }], columns=cat_cols))
        t_price  = sc.transform([[target.get("unit_price",
                                   float(d[C_PRICE].median()))]])
        t_vec    = np.hstack([t_cat, t_price, [[1.0]]])
        raw_prof = np.clip(cosine_similarity(t_vec, cand_mat)[0], 0, 1)

        # Penalty for tier-3 form mismatch
        target_form = _norm_form(target.get("dosage_form", ""))
        if "Segment_Tier" in d.columns:
            tier3 = (d["Segment_Tier"] == 3).values
            form_ok = (d[C_FORM].apply(_norm_form) == target_form).values
            penalty = np.where(tier3 & ~form_ok, FORM_PENALTY, 1.0)
        else:
            penalty = np.ones(len(d))
        profile_scores = raw_prof * penalty

        # ── Behavior similarity ─────────────────────────────────────────
        if event_stats is not None and not event_stats.empty:
            d2 = d.merge(event_stats, on=C_MED_ID, how="left")
            bcols = ["Avg_Monthly_Qty","Recent_3M_Qty","Recent_6M_Qty",
                     "Growth_Rate","HCP_Coverage"]
            for c in bcols:
                if c not in d2.columns: d2[c] = 0.0
                else: d2[c] = d2[c].fillna(0)
            beh_mat = np.column_stack([_safe_norm(d2[c]).values for c in bcols])
            behavior_scores = beh_mat.mean(axis=1)
        else:
            behavior_scores = np.full(len(d), 0.5)

        # ── Data quality ────────────────────────────────────────────────
        if event_stats is not None and not event_stats.empty:
            dq = d.merge(event_stats, on=C_MED_ID, how="left")
            quality_scores = (
                0.50 * _safe_norm(np.log1p(dq["Historical_Events"].fillna(0))).values
                + 0.30 * _safe_norm(dq["Active_HCPs"].fillna(0)).values
                + 0.20 * _safe_norm(dq["Historical_Months"].fillna(0)).values
            )
        else:
            quality_scores = np.full(len(d), 0.5)

        final = (ANALOG_WEIGHT_PROFILE  * profile_scores
               + ANALOG_WEIGHT_BEHAVIOR * behavior_scores
               + ANALOG_WEIGHT_QUALITY  * quality_scores)

        d["Profile_Similarity"]  = np.round(profile_scores, 4)
        d["Behavior_Similarity"] = np.round(behavior_scores, 4)
        d["Data_Quality"]        = np.round(quality_scores, 4)
        d["Final_Analog_Score"]  = np.round(final, 4)
        d["Similarity_Score"]    = d["Final_Analog_Score"]

        d = d.sort_values("Final_Analog_Score", ascending=False).reset_index(drop=True)
        d["Rank"] = range(1, len(d) + 1)
        return d
