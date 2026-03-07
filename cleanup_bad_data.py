import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Configuration
MONGODB_URL = "mongodb+srv://mitanshquotes_db_user:UQbvyA51oZjRuJqP@petpooja.0uub5oo.mongodb.net/?appName=PetPooja"
DATABASE_NAME = "petpooja_db"

async def cleanup_db():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # 1. Identify items with "Unknown" names
    print("Identifying 'Unknown' items...")
    bad_items = await db.menu_items.find({
        "$or": [
            {"name": "Unknown"},
            {"name": "Unknown Item"},
            {"name": {"$regex": "^Unknown", "$options": "i"}},
            {"category": "Unknown"}
        ]
    }).to_list(1000)
    
    bad_ids = [item["_id"] for item in bad_items]
    bad_id_strs = [str(item["_id"]) for item in bad_items]
    
    if not bad_ids:
        print("No 'Unknown' items found to delete.")
        client.close()
        return

    print(f"Found {len(bad_ids)} items to remove.")

    # 2. Delete the items
    result_items = await db.menu_items.delete_many({"_id": {"$in": bad_ids}})
    print(f"Deleted {result_items.deleted_count} menu items.")

    # 3. Delete orders that contain these items
    # We delete the entire order if it contains a bad item to keep it simple and clean
    result_orders = await db.orders.delete_many({
        "items.menu_item_id": {"$in": bad_id_strs}
    })
    print(f"Deleted {result_orders.deleted_count} orders referencing these items.")

    print("Cleanup complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_db())
