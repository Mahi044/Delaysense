"""
Step 5: Analysis with SQL
=========================
Answer 5 business questions using SQLite on the star schema.
"""

import os
import sqlite3
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "data", "modeled")
SQL_DIR = os.path.join(BASE_DIR, "sql")


def load_into_sqlite():
    """Load all star schema CSVs into an in-memory SQLite database."""
    conn = sqlite3.connect(":memory:")

    tables = {
        "fact_orders": "fact_orders.csv",
        "dim_restaurant": "dim_restaurant.csv",
        "dim_customer": "dim_customer.csv",
        "dim_delivery_person": "dim_delivery_person.csv",
        "dim_time": "dim_time.csv",
    }

    for table_name, filename in tables.items():
        filepath = os.path.join(MODEL_DIR, filename)
        if os.path.exists(filepath):
            df = pd.read_csv(filepath)
            df.to_sql(table_name, conn, index=False, if_exists="replace")
            print(f"  Loaded {table_name}: {len(df)} rows")
        else:
            print(f"  ⚠ Missing: {filepath}")

    return conn


def run_analysis(conn):
    """Run all 5 analytical queries."""
    queries = {}

    # =========================================================================
    # Q1: Correlation between delivery delay and customer ratings
    # =========================================================================
    queries["Q1"] = {
        "title": "Correlation Between Delivery Delay and Customer Ratings",
        "sql": """
        SELECT
            delay_category,
            COUNT(*) AS order_count,
            ROUND(AVG(rating), 2) AS avg_rating,
            ROUND(AVG(delivery_delay), 2) AS avg_delay_min,
            ROUND(MIN(rating), 2) AS min_rating,
            ROUND(MAX(rating), 2) AS max_rating
        FROM fact_orders
        GROUP BY delay_category
        ORDER BY avg_delay_min ASC;
        """,
    }

    # =========================================================================
    # Q2: Distance vs Customer Satisfaction
    # =========================================================================
    queries["Q2"] = {
        "title": "Distance vs Customer Satisfaction",
        "sql": """
        SELECT
            CASE
                WHEN distance_km <= 3 THEN '0-3 km'
                WHEN distance_km <= 6 THEN '3-6 km'
                WHEN distance_km <= 10 THEN '6-10 km'
                ELSE '10+ km'
            END AS distance_bucket,
            COUNT(*) AS order_count,
            ROUND(AVG(rating), 2) AS avg_rating,
            ROUND(AVG(delivery_time), 2) AS avg_delivery_time,
            ROUND(AVG(delivery_delay), 2) AS avg_delay
        FROM fact_orders
        GROUP BY distance_bucket
        ORDER BY avg_delay ASC;
        """,
    }

    # =========================================================================
    # Q3: Restaurant Prep Delay Impact on Ratings
    # =========================================================================
    queries["Q3"] = {
        "title": "Restaurant Preparation Delay Impact on Ratings",
        "sql": """
        SELECT
            r.restaurant_name,
            r.cuisine_type,
            COUNT(f.order_id) AS total_orders,
            ROUND(AVG(f.food_preparation_time), 2) AS avg_prep_time,
            ROUND(AVG(f.delivery_delay), 2) AS avg_delay,
            ROUND(AVG(f.rating), 2) AS avg_rating
        FROM fact_orders f
        JOIN dim_restaurant r ON f.restaurant_id = r.restaurant_id
        GROUP BY r.restaurant_name, r.cuisine_type
        HAVING total_orders >= 5
        ORDER BY avg_prep_time DESC
        LIMIT 15;
        """,
    }

    # =========================================================================
    # Q4: Traffic Level vs Delivery Time
    # =========================================================================
    queries["Q4"] = {
        "title": "Traffic Level vs Delivery Time",
        "sql": """
        SELECT
            traffic_level,
            COUNT(*) AS order_count,
            ROUND(AVG(delivery_time), 2) AS avg_delivery_time,
            ROUND(AVG(delivery_delay), 2) AS avg_delay,
            ROUND(AVG(rating), 2) AS avg_rating,
            ROUND(AVG(distance_km), 2) AS avg_distance
        FROM fact_orders
        GROUP BY traffic_level
        ORDER BY avg_delivery_time ASC;
        """,
    }

    # =========================================================================
    # Q5: Peak Hour Delay Patterns
    # =========================================================================
    queries["Q5"] = {
        "title": "Peak Hour Delay Patterns",
        "sql": """
        SELECT
            CASE WHEN peak_hour_flag = 1 THEN 'Peak Hour' ELSE 'Off-Peak' END AS period,
            time_of_day,
            COUNT(*) AS order_count,
            ROUND(AVG(delivery_time), 2) AS avg_delivery_time,
            ROUND(AVG(delivery_delay), 2) AS avg_delay,
            ROUND(AVG(rating), 2) AS avg_rating,
            ROUND(
                SUM(CASE WHEN delay_category IN ('Slightly Delayed', 'Heavily Delayed')
                    THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
                2
            ) AS delay_pct
        FROM fact_orders
        GROUP BY peak_hour_flag, time_of_day
        ORDER BY peak_hour_flag DESC, avg_delay DESC;
        """,
    }

    # Execute and display all queries
    results = {}
    for qid, q in queries.items():
        print(f"\n{'='*70}")
        print(f"  {qid}: {q['title']}")
        print(f"{'='*70}")
        try:
            df = pd.read_sql_query(q["sql"], conn)
            print(df.to_string(index=False))
            results[qid] = df

            # Additional correlation insight for Q1
            if qid == "Q1":
                corr_df = pd.read_sql_query(
                    "SELECT delivery_delay, rating FROM fact_orders", conn
                )
                corr = corr_df["delivery_delay"].corr(corr_df["rating"])
                print(f"\n  > Pearson Correlation (delay vs rating): {corr:.4f}")
                if abs(corr) < 0.1:
                    print("     → Weak/No linear correlation")
                elif abs(corr) < 0.3:
                    print("     → Weak negative correlation")
                elif abs(corr) < 0.5:
                    print("     → Moderate negative correlation")
                else:
                    print("     → Strong negative correlation")

        except Exception as e:
            print(f"  [x] Error: {e}")

    return results


def export_sql_file(queries_dict=None):
    """Export all SQL queries to a standalone .sql file."""
    os.makedirs(SQL_DIR, exist_ok=True)
    sql_content = """-- ============================================================
-- Food Delivery Delay & Customer Rating Analysis
-- SQL Queries for Star Schema
-- ============================================================

-- Q1: Correlation between delivery delay and customer ratings
SELECT
    delay_category,
    COUNT(*) AS order_count,
    ROUND(AVG(rating), 2) AS avg_rating,
    ROUND(AVG(delivery_delay), 2) AS avg_delay_min,
    ROUND(MIN(rating), 2) AS min_rating,
    ROUND(MAX(rating), 2) AS max_rating
FROM fact_orders
GROUP BY delay_category
ORDER BY avg_delay_min ASC;

-- Q2: Distance vs Customer Satisfaction
SELECT
    CASE
        WHEN distance_km <= 3 THEN '0-3 km'
        WHEN distance_km <= 6 THEN '3-6 km'
        WHEN distance_km <= 10 THEN '6-10 km'
        ELSE '10+ km'
    END AS distance_bucket,
    COUNT(*) AS order_count,
    ROUND(AVG(rating), 2) AS avg_rating,
    ROUND(AVG(delivery_time), 2) AS avg_delivery_time,
    ROUND(AVG(delivery_delay), 2) AS avg_delay
FROM fact_orders
GROUP BY distance_bucket
ORDER BY avg_delay ASC;

-- Q3: Restaurant Preparation Delay Impact on Ratings
SELECT
    r.restaurant_name,
    r.cuisine_type,
    COUNT(f.order_id) AS total_orders,
    ROUND(AVG(f.food_preparation_time), 2) AS avg_prep_time,
    ROUND(AVG(f.delivery_delay), 2) AS avg_delay,
    ROUND(AVG(f.rating), 2) AS avg_rating
FROM fact_orders f
JOIN dim_restaurant r ON f.restaurant_id = r.restaurant_id
GROUP BY r.restaurant_name, r.cuisine_type
HAVING total_orders >= 5
ORDER BY avg_prep_time DESC
LIMIT 15;

-- Q4: Traffic Level vs Delivery Time
SELECT
    traffic_level,
    COUNT(*) AS order_count,
    ROUND(AVG(delivery_time), 2) AS avg_delivery_time,
    ROUND(AVG(delivery_delay), 2) AS avg_delay,
    ROUND(AVG(rating), 2) AS avg_rating,
    ROUND(AVG(distance_km), 2) AS avg_distance
FROM fact_orders
GROUP BY traffic_level
ORDER BY avg_delivery_time ASC;

-- Q5: Peak Hour Delay Patterns
SELECT
    CASE WHEN peak_hour_flag = 1 THEN 'Peak Hour' ELSE 'Off-Peak' END AS period,
    time_of_day,
    COUNT(*) AS order_count,
    ROUND(AVG(delivery_time), 2) AS avg_delivery_time,
    ROUND(AVG(delivery_delay), 2) AS avg_delay,
    ROUND(AVG(rating), 2) AS avg_rating,
    ROUND(
        SUM(CASE WHEN delay_category IN ('Slightly Delayed', 'Heavily Delayed')
            THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
        2
    ) AS delay_pct
FROM fact_orders
GROUP BY peak_hour_flag, time_of_day
ORDER BY peak_hour_flag DESC, avg_delay DESC;
"""
    with open(os.path.join(SQL_DIR, "analysis_queries.sql"), "w") as f:
        f.write(sql_content)
    print(f"\n  [v] Exported SQL queries to sql/analysis_queries.sql")


def main():
    print("=" * 60)
    print("  STEP 5: ANALYSIS WITH SQL")
    print("=" * 60)

    conn = load_into_sqlite()
    results = run_analysis(conn)
    export_sql_file()
    conn.close()

    print(f"\n{'='*60}")
    print("  ANALYSIS COMPLETE")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
