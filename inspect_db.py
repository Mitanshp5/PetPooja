import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

# Configuration
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "petpooja_db")

async def inspect_db():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # 1. Check for items with "Unknown" or empty names
    print("--- Menu Items with missing or 'Unknown' names ---")
    bad_items = await db.menu_items.find({
        "$or": [
            {"name": {"$exists": False}},
            {"name": ""},
            {"name": "Unknown"},
            {"name": "Unknown Item"}
        ]
    }).to_list(100)
    
    for item in bad_items:
        print(f"ID: {item['_id']}, Name: {item.get('name')}, Category: {item.get('category')}")

    # 2. Check for orders referencing non-existent items
    print("\n--- Orders referencing non-existent items ---")
    menu_item_ids = set()
    async for item in db.menu_items.find({}, {"_id": 1}):
        menu_item_ids.add(str(item["_id"]))
    
    pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.menu_item_id", "count": {"$sum": 1}}}
    ]
    order_items = await db.orders.aggregate(pipeline).to_list(1000)
    
    orphans = 0
    for oi in order_items:
        if oi["_id"] not in menu_item_ids:
            print(f"Invalid Item ID in Orders: {oi['_id']}, Count: {oi['count']}")
            orphans += 1
    
    print(f"\nTotal orphan item IDs in orders: {orphans}")
    client.close()

if __name__ == "__main__":
    asyncio.run(inspect_db())
