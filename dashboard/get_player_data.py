import os
import re
import json
from datetime import datetime

def get_data(): 
    players_dir = '../../omega/servers/season-6/profiles/LBMaster/Data/Core/Players'    
    data = get_player_data(players_dir)
    return data

def get_player_data(logs_dir):
    print(f'parsing {logs_dir}')
    dataset = []

    for dirpath, dirnames, filenames in os.walk(logs_dir):
        for filename in filenames:            
            # the ADM file has player location information - 
            if filename.lower().endswith('.json'):
                file_path = os.path.join(dirpath, filename)                
                print(f'opening {file_path}')
                with open(file_path, 'r', encoding='utf-8') as f:        
                    print(f'opened {file_path}')                    
                    player = parse_file(f, filename)
                    dataset.append(player)

    print(f'players loaded: {len(dataset)}')
    return dataset
    
# Parse the file to find all location matches
def parse_file(file_content, filename):
    print(f"PROCESSING {filename}")    
    
    obj = json.load(file_content)
    
    player = {
        "player_steam_id": obj["steamid"],
        "bohemia_id": obj["bohemiaId"],
        "player_name": obj["lastName"],
        "player_group": obj["lastGroupTag"]
    }
    
    return player

