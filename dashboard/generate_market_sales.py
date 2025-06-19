import os
import re
import csv
import json
from datetime import datetime

PATTERN_SELL = re.compile(
    r'Player "(?P<player>.+?)" '
    r'\(id=(?P<id>[^)]+)\) has sold '
    r'(?P<item>[\w\d_]+) x(?P<quantity>\d+) '
    r'\((?P<uid>[a-f0-9]+)(?:, [^)]*)?\) '
    r'at the trader "(?P<trader>[^"]+)" '
    r'in market zone "(?P<zone>[^"]+)" '
    r'\(pos=<(?P<pos>[^>]+)>\) and got (?P<price>\d+)\.'
)

PATTERN_BUY = re.compile(
    r'Player "(?P<player>.+?)" '
    r'\(id=(?P<id>[^)]+)\) has bought '
    r'(?P<item>[\w\d_]+) x(?P<quantity>\d+) '
    r'\((?P<uid>[a-f0-9]+)\) '
    r'from the trader "(?P<trader>[^"]+)" '
    r'in market zone "(?P<zone>[^"]+)" '
    r'\(pos=<(?P<pos>[^>]+)>\) '
    r'for a price of (?P<price>\d+)\.'
)

PATTERN_VEHICLE_GARAGE_BUY = re.compile(
    r"SCRIPT\s+:\s+(?P<datetime>\d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}:\d{2}) "
    r"\[ADMIN\] \[VirtualGarage\] Vehicle Bought: "
    r"(?P<item>\S+) by (?P<player>.+?) "
    r"\((?P<player_id>\d+)\) at TraderID: (?P<trader_id>\d+) for (?P<buyer_id>\d+)"
)

PATTERN_VEHICLE_GARAGE_SELL = re.compile(
    r"SCRIPT\s+:\s+(?P<datetime>\d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}:\d{2}) "
    r"\[ADMIN\] \[VirtualGarage\] Vehicle Sold: "
    r"(?P<item>\S+) by (?P<player>.+?) "
    r"\((?P<player_id>\d+)\) TraderID: (?P<trader_id>\d+) VehicleUID: (?P<vehicle_uid>\d+)"
)

def get_data(): 
    logs_dir = '../../omega/servers/season-6/logs'
    vehicle_price_file = '../../omega/servers/season-6/profiles/LBMaster/config/LBGarage/vehicles.json'

    vehicle_prices = get_lb_vehicles_map(vehicle_price_file)
    data = parse_log_folders(logs_dir, vehicle_prices)
    data = post_process(data)
    to_files(data)
    return data

def main(): 
    data = get_data()
    to_files(data)

def parse_log_folders(logs_dir, vehicle_prices):
    print(f'parsing {logs_dir}')
    dataset = []
    for dirpath, dirnames, filenames in os.walk(logs_dir):
        for filename in filenames:            
            if filename.startswith('script_'):
                file_path = os.path.join(dirpath, filename)                
                print(f'opening {file_path}')                    
                with open(file_path, 'r', encoding='utf-8') as f:        
                    print(f'opened {file_path}')                    
                    file_data = parse_file(f, filename, vehicle_prices)
                    dataset.extend(file_data)

    print(len(dataset))
    return dataset

def process_script_file_time(data, filename, line):
    match = re.search(r"script_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.log", filename)
    if match:
        date_str = match.group(1) 
        dt = datetime.strptime(date_str, "%Y-%m-%d")
            
        # find the time from the file
        dt_match = re.search(r"'(?P<time>\d{2}:\d{2}:\d{2}\.\d{3})", line)
        data['date'] = date_str                    
        
    
def parse_file(file_content, filename, vehicle_prices):
    print(f"PROCESSING {filename}")    
    dataset = []
    while line := file_content.readline():   
        match_sell = PATTERN_SELL.search(line)
        match_buy = PATTERN_BUY.search(line)
        match_garrage_buy = PATTERN_VEHICLE_GARAGE_BUY.search(line)
        match_garrage_sell = PATTERN_VEHICLE_GARAGE_SELL.search(line)

        data = None

        if match_sell:
            data = match_sell.groupdict()
            data['type'] = 'sell'
            match = re.search(r"(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)", line)
            
            time_str = match.group(1)
            data['time'] = time_str


        elif match_buy:
            data = match_buy.groupdict()
            data['type'] = 'buy'
            match = re.search(r"(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)", line)
            
            time_str = match.group(1)
            data['time'] = time_str            
        
        elif match_garrage_buy:
            parsed_data = match_garrage_buy.groupdict()
            class_name = parsed_data["item"]
            price = vehicle_prices[class_name]['buy_price']

            dt = datetime.strptime(parsed_data['datetime'], '%d.%m.%Y %H:%M:%S')
            str_time = dt.strftime('%H:%M:%S')  # e.g., '10:21:39'
        
            # Default fields to maintain compatibility with the original format
            data = {
                "player": parsed_data["player"],
                "item": parsed_data["item"],
                "time": str_time,
                "quantity": 1,
                "uid": "uknown",
                "trader": f"lb_garage",
                "zone": "unknown",
                "pos": "unknown",
                "datetime": parsed_data["datetime"],
                "type": 'buy',
                "price": price
            }

    
        elif match_garrage_sell:
            parsed_data = match_garrage_sell.groupdict()
            class_name = parsed_data["item"]
            price = vehicle_prices[class_name]['sell_price']
            dt = datetime.strptime(parsed_data['datetime'], '%d.%m.%Y %H:%M:%S')
            str_time = dt.strftime('%H:%M:%S')  # e.g., '10:21:39'
        
            # Default fields to maintain compatibility with the original format
            data = {
                "player": parsed_data["player"],                
                "item": parsed_data["item"],
                "time": str_time,
                "quantity": 1,
                "uid": "uknown",
                "trader": f"lb_garage",
                "zone": "unknown",
                "pos": "unknown",                
                "datetime": parsed_data["datetime"],
                "type": 'sell',
                "price": price
            } 

            

        if data != None:
            process_script_file_time(data, filename, line)
            dataset.append(data)
    
    return dataset

# Grouping logic for general item types
def categorize_item(item_name):
    name = item_name.lower()
    if any(keyword in name for keyword in ['fishing']):
        return "Fish"
    elif any(keyword in name for keyword in ['weapons', 'attachments', 'ammunition']):
        return "Weapons"
    elif any(keyword in name for keyword in ['clothing', 'armor', 'vests', 'donator', 'motorcycle']):
        return "Gear"
    elif any(keyword in name for keyword in ['hunting']):
        return "Animals"
    elif any(keyword in name for keyword in ['drug']):
        return "Drugs"    
    elif any(keyword in name for keyword in ['vehicle', 'boats', 'helicopters', "lb_garage"]):
        return 'Vehicles'
    elif any(keyword in name for keyword in ['consumables', 'medical', 'building', 'tools']):
            return 'Consumables & Building'
    elif any(keyword in name for keyword in ['collectibles']):
            return 'Collectibles'                    
    else:
        return "Other"

def post_process(data):
    for x in data:     
        date = x['date']
        str_time = x['time']
        str_date = x['date']
        str_date_time = f"{str_date} {str_time}"
        
        # The full datetime
        dt = datetime.strptime(str_date_time.split('.')[0], "%Y-%m-%d %H:%M:%S")
        
        # extract the year, month, day etc.
        x['str_date_time'] = str_date_time
        x['str_date'] = str_date
        x['str_time'] = str_time   
        x['str_year'] = dt.strftime('%Y')
        x['str_month'] = dt.strftime('%m')
        x['str_day'] = dt.strftime('%d')
        x['str_hour'] = dt.strftime('%H')
        x['str_min'] = dt.strftime('%M')
        x['market'] = x['trader'].split(" ")[0]
        x['category'] = categorize_item(x['trader'])

        del x['date']
        del x['time']
        if "datetime" in x:
            del x['datetime']
    return data

def to_files(data):
    lines = []
    for x in data:
        lines.append(
            [   
                x['str_date_time'],
                x['str_date'],
                x['str_time'],
                x['str_year'],
                x['str_month'],
                x['str_day'],
                x['str_hour'],
                x['str_min']            ,
                x['player'],
                x['item'],
                x['quantity'],
                x['uid'],
                x['trader'],
                x['zone'],
                x['category'],
                x['price']
            ]
        )

    with open('../data/data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(lines)

    # Write to a JSON file
    with open("../data/data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def get_lb_vehicles_map(filename):

    # Load JSON file
    with open(filename, 'r', encoding='utf-8') as file:
        items = json.load(file)

    # Initialize dictionary
    data = {}

    # Parse data
    for item in items['vehicles']:
        name = item.get('itemname')
        group = item.get('groupName')
        buy_price = item.get('buyCost')
        sell_price = item.get('sellPrice')

        # the classname
        data[name] = {
            "buy_price": buy_price,
            "sell_price": sell_price       
        }

        # the parent name
        data[group] = {
            "buy_price": buy_price,
            "sell_price": sell_price
        }

    # Write to a JSON file
    with open("../data/vehicles.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    
    return data