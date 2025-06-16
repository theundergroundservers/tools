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

def get_data(): 
    logs_dir = '../../omega/servers/season-6/logs'
    data = parse_log_folders(logs_dir)
    data = post_process(data)
    return data
def main(): 
    data = get_data()
    to_files(data)

def parse_log_folders(logs_dir):
    print(f'parsing {logs_dir}')
    dataset = []
    for dirpath, dirnames, filenames in os.walk(logs_dir):
        for filename in filenames:            
            if filename.startswith('script_'):                
                file_path = os.path.join(dirpath, filename)
                file_date = get_file_date(file_path)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:                        
                        file_data = parse_file(f, file_date)
                        dataset.extend(file_data)
                except Exception as e:
                    print(f"Could not open {file_path}: {e}")\

    print(len(dataset))
    return dataset

def get_file_date(filename):     
    # Extract date and time using regex
    match = re.search(r"script_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.log", filename)
    if match:
        date_str = match.group(1) 
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        print(dt)
        return dt
    print('no date!')
    return None

def parse_file(file_content, file_date):
   
    dataset = []
    while line := file_content.readline():   
        try:                     
            match_sell = PATTERN_SELL.search(line)
            match_buy = PATTERN_BUY.search(line)
    
            data = None

            if match_sell:
                data = match_sell.groupdict()
                data['type'] = 'sell'

            elif match_buy:
                data = match_buy.groupdict()
                data['type'] = 'buy'

            if data != None:
                data['date'] = file_date
                dt_match = re.search(r"'(?P<time>\d{2}:\d{2}:\d{2}\.\d{3})", line)
                data['time'] = dt_match.group("time")            
                dataset.append(data)
        except Exception as e:
            print(f"ERRPR: {e}")

    return dataset

# Grouping logic for general item types
def categorize_item(item_name):
    name = item_name.lower()
    if any(keyword in name for keyword in ['fishing']):
        return "Fish"
    elif any(keyword in name for keyword in ['weapons', 'attachments', 'ammunition']):
        return "Weapons"
    elif any(keyword in name for keyword in ['clothing', 'armor', 'vests']):
        return "Armor & Gear"
    elif any(keyword in name for keyword in ['hunting']):
        return "Animals"
    elif any(keyword in name for keyword in ['drug']):
        return "Drugs"    

    elif any(keyword in name for keyword in ['vehicle']):
        return 'Vehicles'

    else:
        return "Other"


def post_process(data):
    for x in data:        
        date = x['date']
        str_time = x['time']
        str_date = date.strftime('%Y-%m-%d')
        str_date_time = f"{date.strftime('%Y-%m-%d')} {str_time}"
        
        # The full datetime
        dt = datetime.strptime(str_date_time, "%Y-%m-%d %H:%M:%S.%f")
        
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
                x['str_min'],
                x['player'],
                x['id'],
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

