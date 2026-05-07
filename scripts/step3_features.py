import os
import pandas as pd
import numpy as np
import random

CLEAN_DIR = "data/cleaned"
FEATURE_DIR = "data/features"

def synthesize_logistics(df):
    print("\n--- Synthesizing Delivery Logistics ---")
    
    # Set seed for reproducibility
    np.random.seed(42)
    random.seed(42)
    
    n = len(df)
    
    # 1. Generate Latitude and Longitude (India - Bangalore region)
    # Bangalore: 12.9716 N, 77.5946 E
    df["latitude"] = np.random.uniform(12.85, 13.10, n).round(6)
    df["longitude"] = np.random.uniform(77.45, 77.75, n).round(6)
    
    # 2. Generate Distance (1km to 15km)
    df["distance_km"] = np.random.uniform(1.0, 15.0, n).round(2)
    
    # 3. Time features
    # Generate time first so traffic can depend on time of day.
    df["order_hour"] = np.random.randint(8, 24, n)
    df["time_of_day"] = pd.cut(
        df["order_hour"],
        bins=[0, 11, 16, 20, 24],
        labels=["Morning", "Afternoon", "Evening", "Night"],
        right=False,
    )
    df["peak_hour_flag"] = df["order_hour"].apply(lambda x: 1 if x in [13, 14, 19, 20, 21] else 0)
    df["day_of_the_week"] = np.random.choice(["Weekday", "Weekend"], n, p=[0.7, 0.3])

    # 4. Traffic Level (Low, Medium, High, Jam)
    # Traffic now depends on both distance and order hour.
    traffic_levels = []
    for d, h in zip(df["distance_km"], df["order_hour"]):
        is_peak = h in [13, 14, 19, 20, 21]
        if d > 10:
            probs = [0.0, 0.15, 0.45, 0.40] if is_peak else [0.0, 0.28, 0.50, 0.22]
        elif d > 5:
            probs = [0.05, 0.25, 0.45, 0.25] if is_peak else [0.15, 0.42, 0.35, 0.08]
        else:
            probs = [0.20, 0.32, 0.35, 0.13] if is_peak else [0.52, 0.30, 0.18, 0.0]
        traffic_levels.append(np.random.choice(["Low", "Medium", "High", "Jam"], p=probs))
    df["traffic_level"] = traffic_levels
    
    # 5. Food Preparation Time (10 to 45 mins)
    df["food_preparation_time"] = np.random.randint(10, 45, n)
    
    # 6. Actual Delivery Time (depends on distance and traffic)
    traffic_multiplier = {"Low": 1.0, "Medium": 1.3, "High": 1.7, "Jam": 2.5}
    base_speed = 3.0 # minutes per km
    
    delivery_times = []
    for idx, row in df.iterrows():
        t_mult = traffic_multiplier[row["traffic_level"]]
        # Time = (distance * speed * traffic) + random noise
        time = (row["distance_km"] * base_speed * t_mult) + np.random.normal(5, 2)
        delivery_times.append(max(10, int(time)))
        
    df["delivery_time"] = delivery_times
    df["total_time"] = df["food_preparation_time"] + df["delivery_time"]
    
    # 7. Expected Delivery Time (Simulated Swiggy ETA)
    # The ETA is usually based on distance + prep + small buffer
    df["expected_time"] = df["food_preparation_time"] + (df["distance_km"] * 3.0 * 1.3) + 5
    df["expected_time"] = df["expected_time"].astype(int)
    
    # 8. Delivery Delay
    df["delivery_delay"] = df["total_time"] - df["expected_time"]
    
    # 9. Delay Category
    def categorize_delay(d):
        if d < -5: return "Early"
        if d <= 5: return "On Time"
        if d <= 15: return "Slightly Delayed"
        return "Heavily Delayed"
        
    df["delay_category"] = df["delivery_delay"].apply(categorize_delay)
    
    # 10. Recompute rating so delivery experience can affect satisfaction.
    # Keep original source rating as a baseline restaurant quality signal.
    df["base_rating"] = df["rating"]
    delay_penalty = np.where(df["delivery_delay"] > 0, df["delivery_delay"] * 0.02, 0.0)
    traffic_penalty = df["traffic_level"].map({"Low": 0.0, "Medium": 0.03, "High": 0.08, "Jam": 0.12})
    prep_penalty = np.where(df["food_preparation_time"] > 30, (df["food_preparation_time"] - 30) * 0.015, 0.0)
    noise = np.random.normal(0, 0.12, n)
    df["rating"] = (df["base_rating"] - delay_penalty - traffic_penalty - prep_penalty + noise).clip(1.0, 5.0).round(1)

    # 11. Sentiment (Based on rating)
    df["sentiment_score"] = (df["rating"] - 1) / 4.0 # Map 1-5 to 0-1
    df["sentiment"] = df["rating"].apply(lambda x: "Positive" if x >= 4.0 else ("Neutral" if x >= 3.0 else "Negative"))

    return df

def main():
    os.makedirs(FEATURE_DIR, exist_ok=True)
    print("=" * 60)
    print("  STEP 3: FEATURE ENGINEERING PIPELINE")
    print("=" * 60)

    # Load cleaned Swiggy
    df = pd.read_csv(os.path.join(CLEAN_DIR, "swiggy_clean.csv"))
    
    # Synthesize
    df_features = synthesize_logistics(df)
    
    # Save
    out_path = os.path.join(FEATURE_DIR, "master_features.csv")
    df_features.to_csv(out_path, index=False)
    print(f"  --> Saved feature set to: {out_path}")

if __name__ == "__main__":
    main()
