"""roi.py — ROI calculation, scenarios, and sensitivity matrix."""

import numpy as np
import pandas as pd
from src.config import ROI_SCENARIOS


def _single(predicted_demand, total_samples, price, sample_cost,
             units, lift, var_cost):
    inv    = total_samples * sample_cost
    rx     = predicted_demand * lift
    iu     = rx * units
    rev    = iu * price
    vc     = iu * var_cost
    profit = rev - vc
    roi    = ((profit - inv) / inv * 100) if inv > 0 else 0.0
    margin = price - var_cost
    be_rx    = (inv / (units * margin))  if (units * margin) > 0 else float("nan")
    be_lift  = (be_rx / predicted_demand) if predicted_demand > 0 else float("nan")
    be_sc    = (profit / total_samples)   if total_samples > 0  else float("nan")
    be_price = ((inv + vc) / iu)          if iu > 0             else float("nan")
    return {
        "lift": lift, "sample_investment": inv,
        "predicted_baseline_demand": predicted_demand,
        "expected_incremental_prescriptions": rx,
        "expected_incremental_units": iu,
        "expected_revenue": rev,
        "expected_variable_cost": vc,
        "expected_incremental_profit": profit,
        "projected_roi_percent": roi,
        "breakeven_incremental_prescriptions": be_rx,
        "breakeven_sample_lift": be_lift,
        "breakeven_sample_cost": be_sc,
        "breakeven_medicine_price": be_price,
        "max_sample_cost_for_positive_roi": (profit / total_samples) if total_samples > 0 else 0,
    }


def calculate(df, total_samples, price, sample_cost=0, units=1,
               lift=0.1, var_cost=0):
    predicted_demand = float(df["Predicted_Demand"].sum())
    result = _single(predicted_demand, total_samples, price,
                     sample_cost, units, lift, var_cost)
    df2 = df.copy()
    df2["Sample_Investment"]           = df2["Samples"] * sample_cost
    df2["Expected_Incremental_Rx"]     = df2["Predicted_Demand"] * lift
    df2["Expected_Incremental_Units"]  = df2["Expected_Incremental_Rx"] * units
    df2["Expected_Revenue"]            = df2["Expected_Incremental_Units"] * price
    df2["Expected_Variable_Cost"]      = df2["Expected_Incremental_Units"] * var_cost
    df2["Expected_Incremental_Profit"] = df2["Expected_Revenue"] - df2["Expected_Variable_Cost"]
    df2["Projected_ROI_Pct"] = np.where(
        df2["Sample_Investment"] > 0,
        (df2["Expected_Incremental_Profit"] - df2["Sample_Investment"])
        / df2["Sample_Investment"] * 100, 0)
    result.update({
        "medicine_price": price, "sample_cost": sample_cost,
        "total_samples": total_samples, "hcp_df": df2,
        "disclaimer": (
            "Projected ROI based on supplied assumptions; not causal or realized promotional ROI."
        ),
    })
    return result


def calculate_scenarios(predicted_demand, total_samples, price,
                         sample_cost=0, units=1, var_cost=0,
                         scenarios=None):
    if scenarios is None:
        scenarios = {**ROI_SCENARIOS, "Very High (50%)": 0.50}
    return {
        name: _single(predicted_demand, total_samples, price,
                      sample_cost, units, lift, var_cost)
        for name, lift in scenarios.items()
    }


def sensitivity_matrix(predicted_demand, total_samples, price=120.0,
                        sample_cost=0, units=1, var_cost=0, prices=None):
    """
    Rows: sample lift values
    Cols: medicine price values (dynamically centered around target price)
    Cell: projected ROI %
    """
    lifts = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]
    if prices is None:
        base_px = max(10.0, float(price))
        # Compute dynamic price multipliers: 50%, 75%, 100%, 125%, 150%, 200%
        prices = sorted(list(set([round(base_px * r, 1) for r in [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]])))

    rows = []
    for lift in lifts:
        row = {"Sample_Lift": f"{int(lift*100)}%"}
        for px in prices:
            r = _single(predicted_demand, total_samples, px,
                        sample_cost, units, lift, var_cost)
            row[f"Price_{px}"] = round(r["projected_roi_percent"], 1)
        rows.append(row)
    return pd.DataFrame(rows)
