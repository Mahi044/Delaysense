import os
import pandas as pd
import numpy as np

FEATURE_DIR = "data/features"
MODEL_DIR = "data/modeled"

def build_star_schema():
    os.makedirs(MODEL_DIR, exist_ok=True)
    print("=" * 60)
    print("  STEP 4: STAR SCHEMA GENERATION")
    print("=" * 60)

    # 1. Load Master Features
    df = pd.read_csv(os.path.join(FEATURE_DIR, "master_features.csv"))

    # =========================================================================
    # DIMENSION: dim_restaurant
    # =========================================================================
    dim_restaurant = df[["restaurant_name", "cuisine_type"]].drop_duplicates().reset_index(drop=True)
    dim_restaurant.insert(0, "restaurant_id", range(1, 1 + len(dim_restaurant)))
    dim_restaurant.to_csv(os.path.join(MODEL_DIR, "dim_restaurant.csv"), index=False)
    
    # Map restaurant_id to df
    rest_map = dict(zip(dim_restaurant["restaurant_name"], dim_restaurant["restaurant_id"]))
    df["restaurant_id"] = df["restaurant_name"].map(rest_map)

    # =========================================================================
    # DIMENSION: dim_customer (Synthetic)
    # =========================================================================
    # Generate random customer IDs for the orders
    n_customers = 1000
    df["customer_id"] = np.random.randint(1, n_customers + 1, len(df))
    
    dim_customer = pd.DataFrame({
        "customer_id": range(1, n_customers + 1),
        "Age": np.random.randint(18, 65, n_customers),
        "Gender": np.random.choice(["Male", "Female", "Other"], n_customers, p=[0.5, 0.45, 0.05]),
        "Income": np.random.randint(20000, 150000, n_customers)
    })
    dim_customer.to_csv(os.path.join(MODEL_DIR, "dim_customer.csv"), index=False)

    # =========================================================================
    # FACT: fact_orders
    # =========================================================================
    fact_orders = df[[
        "order_id", "customer_id", "restaurant_id",
        "cost", "base_rating", "rating", "food_preparation_time", "delivery_time",
        "total_time", "delivery_delay", "distance_km",
        "order_hour", "time_of_day", "peak_hour_flag",
        "traffic_level", "delay_category", "day_of_the_week",
        "sentiment", "sentiment_score", "latitude", "longitude"
    ]].copy()

    fact_orders.to_csv(os.path.join(MODEL_DIR, "fact_orders.csv"), index=False)
    print(f"  --> Saved fact_orders.csv ({len(fact_orders)} rows)")

if __name__ == "__main__":
    build_star_schema()
