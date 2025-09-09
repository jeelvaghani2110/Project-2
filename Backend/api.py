# api.py
import os
import pickle
from typing import List, Optional, Dict, Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.neighbors import NearestNeighbors

# ---------------------------
# Config / paths
# ---------------------------
MODEL_PATH = "tourist_recommender.pkl"   # Put the .pkl in same folder as this file
CSV_PATH = None  # optional: if saved inside artifacts no need. If you want to load CSV separately set path.

# ---------------------------
# Load artifacts
# ---------------------------
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model bundle not found at '{MODEL_PATH}'. Place tourist_recommender.pkl here.")

with open(MODEL_PATH, "rb") as f:
    artifacts = pickle.load(f)

# expected keys in artifacts: model, scaler, encoders, features, df
knn_model: NearestNeighbors = artifacts.get("model")
scaler = artifacts.get("scaler")
encoders: Dict[str, Any] = artifacts.get("encoders", {})
feature_cols: List[str] = artifacts.get("features")
df: Optional[pd.DataFrame] = artifacts.get("df")

# If df not saved inside artifacts but CSV exists on disk, optionally load it:
if df is None and CSV_PATH and os.path.exists(CSV_PATH):
    df = pd.read_csv(CSV_PATH)
    if "State" in df.columns:
        df["State"] = df["State"].fillna("-").astype(str)

if df is None:
    raise RuntimeError("No dataframe available. Save df in the pickle under 'df' or set CSV_PATH and re-run.")

# Ensure encoded columns exist in df. If missing, create them using encoders
for col_name, le in encoders.items():
    encoded_col = col_name + "_encoded"
    if encoded_col not in df.columns:
        try:
            df[encoded_col] = le.transform(df[col_name].astype(str))
        except Exception:
            # Best-effort: try to map by matching classes; if fails leave as -1
            df[encoded_col] = -1

# ---------------------------
# App + CORS
# ---------------------------
app = FastAPI(title="Tourist Recommender API")

# Allow local dev origins; add any other origins you use
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # "http://your-frontend-host:port"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Request schema
# ---------------------------
class RecommendRequest(BaseModel):
    Location: str
    State: Optional[str] = None
    Climate: str
    BudgetLevel: str
    AvgCostINR: float
    PopularityScore: float
    AvgTempC: float
    Rating: float
    SafetyIndex: float
    Accessibility: str
    TransportCostINR: float
    top_k: Optional[int] = 10


# ---------------------------
# Utility helpers
# ---------------------------
def encode_or_raise(col: str, value: str):
    """Encode using saved LabelEncoder or raise HTTPException with helpful message."""
    if col not in encoders:
        raise HTTPException(status_code=500, detail=f"Encoder for '{col}' not found in model artifacts.")
    le = encoders[col]
    try:
        return int(le.transform([value])[0])
    except Exception:
        allowed = list(le.classes_) if hasattr(le, "classes_") else []
        raise HTTPException(
            status_code=400,
            detail=f"Invalid value '{value}' for '{col}'. Allowed values: {allowed}"
        )


# ---------------------------
# Endpoints
# ---------------------------
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": bool(knn_model is not None), "features": feature_cols}


@app.get("/encoders")
def get_encoders():
    """Return available classes for each encoder (useful for populating dropdowns)."""
    result = {}
    for k, le in encoders.items():
        if hasattr(le, "classes_"):
            result[k] = list(le.classes_)
        else:
            result[k] = []
    return result


@app.get("/states")
def get_states(country: Optional[str] = None):
    """Return unique states (optionally filtered by country)."""
    _df = df.copy()
    if country:
        if "Country" in _df.columns:
            _df = _df[_df["Country"] == country]
        else:
            return []
    if "State" in _df.columns:
        return sorted(_df["State"].fillna("-").astype(str).unique().tolist())
    return []


@app.post("/predict")
def predict(req: RecommendRequest):
    # 1) filter by India or not India + optional state
    user = req.dict()
    filtered_df = df.copy()

    if user["Location"] == "India":
        if "Country" in filtered_df.columns:
            filtered_df = filtered_df[filtered_df["Country"] == "India"]
            if user.get("State") and user["State"] != "Any State":
                filtered_df = filtered_df[filtered_df["State"] == user["State"]]
    else:
        if "Country" in filtered_df.columns:
            filtered_df = filtered_df[filtered_df["Country"] != "India"]

    if filtered_df.empty:
        raise HTTPException(status_code=404, detail="No matching destinations found after filtering.")

    # 2) encode user input (with clear errors if unknown value)
    try:
        encoded_input = {
            "Climate_encoded": encode_or_raise("Climate", user["Climate"]),
            "BudgetLevel_encoded": encode_or_raise("BudgetLevel", user["BudgetLevel"]),
            "AvgCostINR": float(user["AvgCostINR"]),
            "PopularityScore": float(user["PopularityScore"]),
            "AvgTempC": float(user["AvgTempC"]),
            "Rating": float(user["Rating"]),
            "SafetyIndex": float(user["SafetyIndex"]),
            "Accessibility_encoded": encode_or_raise("Accessibility", user["Accessibility"]),
            "TransportCostINR": float(user["TransportCostINR"]),
        }
    except HTTPException as e:
        # forward user-friendly encoding errors
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 3) prepare input and scale
    X_input = pd.DataFrame([encoded_input])
    # ensure columns order matches feature_cols
    try:
        X_input = X_input[feature_cols]
    except KeyError as e:
        raise HTTPException(status_code=500, detail=f"Feature columns mismatch: {e}")

    try:
        X_scaled = scaler.transform(X_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scaling error: {e}")

    # 4) build KNN on filtered slice and query (keeps original behaviour)
    try:
        model = NearestNeighbors(n_neighbors=min(user.get("top_k", 10), len(filtered_df)))
        model.fit(scaler.transform(filtered_df[feature_cols]))
        _, indices = model.kneighbors(X_scaled)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KNN error: {e}")

    # 5) return results as an array (so frontend expecting array works)
    results_df = filtered_df.iloc[indices[0]][[
        "Destination", "Country", "State", "SourceCity", "Climate", "BudgetLevel",
        "AvgCostINR", "Activities", "Rating", "SafetyIndex", "TransportCostINR"
    ]]

    return results_df.reset_index(drop=True).to_dict(orient="records")


# ---------------------------
# Run server
# ---------------------------
if __name__ == "__main__":
    # use uvicorn module runner; avoids requiring uvicorn in PATH directly
    import uvicorn

    # bind to 0.0.0.0 for access from other devices on same network if needed
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
