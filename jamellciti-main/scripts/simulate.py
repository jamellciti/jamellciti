#!/usr/bin/env python3
"""
Aura Vision Event Simulator
Generates realistic IoT events for testing the rule engine and dashboard
"""

import asyncio
import aiohttp
import argparse
import random
import json
from datetime import datetime
from typing import List, Dict
import time

# Phoenix downtown coordinates (roughly)
PHOENIX_BOUNDS = {
    "lat_min": 33.44,
    "lat_max": 33.47,  
    "lon_min": -112.09,
    "lon_max": -112.07
}

# Event configurations
EVENT_CONFIGS = {
    "pothole": {
        "weight": 0.2,
        "severity_range": (1, 5),
        "score_range": (0.6, 0.95)
    },
    "storm_drain_clog": {
        "weight": 0.1,
        "severity_range": (2, 4),
        "score_range": (0.7, 0.9)
    },
    "near_miss": {
        "weight": 0.15,
        "severity_range": (1, 5),
        "score_range": (0.3, 1.0)
    },
    "litter_dumping": {
        "weight": 0.15,
        "severity_range": (1, 4),
        "score_range": (0.5, 0.85)
    },
    "ada_obstruction": {
        "weight": 0.1,
        "severity_range": (2, 5),
        "score_range": (0.6, 0.9)
    },
    # New enforcement event types
    "illegal_uturn": {
        "weight": 0.1,
        "severity_range": (2, 4),
        "score_range": (0.7, 0.95)
    },
    "failure_to_yield": {
        "weight": 0.1,
        "severity_range": (1, 4),
        "score_range": (0.65, 0.9)
    },
    "reckless_merge": {
        "weight": 0.05,
        "severity_range": (3, 5),
        "score_range": (0.8, 0.98)
    },
    "speeding_school_zone": {
        "weight": 0.05,
        "severity_range": (2, 5),
        "score_range": (0.75, 0.95)
    }
}

class EventSimulator:
    def __init__(self, base_url: str, api_key: str, city: str = "phoenix"):
        self.base_url = base_url
        self.api_key = api_key
        self.city = city
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def generate_event(self, event_types: List[str] = None) -> Dict:
        """Generate a random event"""
        if event_types:
            available_types = {k: v for k, v in EVENT_CONFIGS.items() if k in event_types}
        else:
            available_types = EVENT_CONFIGS
        
        # Select event type based on weights
        types = list(available_types.keys())
        weights = [available_types[t]["weight"] for t in types]
        event_type = random.choices(types, weights=weights)[0]
        
        config = available_types[event_type]
        
        # Generate random location within Phoenix bounds
        lat = random.uniform(PHOENIX_BOUNDS["lat_min"], PHOENIX_BOUNDS["lat_max"])
        lon = random.uniform(PHOENIX_BOUNDS["lon_min"], PHOENIX_BOUNDS["lon_max"])
        
        # Generate severity and score
        severity = random.randint(*config["severity_range"])
        score = random.uniform(*config["score_range"])
        
        return {
            "type": event_type,
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "severity": severity,
            "score": round(score, 3),
            "city": self.city,
            "device_id": f"sim-device-{random.randint(1, 50):03d}"
        }
    
    async def send_event(self, event: Dict) -> Dict:
        """Send event to API"""
        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }
        
        url = f"{self.base_url}/api/ingest/events"
        
        async with self.session.post(url, json=event, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                return result
            else:
                error_text = await response.text()
                raise Exception(f"API Error {response.status}: {error_text}")
    
    async def run_simulation(self, 
                           event_types: List[str] = None,
                           rate: float = 8.0,
                           duration: int = None,
                           verbose: bool = True):
        """Run continuous event simulation"""
        events_sent = 0
        start_time = time.time()
        
        print(f"🚀 Starting Aura Vision Event Simulator")
        print(f"📍 City: {self.city}")
        print(f"⚡ Rate: {rate} events/minute")
        print(f"📊 Event types: {event_types or list(EVENT_CONFIGS.keys())}")
        print(f"🌐 API: {self.base_url}")
        print("-" * 60)
        
        try:
            while True:
                # Check duration limit
                if duration and (time.time() - start_time) > duration:
                    break
                
                # Generate and send event
                event = self.generate_event(event_types)
                
                try:
                    result = await self.send_event(event)
                    events_sent += 1
                    
                    if verbose:
                        actions = result.get("actions", {})
                        action_summary = []
                        if actions.get("work_orders"):
                            action_summary.append(f"WO: {len(actions['work_orders'])}")
                        if actions.get("citations"):
                            action_summary.append(f"CIT: {len(actions['citations'])}")
                        if actions.get("kpi_only"):
                            action_summary.append("KPI")
                        
                        action_str = " | ".join(action_summary) if action_summary else "None"
                        
                        print(f"✅ {events_sent:3d} | {event['type']:15s} | "
                              f"S:{event['severity']} | {event['lat']:.4f},{event['lon']:.4f} | "
                              f"Actions: {action_str}")
                    
                except Exception as e:
                    print(f"❌ Error sending event: {e}")
                
                # Wait for next event based on rate
                wait_time = 60.0 / rate  # Convert events/minute to seconds between events
                await asyncio.sleep(wait_time)
                
        except KeyboardInterrupt:
            print(f"\n🛑 Simulation stopped by user")
        
        elapsed = time.time() - start_time
        print(f"\n📈 Simulation Summary:")
        print(f"   Events sent: {events_sent}")
        print(f"   Duration: {elapsed:.1f}s")
        print(f"   Avg rate: {events_sent / (elapsed / 60):.1f} events/min")

async def main():
    parser = argparse.ArgumentParser(description="Aura Vision Event Simulator")
    parser.add_argument("--url", default="http://localhost:8001", 
                       help="Base URL for the API")
    parser.add_argument("--api-key", required=True,
                       help="API key for authentication")
    parser.add_argument("--city", default="phoenix",
                       help="City name (phoenix, tucson, demo)")
    parser.add_argument("--events", 
                       help="Comma-separated list of event types to generate")
    parser.add_argument("--rate", type=float, default=8.0,
                       help="Events per minute")
    parser.add_argument("--duration", type=int,
                       help="Duration in seconds (default: run forever)")
    parser.add_argument("--quiet", action="store_true",
                       help="Suppress verbose output")
    
    args = parser.parse_args()
    
    # Parse event types
    event_types = None
    if args.events:
        event_types = [e.strip() for e in args.events.split(",")]
        # Validate event types
        invalid_types = set(event_types) - set(EVENT_CONFIGS.keys())
        if invalid_types:
            print(f"❌ Invalid event types: {invalid_types}")
            print(f"✅ Valid types: {list(EVENT_CONFIGS.keys())}")
            return
    
    # Run simulation
    async with EventSimulator(args.url, args.api_key, args.city) as simulator:
        await simulator.run_simulation(
            event_types=event_types,
            rate=args.rate,
            duration=args.duration,
            verbose=not args.quiet
        )

if __name__ == "__main__":
    asyncio.run(main())