"""
schema_mapper.py
Maps Dataset2's actual column names to the internal standard schema
used throughout the ML pipeline.

Dataset2 columns discovered:
  Medicine master : Medicine_ID, Generic_Name, Brand_Name,
                    Therapeutic_Class, Dosage_Form, Strength,
                    Unit_Price_INR, Sample_Eligible
  HCP master      : HCP_ID, HCP_Name, Specialty, City,
                    Locality, Zone
  Events          : HCP_ID, Medicine_ID, Purchase_Date,
                    Tot_Clms, Tot_Fills, Tot_Day_Suply,
                    Quantity, Tot_Benes, Tot_Drug_Cst

Internal standard names (used in ML pipeline):
  MEDICINE:  medicine_id, generic_name, brand_name,
             therapeutic_class, dosage_form, strength,
             unit_price, sample_eligible
  HCP:       hcp_id, hcp_name, specialty, city, locality, zone
  EVENT:     hcp_id, medicine_id, purchase_date,
             claims, fills, days_supply, quantity,
             beneficiaries, drug_cost
"""

# ---------------------------------------------------------------------------
# Column rename maps:  Dataset2 col → internal name
# ---------------------------------------------------------------------------

MEDICINE_RENAME = {
    "Medicine_ID":        "medicine_id",
    "Generic_Name":       "generic_name",
    "Brand_Name":         "brand_name",
    "Therapeutic_Class":  "therapeutic_class",
    "Dosage_Form":        "dosage_form",
    "Strength":           "strength",
    "Unit_Price_INR":     "unit_price",
    "Sample_Eligible":    "sample_eligible",
}

HCP_RENAME = {
    "HCP_ID":    "hcp_id",
    "HCP_Name":  "hcp_name",
    "Specialty": "specialty",
    "City":      "city",
    "Locality":  "locality",
    "Zone":      "zone",
}

EVENT_RENAME = {
    "HCP_ID":        "hcp_id",
    "Medicine_ID":   "medicine_id",
    "Purchase_Date": "purchase_date",
    "Tot_Clms":      "claims",
    "Tot_Fills":     "fills",
    "Tot_Day_Suply": "days_supply",
    "Quantity":      "quantity",
    "Tot_Benes":     "beneficiaries",
    "Tot_Drug_Cst":  "drug_cost",
}

# Fields NOT in Dataset2 (marked unavailable — no fabrication):
UNAVAILABLE_FIELDS = {
    "event_id":         "Not present in Dataset2 events",
    "gnrc_name_event":  "Not in events; join from medicine master if needed",
    "brnd_name_event":  "Not in events; join from medicine master if needed",
    "prscrbr_city":     "Not in events; available in HCP master as 'city'",
}

# ---------------------------------------------------------------------------
# Internal column name constants (use these everywhere in the pipeline)
# ---------------------------------------------------------------------------

# medicine
C_MED_ID    = "medicine_id"
C_GNRC      = "generic_name"
C_BRAND     = "brand_name"
C_TC        = "therapeutic_class"
C_FORM      = "dosage_form"
C_STR       = "strength"
C_PRICE     = "unit_price"
C_ELIG      = "sample_eligible"

# hcp
C_HCP_ID    = "hcp_id"
C_HCP_NAME  = "hcp_name"
C_SPEC      = "specialty"
C_CITY      = "city"
C_LOCALITY  = "locality"
C_ZONE      = "zone"

# event
C_PDATE     = "purchase_date"
C_CLAIMS    = "claims"
C_FILLS     = "fills"
C_DAYS      = "days_supply"
C_QTY       = "quantity"
C_BENES     = "beneficiaries"
C_DCOST     = "drug_cost"


def apply_medicine_schema(df):
    """Rename Dataset2 medicine columns to internal names."""
    return df.rename(columns=MEDICINE_RENAME)


def apply_hcp_schema(df):
    """Rename Dataset2 HCP columns to internal names."""
    return df.rename(columns=HCP_RENAME)


def apply_event_schema(df):
    """Rename Dataset2 event columns to internal names."""
    return df.rename(columns=EVENT_RENAME)
