# server/app.py
import os
from datetime import datetime, timedelta
import threading

from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS, cross_origin
from flask_vite import Vite

import pandas as pd

import generate_market_sales as gen

app = Flask(__name__, static_folder=None)
CORS(app)

# Initialize flask-vite
vite = Vite(app, vite_folder="dashboard/vite", vite_routes_host="*")




# Serve static files built by Vite
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join(app.root_path, 'static'), filename)


def load_data():
    global raw
    data = gen.get_data()
    raw = pd.DataFrame(data)

    raw['id'] = range(len(raw))
    raw['price'] = pd.to_numeric(raw['price'], errors='coerce')
    raw['date'] = pd.to_datetime(raw['str_date'])
    return raw
    
@app.route('/api/raw_data', methods=['GET'])
@cross_origin()
def get_raw_data():
    global raw    
    return jsonify(raw.to_dict(orient='records'))


@app.route('/api/by_category', methods=['GET'])
@cross_origin()
def sales_by_trader():
    global raw
    days_param = request.args.get('days', type=int)
    buy_sell = request.args.get('type', default=all, type=str)
    filtered_df = raw
    
    if days_param is not None:
        cutoff = datetime.now() - timedelta(days=days_param)
        mask = raw['date'] >= cutoff
        filtered_df = filtered_df[mask]
    else:
        filtered_df = raw

    if buy_sell != 'all':
        filtered_df = filtered_df[filtered_df['type'] == buy_sell]

    grouped = (
        filtered_df
        .groupby('category')['price']
        .sum()
        .reset_index()
        .sort_values(by='price', ascending=False)
    )

    rows = [
        {
            "id": i,
            "value": row['price'],
            "label": row['category']
        }
        for i, row in grouped.iterrows()
    ]

    result = [{
        "data": rows
    }]

    return jsonify(result)

@app.route('/api/stacked_sales_by_day_category_type', methods=['GET'])
@cross_origin()
def stacked_sales_by_day_category_type():
    global raw

    # Step 1: Parse query param
    days = request.args.get('days', default=30, type=int)
    buy_sell = request.args.get('type', default="all", type=str)
    cutoff = datetime.now() - timedelta(days=days)

    # Step 2: Filter data
    filtered = raw[raw['date'] >= cutoff]

    if buy_sell != 'all':
        filtered = filtered[filtered['type'] == buy_sell]    

    # Step 3: Group by date, type, and category, and sum price
    grouped = (
        filtered
        .groupby([filtered['date'].dt.date, 'type', 'category'])['price']
        .sum()
        .reset_index()
    )

    # Step 4: Pivot to wide format: one row per (date, type), columns = categories
    pivot = (
        grouped
        .pivot_table(index=['date', 'type'], columns='category', values='price', fill_value=0)
        .reset_index()
    )

    # Step 6: Create x-axis label "YYYY-MM-DD_type"
    pivot['date_type'] = pivot['date'].astype(str) + '_' + pivot['type']

    # Step 7: Build dataset
    dataset = pivot.drop(columns=['date']).to_dict(orient='records')

    # Step 8: Identify category columns
    exclude_cols = {'date', 'type', 'date_type', 'total'}
    category_columns = [col for col in pivot.columns if col not in exclude_cols]

    # Step 9: Create stacked bar series (by category)
    stacked_series = [
        {"dataKey": col, "stack": "grouped", "label": col}
        for col in category_columns
    ]
    
    # Apply line series only to appropriate rows using conditional rendering on frontend
    # or include 'type' in series config if needed

    return jsonify({
        "dataset": dataset,
        "xAxis": [{"dataKey": "date_type", "label": "date_type"}],
        "series": stacked_series
    })



@app.route('/api/cumulative_sales_by_day', methods=['GET'])
@cross_origin()
def cumulative_sales_by_day():
    global raw

    days = request.args.get('days', default=30, type=int)
    cutoff = datetime.now() - timedelta(days=days)
    filtered = raw[raw['date'] >= cutoff]

    # Group by date and type, summing the price for that day/type
    daily = filtered.groupby(["str_date", "type"])["price"].sum().unstack(fill_value=0)

    # Sort by date
    daily = daily.sort_index()

    # Apply cumulative sum over time for each type
    cumulative = daily.cumsum()

    xLabels = cumulative.index.tolist()
    buyData = cumulative.get("buy", []).tolist()
    sellData = cumulative.get("sell", []).tolist()

    return jsonify({
        "xLabels": xLabels,
        "series": [
            { "data": sellData, "label": "Sell" },
            { "data": buyData, "label": "Buy" }
        ]
    })


def main():
    load_data() 
    # # Re-schedule itself to run again after 10 seconds
    # threading.Timer(120.0, load_data()).start()

# Start the first run
main()


CORS(app)
if __name__ == '__main__':
    app.run(debug=True)