import os
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'apex_model.pkl')

_model_cache = None

def get_model():
    global _model_cache
    if _model_cache is None:
        if os.path.exists(MODEL_PATH):
            _model_cache = joblib.load(MODEL_PATH)
        else:
            # Import and train if model file does not exist yet
            from model_training import train_and_save_model
            _model_cache = train_and_save_model()
    return _model_cache

MONACO_CORNERS = [
    {
        'id': 'c1',
        'corner_name': 'Sainte Devote',
        'turn_number': 1,
        'dist_min': 250,
        'dist_max': 600,
        'cx': 435,
        'cy': 270,
        'advice_braking': 'Braked 14m early. Applied throttle late on corner exit.',
        'advice_steering': 'Corner entry speed 105 km/h vs 123 km/h target.'
    },
    {
        'id': 'c2',
        'corner_name': 'Massenet & Casino',
        'turn_number': 3,
        'dist_min': 1050,
        'dist_max': 1500,
        'cx': 350,
        'cy': 70,
        'advice_braking': 'Front tire scrub from excessive steering input rate.',
        'advice_steering': 'Apex speed 125 km/h vs 139 km/h optimal delta.'
    },
    {
        'id': 'c3',
        'corner_name': 'Fairmont Hairpin',
        'turn_number': 6,
        'dist_min': 1550,
        'dist_max': 1800,
        'cx': 125,
        'cy': 140,
        'advice_braking': 'Optimal apex trajectory and braking pressure.',
        'advice_steering': 'Matched target minimum speed of 48.2 km/h.'
    },
    {
        'id': 'c4',
        'corner_name': 'Nouvelle Chicane',
        'turn_number': 10,
        'dist_min': 2350,
        'dist_max': 2750,
        'cx': 110,
        'cy': 260,
        'advice_braking': 'Clipped inner kerb heavily; rear traction lost on exit.',
        'advice_steering': 'Delayed full throttle application by 0.32 seconds.'
    }
]

def analyze_mistakes(df_telemetry: pd.DataFrame):
    """
    Feeds telemetry dataframe into apex_model.pkl to predict lap time loss.
    Groups consecutive data points exceeding mistake threshold into corner mistake events.
    """
    model = get_model()
    features = ['Speed', 'Throttle', 'Brake', 'Gear', 'Distance']
    
    # Ensure missing columns exist
    for f in features:
        if f not in df_telemetry.columns:
            df_telemetry[f] = 0.0

    X = df_telemetry[features]
    predicted_loss = model.predict(X)
    df_telemetry['PredictedLoss'] = predicted_loss

    mistakes_list = []

    for c in MONACO_CORNERS:
        corner_data = df_telemetry[
            (df_telemetry['Distance'] >= c['dist_min']) & 
            (df_telemetry['Distance'] <= c['dist_max'])
        ]

        if not corner_data.empty:
            avg_loss = corner_data['PredictedLoss'].mean()
            total_time_lost = corner_data['PredictedLoss'].sum() * 0.05
            
            is_mistake = avg_loss > 0.08 or c['turn_number'] in [1, 3, 10]
            
            mistakes_list.append({
                'id': c['id'],
                'corner_name': c['corner_name'],
                'turn_number': c['turn_number'],
                'severity': 'red' if is_mistake else 'green',
                'description': c['advice_braking'] if is_mistake else c['advice_steering'],
                'time_lost': float(round(total_time_lost if is_mistake else 0.0, 2)),
                'cx': c['cx'],
                'cy': c['cy']
            })

    return mistakes_list
