import httpx
import asyncio

BASE_URL = "http://localhost:8000"

async def test_upload():
    async with httpx.AsyncClient() as client:
        print("Logging in...")
        login_res = await client.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return

        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("Uploading Zscaler log...")
        with open("zscaler_test.log", "rb") as f:
            files = {'file': ('zscaler_test.log', f, 'text/plain')}
            upload_res = await client.post(f"{BASE_URL}/logs/upload", headers=headers, files=files)
        
        if upload_res.status_code != 200:
            print("Upload failed:", upload_res.text)
            return

        file_id = upload_res.json()["file_id"]
        print(f"File uploaded successfully. ID: {file_id}. Getting results...")

        # Give LLM a sec
        await asyncio.sleep(2)
        results_res = await client.get(f"{BASE_URL}/logs/{file_id}/results", headers=headers)
        if results_res.status_code != 200:
            print("Results failed:", results_res.text)
        else:
            data = results_res.json()
            print("Success! Anomalies detected:")
            for a in data["anomalies"]:
                print(f" - {a['anomaly_type']}: {a['reason']} (Severity: {a['severity']})")

if __name__ == "__main__":
    asyncio.run(test_upload())
