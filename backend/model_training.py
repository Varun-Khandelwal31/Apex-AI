import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

USE_XGB = False
try:
    from xgboost import XGBRegressor
    # Quick test import load
    _test = XGBRegressor()
    USE_XGB = True
except Exception:
    USE_XGB = False

from data_pipeline import get_driver_telemetry

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'apex_model.pkl')

def train_and_save_model():
    """
    Trains XGBoost or GradientBoosting regressor to predict lap time loss (LapTimeDelta)
    based on driving inputs: Speed, Throttle, Brake, Gear, Distance.
    Saves model to apex_model.pkl.
    """
    print("Pre-processing telemetry matrix across drivers (VER, HAM, LEC)...")
    df_ver = get_driver_telemetry('VER')
    df_ham = get_driver_telemetry('HAM')
    df_lec = get_driver_telemetry('LEC')

    full_df = pd.concat([df_ver, df_ham, df_lec], ignore_index=True)

    features = ['Speed', 'Throttle', 'Brake', 'Gear', 'Distance']
    X = full_df[features]
    y = full_df['LapTimeDelta']

    if USE_XGB:
        print(f"Training XGBoost Model on {len(X)} telemetry samples...")
        model = XGBRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=5,
            random_state=42
        )
    else:
        print(f"Training GradientBoosting ML Model on {len(X)} telemetry samples...")
        model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=5,
            random_state=42
        )

    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)
    print(f"Successfully trained and saved Apex ML model to {MODEL_PATH}!")
    return model

if __name__ == '__main__':
    train_and_save_model()
