# 🍔 DelaySense AI — Food Delivery Delay & Customer Satisfaction Analytics Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An end-to-end data engineering & analytics pipeline that analyzes food delivery delays and customer satisfaction, and provides actionable business insights through an interactive SaaS-grade dashboard.**

[🚀 Live Dashboard](#live-demo) · [📖 Documentation](#architecture) · [⚙️ Setup](#getting-started)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Pipeline Steps](#pipeline-steps)
- [Dashboard](#dashboard)
- [Live Demo](#live-demo)

---

## 🔍 Overview

**DelaySense AI** is a comprehensive data analytics platform that tackles the critical problem of food delivery delays and their impact on customer satisfaction. The project implements a full **ETL → Star Schema → Dashboard** pipeline:

1. **Extract** raw delivery & satisfaction data  
2. **Transform** with cleaning, and feature engineering  
3. **Model** into a Kimball-style star schema  
4. **Visualize** through an interactive, real-time dashboard  

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔄 **ETL Pipeline** | Automated data processing pipeline |
| ⭐ **Star Schema** | Kimball-methodology dimensional modeling (fact + dimension tables) |
| 📊 **Interactive Dashboard** | SaaS-grade analytics dashboard with Chart.js |
| 🗺️ **Delivery Heatmap** | Geographic visualization of delivery patterns |
| 📥 **CSV Export** | One-click data export functionality |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA PIPELINE                               │
│                                                                   │
│  Raw Data → Clean → Feature Eng. → Star Schema                    │
│     │          │          │              │                        │
│  step0     step2      step3          step4                        │
│  download  clean      features       model                        │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                    ANALYTICS LAYER                                │
│                                                                   │
│  SQL Analysis (step5)                                             │
│         │                                                         │
│         └────────┬────────────────────────────────────────────────┘
│                  ▼                                                 │
│         Dashboard (HTML/JS/CSS)                                   │
│         ├── KPI Cards & Metrics                                   │
│         ├── Interactive Charts                                    │
│         └── Delivery Heatmap                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Data Processing:** Python (Pandas, NumPy)
- **Database:** SQLite with star schema modeling
- **Visualization:** Chart.js, Leaflet.js (heatmaps)
- **Frontend:** Vanilla HTML5, CSS3, JavaScript

---

## 📁 Project Structure

```
DelaySense--AI/
├── 📂 dashboard/           # Interactive analytics dashboard
│   ├── index.html          # Main dashboard page
│   ├── app.js              # Dashboard logic & chart rendering
│   ├── styles.css          # Premium dark-theme styling
│   └── data.js             # Processed data for visualization
│
├── 📂 scripts/             # Python data pipeline
│   ├── step0_download.py   # Data acquisition
│   ├── step1_understand.py # Exploratory data analysis
│   ├── step2_clean.py      # Data cleaning & validation
│   ├── step3_features.py   # Feature engineering
│   ├── step4_model.py      # Star schema modeling
│   └── step5_analysis.py   # SQL-based analysis
│
├── 📂 data/                # Data files
│   ├── raw/                # Original datasets
│   ├── cleaned/            # Processed datasets
│   └── modeled/            # Star schema tables
│
├── 📂 sql/                 # SQL analysis queries
│   └── analysis_queries.sql
│
├── requirements.txt        # Python dependencies
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- pip package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Mahi044/Delaysense.git
cd Delaysense

# Install dependencies
pip install -r requirements.txt
```

### Run the Pipeline

```bash
# Execute each step sequentially
python scripts/step0_download.py
python scripts/step1_understand.py
python scripts/step2_clean.py
python scripts/step3_features.py
python scripts/step4_model.py
python scripts/step5_analysis.py
```

### Launch Dashboard

Simply open `dashboard/index.html` in your browser, or deploy via GitHub Pages.

---

## 📊 Dashboard

The dashboard provides a **SaaS-grade analytics experience** with:

- **KPI Cards** — Real-time delivery metrics & satisfaction scores
- **Interactive Charts** — Delay distribution, restaurant performance, time analysis
- **Delivery Heatmap** — Geographic visualization of delivery patterns
- **CSV Export** — Download filtered data for offline analysis

---

## 🌐 Live Demo

The dashboard is deployed via **GitHub Pages**:  
🔗 **[https://mahi044.github.io/Delaysense/dashboard/](https://mahi044.github.io/Delaysense/dashboard/)**

---

## 👨‍💻 Author

**Mahendrareddy R V**  

---

## 📄 License

This project is licensed under the MIT License.
