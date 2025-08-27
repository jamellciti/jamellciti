#!/usr/bin/env python3
import requests
import json

API_BASE = "https://mobile-app-maker-14.preview.emergentagent.com/api"

# Test registration and login flow
print("Testing registration...")
parent_data = {
    "email": "testparent@example.com",
    "password": "TestPass123!",
    "display_name": "Test Parent",
    "role": "parent"
}

response = requests.post(f"{API_BASE}/auth/register", json=parent_data)
print(f"Registration status: {response.status_code}")
if response.status_code != 200:
    print(f"Registration error: {response.text}")
    exit(1)

print("Testing login...")
login_data = {
    "email": parent_data["email"],
    "password": parent_data["password"]
}

response = requests.post(f"{API_BASE}/auth/login", json=login_data)
print(f"Login status: {response.status_code}")
if response.status_code != 200:
    print(f"Login error: {response.text}")
    exit(1)

data = response.json()
token = data.get("access_token")
print(f"Got token: {token[:50]}...")

print("Testing family creation...")
family_data = {"name": "Test Family"}
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

response = requests.post(f"{API_BASE}/families", json=family_data, headers=headers)
print(f"Family creation status: {response.status_code}")
if response.status_code != 200:
    print(f"Family creation error: {response.text}")
else:
    print("Family created successfully!")
    print(response.json())