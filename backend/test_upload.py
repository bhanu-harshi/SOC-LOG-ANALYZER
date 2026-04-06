import requests

BASE_URL = "http://localhost:8000"

print("Logging in...")
login_res = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
if login_res.status_code != 200:
    print("Login failed:", login_res.text)
    exit(1)

token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("Uploading file...")
with open("test_log.txt", "rb") as f:
    upload_res = requests.post(f"{BASE_URL}/logs/upload", headers=headers, files={"file": f})

if upload_res.status_code != 200:
    print("Upload failed:", upload_res.text)
    exit(1)

file_id = upload_res.json()["file_id"]
print(f"File uploaded successfully. ID: {file_id}. Getting results...")

results_res = requests.get(f"{BASE_URL}/logs/{file_id}/results", headers=headers)
if results_res.status_code != 200:
    print("Results failed:", results_res.text)
else:
    print("Success! Results are working.")
