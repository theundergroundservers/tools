import os
import time
from datetime import datetime, timedelta
import threading

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS, cross_origin
from flask_httpauth import HTTPBasicAuth
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from werkzeug.security import check_password_hash, generate_password_hash
import pandas as pd
import generate_market_sales as gen
import generate_position_data as pos

# --- Flask setup ---
app = Flask(__name__)
auth = HTTPBasicAuth()
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])
app = Flask(__name__, static_folder='vite/dist', static_url_path='/')
CORS(app)


users = {}

with open("..\data\\auth.txt", "r") as f:
    for line in f:
        user, pwd = line.strip().split(":")
        users[user] = generate_password_hash(pwd)

@auth.verify_password
#@limiter.limit("10 per 2 minutes")  # Max 10 attempts per 2 mins per IP
def verify_password(username, password):
    if request.remote_addr in ['127.0.0.1', '::1']:
        return 'localhost'

    if username in users and check_password_hash(users.get(username), password):
        return username

# --- Serve Vite production build ---
@app.route('/')
@app.route('/<path:path>')
@auth.login_required
def serve_frontend(path='index.html'):
    return send_from_directory(app.static_folder, path)

# --- Load initial data ---
def load_data():
    global raw
    global pos
    
    raw_data = gen.get_data()
    raw = pd.DataFrame(raw_data)
    raw['id'] = range(len(raw_data))
    raw['price'] = pd.to_numeric(raw['price'], errors='coerce')
    raw['date'] = pd.to_datetime(raw['str_date'])
    raw['quantity'] = pd.to_numeric(raw['quantity'], errors='coerce')    
    
    pos_data = pos.get_data()
    pos = pd.DataFrame(pos_data)
    pos['id'] = range(len(pos))    
    pos['date'] = pd.to_datetime(pos['str_date'])
    pos["ts"] = pd.to_datetime(pos["str_date_time"], utc=True, errors="coerce")
    pos["ts"] = pos["ts"].fillna(pd.to_datetime(pos["date"], utc=True, errors="coerce"))    
    
@app.route('/api/raw_data', methods=['GET'])
@cross_origin()
@auth.login_required
def get_raw_data():
    global raw
    return jsonify(raw.to_dict(orient='records'))

@app.route('/api/pos_data', methods=['GET'])
@cross_origin()
@auth.login_required
def get_pos_data():
    global pos
    """
    Query params:
      - ts (str): required, ISO or RFC datetime string
      - window_minutes (float): optional, default 30
      - name (str): optional, case-insensitive match
      - x, y (float): optional, for location search
      - radius (float): optional, half-width of square
    """

    df = pd.DataFrame(pos)



    ts_raw = request.args.get("ts", "").strip()
    if not ts_raw:
        return jsonify({"error": "ts is required"}), 400

    ts_q = pd.to_datetime(ts_raw, utc=True, errors="coerce")
    if pd.isna(ts_q):
        return jsonify({"error": "ts could not be parsed"}), 400

    window_minutes = request.args.get("window_minutes", default=30, type=float)
    name = request.args.get("name", "").strip()
    x0 = request.args.get("x", type=float)
    y0 = request.args.get("y", type=float)
    radius = request.args.get("radius", type=float)

    # Base time window
    delta = timedelta(minutes=window_minutes)
    mask = (df["ts"] >= ts_q - delta) & (df["ts"] <= ts_q + delta)

    # Optional name filter
    if name:
        mask &= df["name"].str.casefold() == name.casefold()

    # Optional location filter
    if radius is not None:
        if x0 is None or y0 is None:
            return jsonify({"error": "x and y are required when radius is provided"}), 400
        mask &= (df["x"].sub(x0).abs() <= radius) & (df["y"].sub(y0).abs() <= radius)

    result = df.loc[mask].copy()
    result["ts_iso"] = result["ts"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    return jsonify(result.to_dict(orient="records"))

@app.route('/api/by_category', methods=['GET'])
@cross_origin()
@auth.login_required
def sales_by_trader():
    global raw
    days_param = request.args.get('days', type=int)
    buy_sell = request.args.get('type', default='all', type=str)
    filtered_df = raw

    if days_param is not None:
        cutoff = datetime.now() - timedelta(days=days_param)
        filtered_df = filtered_df[filtered_df['date'] >= cutoff]

    if buy_sell != 'all':
        filtered_df = filtered_df[filtered_df['type'] == buy_sell]

    grouped = (
        filtered_df
        .groupby('category')['price']
        .sum()
        .reset_index()
        .sort_values(by='price', ascending=False)
    )

    rows = [{"id": i, "value": row['price'], "label": row['category']} for i, row in grouped.iterrows()]
    return jsonify([{"data": rows}])

@app.route('/api/stacked_sales_by_day_category_type', methods=['GET'])
@cross_origin()
@auth.login_required
def stacked_sales_by_day_category_type():
    global raw
    days = request.args.get('days', default=30, type=int)
    buy_sell = request.args.get('type', default='all', type=str)
    cutoff = datetime.now() - timedelta(days=days)
    filtered = raw[raw['date'] >= cutoff]

    if buy_sell != 'all':
        filtered = filtered[filtered['type'] == buy_sell]

    grouped = (
        filtered
        .groupby([filtered['date'].dt.date, 'type', 'category'])['price']
        .sum()
        .reset_index()
    )

    pivot = (
        grouped
        .pivot_table(index=['date', 'type'], columns='category', values='price', fill_value=0)
        .reset_index()
    )

    pivot['date_type'] = pivot['date'].astype(str) + '_' + pivot['type']
    dataset = pivot.drop(columns=['date']).to_dict(orient='records')
    exclude = {'date', 'type', 'date_type', 'total'}
    categories = [c for c in pivot.columns if c not in exclude]

    stacked_series = [{"dataKey": cat, "stack": "grouped", "label": cat} for cat in categories]

    return jsonify({
        "dataset": dataset,
        "xAxis": [{"dataKey": "date_type", "label": "date_type"}],
        "series": stacked_series
    })

@app.route('/api/cumulative_sales_by_day', methods=['GET'])
@cross_origin()
@auth.login_required
def cumulative_sales_by_day():
    global raw
    days = request.args.get('days', default=30, type=int)
    cutoff = datetime.now() - timedelta(days=days)
    filtered = raw[raw['date'] >= cutoff]

    daily = filtered.groupby(["str_date", "type"])["price"].sum().unstack(fill_value=0)
    daily = daily.sort_index()
    cumulative = daily.cumsum()

    xLabels = cumulative.index.tolist()
    buyData = cumulative.get("buy", []).tolist()
    sellData = cumulative.get("sell", []).tolist()

    return jsonify({
        "xLabels": xLabels,
        "series": [
            {"data": sellData, "label": "Sell"},
            {"data": buyData, "label": "Buy"}
        ]
    })

@app.route('/api/fish_sales_stacked', methods=['GET'])
@cross_origin()
@auth.login_required
def fish_sales_stacked():
    global raw

    days = request.args.get('days', default=30, type=int)
    cutoff = datetime.now() - timedelta(days=days)

    df = raw[raw['date'] >= cutoff].copy()
    df = df[df['item'].str.startswith('geb_')]
    df = df[df['date'].dt.date != datetime(2025, 6, 15).date()]

    def extract_fish_parts(name):
        name = name.replace('geb_', '')
        if name.endswith('filletmeat'):
            return name.replace('filletmeat', ''), 'fillet'
        else:
            return name, 'whole'

    df[['fish', 'part']] = df['item'].apply(lambda x: pd.Series(extract_fish_parts(x)))

    price_group = df.groupby(['fish', 'part'])['price'].sum().reset_index()
    qty_group = df.groupby(['fish'])['quantity'].sum().reset_index().rename(columns={'quantity': 'quantity'})

    pivot_price = price_group.pivot(index='fish', columns='part', values='price').fillna(0)
    pivot_price['quantity'] = qty_group.set_index('fish')['quantity']
    pivot_price['total'] = pivot_price[['whole', 'fillet']].sum(axis=1)
    pivot_price = pivot_price.sort_values(by='total', ascending=False).head(30)
    

    dataset = [
        {
            'fish': fish,
            'whole': row.get('whole', 0),
            'fillet': row.get('fillet', 0),
            'quantity': row.get('quantity', 0),
        }
        for fish, row in pivot_price.iterrows()
    ]

    series = [
        {'dataKey': 'whole', 'stack': 'fish_parts', 'label': 'Whole', 'type': 'bar'},
        {'dataKey': 'fillet', 'stack': 'fish_parts', 'label': 'Fillet', 'type': 'bar'},
        {'dataKey': 'quantity', 'label': 'Quantity Sold', 'type': 'line', 'yAxisKey': 'right'},
    ]

    return jsonify({
        'dataset': dataset,
        'xAxis': [{'dataKey': 'fish', 'label': 'Fish'}],
        'series': series,
        'yAxis': [
            {'id': 'left', 'label': 'Price', 'position': 'left'},
            {'id': 'right', 'label': 'Quantity', 'position': 'right'},
        ],
    })


def schedule_reload(interval_seconds: int = 900):
    def reload_loop():
        while True:
            
            try:
                print(f"[{datetime.now()}] Reloading data...")
                load_data()
            except Exception as e:
                print(f"Error during data reload: {e}")

            time.sleep(interval_seconds)
    threading.Thread(target=reload_loop, daemon=True).start()

schedule_reload()



if __name__ == '__main__':
    from waitress import serve
    serve(app, host='0.0.0.0', port=5000)