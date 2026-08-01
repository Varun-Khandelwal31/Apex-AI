import os
import pandas as pd
import numpy as np
try:
    import fastf1
    FASTF1_AVAILABLE = True
except ImportError:
    FASTF1_AVAILABLE = False

CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

if FASTF1_AVAILABLE:
    try:
        fastf1.Cache.enable_cache(CACHE_DIR)
    except Exception as e:
        print(f"FastF1 cache enable notice: {e}")

def get_driver_telemetry(driver_code: str = 'VER', lap_type: str = 'fastest') -> pd.DataFrame:
    """
    Ingests and cleans telemetry data using FastF1 or deterministic telemetry fallback.
    Extracts Speed, Throttle, Brake, Gear, RPM, Distance, and LapTimeDelta.
    """
    driver_code = driver_code.upper()
    if driver_code == 'VERSTAPPEN':
        driver_code = 'VER'
    elif driver_code == 'HAMILTON':
        driver_code = 'HAM'
    elif driver_code == 'LECLERC':
        driver_code = 'LEC'

    if FASTF1_AVAILABLE:
        try:
            print(f"Loading 2023 Monaco GP session for driver {driver_code}...")
            session = fastf1.get_session(2023, 'Monaco', 'Q')
            session.load(telemetry=True, laps=True, weather=False)
            driver_laps = session.laps.pick_drivers(driver_code)
            
            if lap_type == 'fastest':
                lap = driver_laps.pick_fastest()
            else:
                lap = driver_laps.iloc[0]

            telemetry = lap.get_telemetry()
            
            # Clean and process telemetry using Pandas
            df = pd.DataFrame({
                'Distance': telemetry['Distance'].ffill().bfill(),
                'Speed': telemetry['Speed'].ffill().bfill(),
                'Throttle': telemetry['Throttle'].ffill().bfill(),
                'Brake': telemetry['Brake'].astype(float).ffill().bfill(),
                'Gear': telemetry['nGear'].ffill().bfill(),
                'RPM': telemetry['RPM'].ffill().bfill() if 'RPM' in telemetry else 11000,
            })
            
            # Calculate lap time delta compared to theoretical optimal
            df['AI_Optimal_Speed'] = df['Speed'] * np.where((df['Speed'] < 160) & (df['Brake'] > 10), 1.12, 1.02)
            df['LapTimeDelta'] = (df['AI_Optimal_Speed'] - df['Speed']) / 100.0
            return df
        except Exception as e:
            print(f"FastF1 live load fallback to synthetic telemetry: {e}")

    # Synthetic Monaco Telemetry Fallback (100% reliable for offline demo runs)
    distances = np.arange(0, 3340, 40)
    data = []
    for d in distances:
        is_t1 = 300 <= d <= 600
        is_t3 = 1100 <= d <= 1450
        is_hairpin = 1600 <= d <= 1750
        is_tunnel = 1900 <= d <= 2300

        if is_t1:
            speed = 105.0 + np.sin(d/30)*15
            throttle = 35.0
            brake = 65.0
            gear = 3
        elif is_t3:
            speed = 125.0 + np.sin(d/25)*10
            throttle = 50.0
            brake = 40.0
            gear = 4
        elif is_hairpin:
            speed = 48.0 + np.sin(d/10)*5
            throttle = 20.0
            brake = 85.0
            gear = 1
        elif is_tunnel:
            speed = 290.0 + np.sin(d/100)*5
            throttle = 100.0
            brake = 0.0
            gear = 8
        else:
            speed = 230.0 + np.sin(d/100)*30
            throttle = 88.0
            brake = 0.0
            gear = 7

        optimal_speed = speed + (18.0 if is_t1 else 14.0 if is_t3 else 0.0)
        time_delta = max(0.0, (optimal_speed - speed) / 80.0)

        data.append({
            'Distance': float(d),
            'Speed': float(round(speed, 1)),
            'Throttle': float(round(throttle, 1)),
            'Brake': float(round(brake, 1)),
            'Gear': int(gear),
            'RPM': int(speed * 45 + 2000),
            'AI_Optimal_Speed': float(round(optimal_speed, 1)),
            'LapTimeDelta': float(round(time_delta, 3))
        })

    return pd.DataFrame(data)

def generate_ghost_lap() -> pd.DataFrame:
    """
    The 'Ghost Lap' Data Engine:
    Takes the top 5 fastest laps from a session (e.g. Monaco Q), extracts their mini-sector speeds,
    and stitches together the absolute maximum speed per mini-sector into a theoretical 'Ghost Lap'.
    """
    if FASTF1_AVAILABLE:
        try:
            print("Generating Ghost Lap from Top 5 fastest session laps...")
            session = fastf1.get_session(2023, 'Monaco', 'Q')
            session.load(telemetry=True, laps=True, weather=False)
            
            # Select top 5 fastest overall laps in session
            top_5_laps = session.laps.pick_quicklaps().nsmallest(5, 'LapTime')
            
            grid_distance = np.linspace(0, 3337, 200)
            telemetry_list = []
            
            for _, lap in top_5_laps.iterrows():
                try:
                    t = lap.get_telemetry()
                    t_df = pd.DataFrame({
                        'Distance': t['Distance'].ffill().bfill(),
                        'Speed': t['Speed'].ffill().bfill(),
                        'Throttle': t['Throttle'].ffill().bfill(),
                        'Brake': t['Brake'].astype(float).ffill().bfill(),
                        'Gear': t['nGear'].ffill().bfill()
                    })
                    # Interpolate onto common distance grid
                    interp_speed = np.interp(grid_distance, t_df['Distance'], t_df['Speed'])
                    interp_throttle = np.interp(grid_distance, t_df['Distance'], t_df['Throttle'])
                    interp_brake = np.interp(grid_distance, t_df['Distance'], t_df['Brake'])
                    interp_gear = np.interp(grid_distance, t_df['Distance'], t_df['Gear'])
                    
                    telemetry_list.append({
                        'speed': interp_speed,
                        'throttle': interp_throttle,
                        'brake': interp_brake,
                        'gear': interp_gear
                    })
                except Exception:
                    continue

            if len(telemetry_list) > 0:
                ghost_rows = []
                for i in range(len(grid_distance)):
                    # Stitches max speed across top laps for each mini-sector
                    best_idx = max(range(len(telemetry_list)), key=lambda idx: telemetry_list[idx]['speed'][i])
                    ghost_rows.append({
                        'Distance': float(round(grid_distance[i], 1)),
                        'Speed': float(round(telemetry_list[best_idx]['speed'][i], 1)),
                        'Throttle': float(round(telemetry_list[best_idx]['throttle'][i], 1)),
                        'Brake': float(round(telemetry_list[best_idx]['brake'][i], 1)),
                        'Gear': int(round(telemetry_list[best_idx]['gear'][i]))
                    })
                return pd.DataFrame(ghost_rows)
        except Exception as e:
            print(f"FastF1 Ghost Lap extraction fallback: {e}")

    # Fallback Ghost Lap Data Engine (Ideal theoretical Monaco lap)
    driver_df = get_driver_telemetry('VER')
    ghost_rows = []
    for _, row in driver_df.iterrows():
        dist = row['Distance']
        is_t1 = 300 <= dist <= 600
        is_t3 = 1100 <= dist <= 1450
        
        # Ghost car carries +12 to +18 km/h optimal apex speed
        optimal_speed = row['Speed'] + (18.0 if is_t1 else 14.0 if is_t3 else 4.0)
        ghost_throttle = min(100.0, row['Throttle'] + (15.0 if is_t1 else 5.0))
        ghost_brake = max(0.0, row['Brake'] - (10.0 if is_t1 else 0.0))

        ghost_rows.append({
            'Distance': float(round(dist, 1)),
            'Speed': float(round(optimal_speed, 1)),
            'Throttle': float(round(ghost_throttle, 1)),
            'Brake': float(round(ghost_brake, 1)),
            'Gear': int(row['Gear'])
        })
    return pd.DataFrame(ghost_rows)
