import json
import pandas as pd
import numpy as np
from datetime import datetime

def parse_time(time_str):
    return datetime.strptime(time_str, '%H:%M').time()

def analyze_parking_data():
    # Hardcode the mock data structure for now
    data = [
        {
            "id": 1,
            "name": "Allen Fieldhouse Lot",
            "total": 60,
            "dataPoints": [
                {"time": "07:00", "occupied": 10},
                {"time": "08:00", "occupied": 38},
                {"time": "09:00", "occupied": 48},
                {"time": "10:00", "occupied": 58},
                {"time": "11:00", "occupied": 57},
                {"time": "12:00", "occupied": 54},
                {"time": "13:00", "occupied": 50},
                {"time": "14:00", "occupied": 38},
                {"time": "15:00", "occupied": 32},
                {"time": "16:00", "occupied": 22},
                {"time": "17:00", "occupied": 12}
            ]
        },
        {
            "id": 2,
            "name": "Mississippi Street Garage",
            "total": 100,
            "dataPoints": [
                {"time": "07:00", "occupied": 25},
                {"time": "08:00", "occupied": 42},
                {"time": "09:00", "occupied": 65},
                {"time": "10:00", "occupied": 82},
                {"time": "11:00", "occupied": 94},
                {"time": "12:00", "occupied": 95},
                {"time": "13:00", "occupied": 88},
                {"time": "14:00", "occupied": 75},
                {"time": "15:00", "occupied": 60},
                {"time": "16:00", "occupied": 45},
                {"time": "17:00", "occupied": 30}
            ]
        }
    ]

    popular_times = {}
    
    for lot in data:
        lot_name = lot['name']
        total_spaces = lot['total']
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(lot['dataPoints'])
        df['time'] = df['time'].apply(parse_time)
        df['hour'] = df['time'].apply(lambda x: x.hour)
        df['occupancy_rate'] = (df['occupied'] / total_spaces) * 100
        
        # Group by hour and calculate average occupancy
        hourly_avg = df.groupby('hour')['occupancy_rate'].mean().round(2)
        
        # Create 24-hour data (fill missing hours with 0)
        full_hours = pd.Series(index=range(24), data=0.0)
        full_hours.update(hourly_avg)
        
        popular_times[lot_name] = {
            'data': full_hours.tolist(),
            'max_occupancy': full_hours.max()
        }
    
    # Save the analyzed data
    with open('../src/data/popularTimes.json', 'w') as f:
        json.dump(popular_times, f, indent=2)

if __name__ == '__main__':
    analyze_parking_data()