from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import pandas as pd
import generate_market_sales as gen
from datetime import datetime, timedelta
import threading

app = Flask(__name__)

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

@app.route('/api/by_category_daily', methods=['GET'])
def sales_by_category_daily():
    global raw
    days_param = request.args.get('days', default=30, type=int)
    buy_sell = request.args.get('type', default=all, type=str)
    cutoff = datetime.now() - timedelta(days=days_param)
    
    filtered = raw[raw['date'] >= cutoff]

    if buy_sell != 'all':
        filtered = filtered[filtered['type'] == buy_sell]

    # Group by day and category, sum prices
    pivot = (
        filtered
        .groupby([raw['str_date'], 'category'])['price']
        .sum()
        .unstack(fill_value=0)
        .reset_index()
        .rename(columns={'str_date': 'date'})
    )

    # Format for JSON
    dataset = pivot.rename(columns={pivot.columns[0]: 'date'}).to_dict(orient='records')
    categories = pivot.columns[1:]  # all columns except date

    series = [{"dataKey": cat, "stack": "sales", "label": cat} for cat in categories]

    return jsonify({
        "dataset": dataset,
        "xAxis": [{"dataKey": "date"}],
        "series": series
    })

@app.route('/api/stacked_sales_by_day_category_type', methods=['GET'])
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
def cumulative_sales_by_day():
    global raw

    # Optional query param: limit to last X days
    days = request.args.get('days', default=30, type=int)
    cutoff = datetime.now() - timedelta(days=days)

    # Filter data
    filtered = raw[raw['date'] >= cutoff].copy()
    filtered['date_only'] = filtered['date'].dt.date

    # Group and sum price per day/type
    grouped = (
        filtered.groupby(['date_only', 'type'])['price']
        .sum()
        .reset_index()
        .sort_values(by=['date_only', 'type'])
    )

    # Pivot to get separate buy/sell columns
    pivot = grouped.pivot_table(index='date_only', columns='type', values='price', fill_value=0).reset_index()

    # Compute cumulative totals
    pivot['cumulative_buy'] = pivot['buy'].cumsum()
    pivot['cumulative_sell'] = pivot['sell'].cumsum()

    # Format for frontend chart
    dataset = pivot[['date_only', 'cumulative_buy', 'cumulative_sell']].rename(columns={'date_only': 'date'}).to_dict(orient='records')

    series = [
        {"type": "line", "dataKey": "cumulative_buy", "label": "Cumulative Buy", "curve": "monotone", "color": "#1b5e20"},
        {"type": "line", "dataKey": "cumulative_sell", "label": "Cumulative Sell", "curve": "monotone", "color": "#b71c1c"}
    ]

    return jsonify({
        "dataset": dataset,
        "xAxis": [{"dataKey": "date", "label": "Date"}],
        "series": series
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