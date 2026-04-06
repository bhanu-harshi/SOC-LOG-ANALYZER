import subprocess
import time
import os
import re

def get_tunnel_url(port):
    print(f"Starting tunnel for port {port}...")
    process = subprocess.Popen(
        f"npx -y localtunnel --port {port}",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    start_time = time.time()
    url = None
    while time.time() - start_time < 30:
        line = process.stdout.readline()
        if not line and process.poll() is not None:
            break
        print(f"[Port {port} Log]: {line.strip()}")
        match = re.search(r'(https://[a-zA-Z0-9.-]+\.loca\.lt)', line)
        if match:
            url = match.group(1)
            break
            
    return process, url

print("Initializing live forwarding...")

# 1. Start Backend Tunnel
backend_proc, backend_url = get_tunnel_url(8000)
if not backend_url:
    print("Failed to get backend URL")
    exit(1)

print(f"✅ Backend URL Generated: {backend_url}")

# 2. Update Frontend Environment with new Backend URL
env_path = os.path.join("frontend", ".env.local")
with open(env_path, "w") as f:
    f.write(f"VITE_API_URL={backend_url}\n")
    
print(f"✅ Injected Backend URL into Frontend Environment")

# 3. Start Frontend Tunnel
frontend_proc, frontend_url = get_tunnel_url(5173)
if not frontend_url:
    print("Failed to get frontend URL")
    exit(1)

print(f"\n==============================================")
print(f"🔥 YOUR LIVE PROJECT LINK: {frontend_url}")
print(f"==============================================\n")
print(f"Keep this script running to keep the links alive!")
print(f"(Note: When opening the links, you may see a 'Friendly Warning' from localtunnel. Just click 'Click to Continue'.)")

with open("live_links.txt", "w") as f:
    f.write(f"FRONTEND: {frontend_url}\nBACKEND: {backend_url}\n")

try:
    frontend_proc.wait()
except KeyboardInterrupt:
    print("Shutting down tunnels...")
    backend_proc.terminate()
    frontend_proc.terminate()
