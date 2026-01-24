
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

KOSIS_API_KEY = os.getenv("KOSIS_API_KEY")

if not KOSIS_API_KEY:
    print("Please set KOSIS_API_KEY in .env first.")
    exit()

def search_kosis(keyword):
    url = "https://kosis.kr/openapi/Param/statisticsSearch.do"
    # KOSIS API Key often has issues with URL encoding. 
    # Try constructing URL manually to ensure key is sent exactly as provided (or try unquote).
    # Requests `params` will URL-encode '=' to '%3D'.
    # Let's try sending it blindly first, if that fails, we might need the "decoded" version if this IS the encoded version.
    # Actually, KOSIS usually issues one key. Let's try appending manually.
    
    # params = {
    #     "method": "getList",
    #     "apiKey": KOSIS_API_KEY,
    #     "searchNm": keyword,
    #     "format": "json",
    #     "jsonVD": "Y"
    # }
    
    # Construct URL manually to control encoding
    from urllib.parse import unquote
    decoded_key = unquote(KOSIS_API_KEY)
    full_url = f"{url}?method=getList&apiKey={decoded_key}&searchNm={keyword}&format=json&jsonVD=Y"
    
    print(f"DEBUG: Calling {full_url} (Key masked in log)")

    try:
        response = requests.get(full_url) # No params arg
        response.raise_for_status()
        data = response.json()
        
        print(f"--- Search Results for '{keyword}' ---")
        if not data:
             print("No results found.")
             return

        # KOSIS sometimes returns a single dict if one result, or list if multiple.
        if isinstance(data, dict): 
            data = [data]
            
        for item in data:
            print(f"Table Name: {item.get('TBL_NM')}")
            print(f"Table ID: {item.get('TBL_ID')}")
            print(f"Org ID: {item.get('ORG_ID')}")
            print(f"Path: {item.get('IX_NM')}")
            print("-" * 20)
            
    except Exception as e:
        print(f"Error: {e}")
        try:
             # KOSIS often returns error HTML page on failure instead of JSON
             print("Response Text Preview:", response.text[:500])
        except:
             pass

if __name__ == "__main__":
    search_kosis("미국 소비자물가")
    print("\n")
    search_kosis("한국 소비자물가")
