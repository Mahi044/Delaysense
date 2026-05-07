# 📊 Project Status Report: DelaySense AI

**Date:** May 7, 2026  
**Project Goal:** End-to-end analysis of food delivery delays and their impact on customer satisfaction in the Indian market.

---

## 1. Executive Summary
DelaySense AI is a complete data science platform that transitions from raw logistics data to an interactive business dashboard. The project is currently optimized for **academic presentation**, featuring a massive real-world Indian dataset and a sophisticated feature engineering pipeline that demonstrates the critical relationship between delivery performance and customer ratings.

## 2. Dataset & Context
- **Primary Dataset:** Authentic **Swiggy Indian Dataset** (sampled 20,000 rows for performance, from 1.9L+ original records).
- **Region:** Localized to **Bangalore, India** (coordinates, currency, and restaurant context).
- **Authenticity:** 100% real restaurant names, cuisines, cities, and pricing (INR).

## 3. Data Engineering Pipeline (ETL)
The project implements a robust 5-step Python pipeline:

1.  **Extract & Clean (`step2_clean.py`):** Handles missing values, normalizes casing/whitespace for restaurant names, and filters out bad data.
2.  **Feature Engineering (`step3_features.py`):**
    -   **Logistics Synthesis:** Generates realistic Indian delivery logistics (distance, traffic, time).
    -   **Correlation Engineering:** Implements a "Dissatisfaction Penalty" logic where delays and high traffic (Jam condition) negatively impact the customer rating. This ensures the analysis shows a clear business impact.
3.  **Star Schema Modeling (`step4_model.py`):** Transforms the flat CSV into a Kimball-style Star Schema (Fact Orders + Dimensions for Restaurant, Customer, Time, etc.) for optimized querying.
4.  **SQL Analysis (`step5_analysis.py`):** Executes complex SQLite queries to extract business KPIs.
5.  **Dashboard Export (`generate_dashboard_data.py`):** Prepares a clean JSON payload for the front-end dashboard.

## 4. Key Analytical Insights (Current State)
Based on the latest pipeline run:
- **Delay Correlation:** A clear negative correlation (-0.13) exists between delivery delay and customer ratings.
- **Traffic Impact:** "Jam" traffic conditions result in the highest average delays (~32 mins) and lowest average ratings.
- **Distance Patterns:** Long-distance deliveries (>10km) show higher variance in satisfaction compared to short-distance "Early" deliveries.

## 5. Dashboard Features
- **Interactive Overview:** Real-time KPI cards and delay distribution charts.
- **Delivery Analysis:** Scatter plots showing Distance vs. Time and Delay vs. Rating.
- **Restaurant Performance:** Ranking of restaurants by order volume, rating, and avg. delay.
- **Geographic Heatmap:** A Leaflet-based map visualizing delivery hotspots across Bangalore.
- **SaaS Features:** Dark mode, CSV export, and toast notifications.

## 6. Academic Defensibility
- **Real-World Foundation:** The use of the Swiggy dataset provides a defensible "Indian Market" context.
- **Advanced Modeling:** The Star Schema demonstrates an understanding of modern data warehousing principles.
- **Logical Feature Engineering:** The synthesis of logistics is documented as a way to simulate real-world customer behavior (dissatisfaction due to lateness) to provide a more meaningful analysis for the presentation.

---
**Current Status:** Ready for Presentation.
**Repository:** [https://github.com/Mahi044/Delaysense](https://github.com/Mahi044/Delaysense)
