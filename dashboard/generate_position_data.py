import os
import re
import csv
import json
from datetime import datetime

PATTERN_PLAYER_LOCATION = re.compile(
    r"(?P<time>\d{2}:\d{2}:\d{2}) \| Player "
    r"\"(?P<name>[^\"]+)\" "
    r"\(id=(?P<id>[^ )]+)\s+pos=<(?P<x>-?\d+(?:\.\d+)?),\s*(?P<y>-?\d+(?:\.\d+)?),\s*(?P<z>-?\d+(?:\.\d+)?)>\)"
)

FILE_PATTERN = re.compile(r"DayZServer_x64_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.ADM")

def get_data(): 
    logs_dir = '../../omega/servers/season-6/logs'    
    data = parse_log_folders(logs_dir)
    data = post_process(data)
    to_files(data)
    return data

def parse_log_folders(logs_dir):
    print(f'parsing {logs_dir}')
    dataset = []

    for dirpath, dirnames, filenames in os.walk(logs_dir):
        for filename in filenames:            
            # the ADM file has player location information - 
            if filename.lower().endswith('.adm'):
                file_path = os.path.join(dirpath, filename)                
                print(f'opening {file_path}')
                with open(file_path, 'r', encoding='utf-8') as f:        
                    print(f'opened {file_path}')                    
                    file_data = parse_file(f, filename)
                    dataset.extend(file_data)

    print(len(dataset))
    return dataset
    
# Parse the file to find all location matches
def parse_file(file_content, filename):
    print(f"PROCESSING {filename}")    
    dataset = []
    while line := file_content.readline():        
        match_location = PATTERN_PLAYER_LOCATION.search(line)
        
        if match_location:
            data = match_location.groupdict()
            # convert x, y, z to floats
            for key in ["x", "y", "z"]:
                data[key] = float(data[key])
        
            process_script_file_time(data, filename, line)
            print(data)
            dataset.append(data)
    
    return dataset

# Parse the date from the filename
def process_script_file_time(data, filename, line):    
    match = FILE_PATTERN.search(filename)
    if match:
        
        dt = datetime(
            year=int(match.group(1)),
            month=int(match.group(2)),
            day=int(match.group(3)),
        )
                
        
        data['date'] = dt.strftime("%Y-%m-%d")
        
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
        x['name'] = x['name']
        x['player_id'] = x['id']
        x['x'] = x['x']
        x['y'] = x['y']
        x['z'] = x['z']

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
                x['str_min'],
                x['name'],
                x['id'],
                x['x'],
                x['y'],
                x['z']
            ]
        )

    with open('../data/data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(lines)

    # Write to a JSON file
    with open("../data/position.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

