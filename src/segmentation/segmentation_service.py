"""
segmentation_service.py — Dataset2 compatible.
Uses internal column names from schema_mapper.
"""
import re
from src.data.schema_mapper import C_MED_ID, C_GNRC, C_TC, C_FORM, C_STR, C_ELIG


def _norm_form(s):
    return re.sub(r"\s+", " ", str(s).strip().lower())


def _parse_mg(s):
    m = re.search(r"(\d+(?:\.\d+)?)", str(s))
    return float(m.group(1)) if m else None


def _strength_compat(t_str, c_str, thresholds=None):
    from src.config import STRENGTH_COMPAT_THRESHOLDS
    if thresholds is None:
        thresholds = STRENGTH_COMPAT_THRESHOLDS
    t, c = _parse_mg(t_str), _parse_mg(c_str)
    if t is None or c is None:
        return 0.5
    if max(t, c) == 0:
        return 1.0
    ratio = min(t, c) / max(t, c)
    for min_r, score in thresholds:
        if ratio >= min_r:
            return score
    return 0.0


class SegmentationService:
    def candidates(self, target, meds, excluded_id=None, excluded_generic=None):
        x = meds[meds[C_ELIG].astype(str).str.lower().isin(["true","1","yes"])].copy()

        # Hard exclusion
        if excluded_id:
            x = x[x[C_MED_ID].astype(str).str.strip() != str(excluded_id).strip()]
        if excluded_generic:
            x = x[x[C_GNRC].str.strip().str.lower() != excluded_generic.strip().lower()]

        if x.empty:
            return x, self._empty_seg()

        target_tc   = str(target.get("therapeutic_class","")).strip().lower()
        target_form = _norm_form(target.get("dosage_form",""))
        target_str  = str(target.get("strength","")).strip()

        x = x.copy()
        x["_tc"]   = x[C_TC].str.strip().str.lower()
        x["_form"] = x[C_FORM].apply(_norm_form)
        x["_str"]  = x[C_STR].astype(str).str.strip()
        x["Strength_Compat"] = x["_str"].apply(
            lambda s: _strength_compat(target_str, s))

        tc_mask    = x["_tc"]   == target_tc
        form_mask  = x["_form"] == target_form
        str_exact  = x["_str"].str.lower() == target_str.lower()
        str_close  = x["Strength_Compat"] >= 0.80
        str_mask   = str_exact | str_close

        for tier, mask, reason in [
            (1, tc_mask & form_mask & str_mask,
             "Same TC, dosage form, compatible strength"),
            (2, tc_mask & form_mask,
             "Same TC and dosage form"),
            (3, tc_mask,
             "Same TC only"),
        ]:
            sub = x[mask].copy()
            if not sub.empty:
                sub["Segment_Tier"] = tier
                sub["Reason"]       = reason
                x.drop(columns=["_tc","_form","_str"], inplace=True)
                return sub, {
                    "candidate_count": len(sub), "Tier": tier,
                    "Tier 1": len(sub) if tier==1 else 0,
                    "Tier 2": len(sub) if tier==2 else 0,
                    "Tier 3": len(sub) if tier==3 else 0,
                    "target_form": target_form,
                }

        x.drop(columns=["_tc","_form","_str"], inplace=True)
        return x.iloc[0:0], self._empty_seg()

    @staticmethod
    def _empty_seg():
        return {"candidate_count":0,"Tier":0,
                "Tier 1":0,"Tier 2":0,"Tier 3":0}

    @staticmethod
    def strength_compat_score(t, c):
        return _strength_compat(t, c)
