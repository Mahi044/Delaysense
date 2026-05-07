import os
import pandas as pd
import numpy as np

RAW_DIR = "data/raw"
CLEAN_DIR = "data/cleaned"

def clean_swiggy(df):
    print("\n--- Cleaning Swiggy Dataset ---")
    original_rows = len(df)
    
    # 1. Ensure correct types and handle missing values
    df["Price (INR)"] = pd.to_numeric(df["Price (INR)"], errors="coerce")
    df["Rating"] = pd.to_numeric(df["Rating"], errors="coerce")
    df["Rating Count"] = pd.to_numeric(df["Rating Count"], errors="coerce")
    
    # 2. Filter out bad data (e.g., 0 ratings or 0 prices if any)
    df = df.dropna(subset=["Price (INR)", "Rating", "Restaurant Name"])
    df = df[df["Rating"] > 0]
    df = df[df["Price (INR)"] > 0]
    
    # 3. Sample 20000 random rows to prevent crashing the dashboard UI
    if len(df) > 20000:
        print(f"  Sampling 20000 rows from {len(df)} valid rows...")
        df = df.sample(n=20000, random_state=42)
    
    # 4. Rename columns to be standard
    df = df.rename(columns={
        "Restaurant Name": "restaurant_name",
        "Category": "cuisine_type",
        "City": "city",
        "Price (INR)": "cost",
        "Rating": "rating",
        "Rating Count": "rating_count"
    })
    
    # Normalize strings to remove duplicates (e.g. '7Th Heaven' vs '7th Heaven')
    df["restaurant_name"] = df["restaurant_name"].str.strip().str.title()
    df["cuisine_type"] = df["cuisine_type"].str.strip().str.title()
    
    # Fill any missing cuisines with 'General'
    df["cuisine_type"] = df["cuisine_type"].fillna("General")
    
    # Create an order_id for each row
    df["order_id"] = range(1000000, 1000000 + len(df))
    
    print(f"  Final Rows: {original_rows} -> {len(df)}")
    return df

def main():
    os.makedirs(CLEAN_DIR, exist_ok=True)
    print("=" * 60)
    print("  STEP 2: DATA CLEANING PIPELINE")
    print("=" * 60)

    # Clean Swiggy
    swiggy_path = os.path.join(RAW_DIR, "swiggy_dataset.csv")
    try:
        df = pd.read_csv(swiggy_path)
        df = clean_swiggy(df)
        df.to_csv(os.path.join(CLEAN_DIR, "swiggy_clean.csv"), index=False)
        print(f"  --> Saved: swiggy_clean.csv")
    except Exception as e:
        print(f"Error processing {swiggy_path}: {e}")

if __name__ == "__main__":
    main()
