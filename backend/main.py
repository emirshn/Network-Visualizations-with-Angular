import ipaddress
import random

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import ARP, Ether, srp
app = FastAPI()

origins = [
    "http://localhost:4200"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)\

node_count = 0
network = []

@app.post("/network-data")
async def post_network_info(network_data: dict):
    global node_count, network
    nodes = network_data.get("nodes", [])
    node_count = len(nodes) - 1
    network = network_data

    print(network_data)
    return {"message": "JSON data received successfully"}

@app.get("/ips")
def get_ips():
    global network
    api_key = ""
    active_ips, unused_ips, geolocation_data, random_points = find_active_and_inactive_ips(api_key)
    print("Geolocation Data:", geolocation_data)
    response = {
        "used_ips": active_ips,
        "unused_ips": unused_ips,
        "geo_info": geolocation_data,
        "device_locations": random_points,
        "connection_data": network
    }

    return JSONResponse(content=response)

import requests

def get_public_ip():
    try:
        response = requests.get("https://api.ipify.org?format=json")
        if response.status_code == 200:
            data = response.json()
            public_ip = data.get("ip")
            return public_ip
        else:
            print(f"Failed to get public IP. Status code: {response.status_code}")
    except requests.RequestException as e:
        print(f"Error occurred while fetching public IP: {e}")

    return None

def find_active_and_inactive_ips(api_key):
    arp = ARP(pdst="192.168.0.0/24")
    ether = Ether(dst="ff:ff:ff:ff:ff:ff")
    packet = ether/arp

    result = srp(packet, timeout=3, verbose=0)[0]

    active_ips = []
    for sent, received in result:
        active_ips.append(received.psrc)

    network_ips = set("192.168.0." + str(i) for i in range(1, 256))

    unused_ips = list(network_ips - set(active_ips))

    geolocation_data = {}

    ip = get_public_ip()
    url = f"https://ipinfo.io/{ip}?token={api_key}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        lat, lon = data.get("loc", "").split(",")
        geolocation_data[ip] = (float(lat), float(lon))
    else:
        geolocation_data[ip] = None

    random_points = []
    center_location = geolocation_data[ip]
    lat, lon = center_location
    for _ in range(node_count):
        lat_offset = (random.random() - 0.5) * 2 * 0.01
        lon_offset = (random.random() - 0.5) * 2 * 0.01
        new_lat = lat + lat_offset
        new_lon = lon + lon_offset
        random_points.append((new_lat, new_lon))

    print(random_points)

    return active_ips, unused_ips, geolocation_data, random_points

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
