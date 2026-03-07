import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import random
from datetime import datetime, timedelta
from bson import ObjectId

# Configuration
MONGODB_URL = "mongodb+srv://mitanshquotes_db_user:UQbvyA51oZjRuJqP@petpooja.0uub5oo.mongodb.net/?appName=PetPooja"
DATABASE_NAME = "petpooja_db"

async def generate_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # 1. Fetch all menu items
    menu_items = await db.menu_items.find({"is_active": True}).to_list(100)
    print(f"Found {len(menu_items)} active menu items.")
    
    if not menu_items:
        print("No menu items found. Please run the migration first.")
        return

    # 2. Segment items into 4 groups for BCG classification
    # Shuffling to ensure random items get different classifications
    random.shuffle(menu_items)
    
    num_items = len(menu_items)
    star_items = menu_items[:num_items//4]
    plowhorse_items = menu_items[num_items//4 : num_items//2]
    puzzle_items = menu_items[num_items//2 : 3*num_items//4]
    dog_items = menu_items[3*num_items//4:]
    
    print(f"Segments: Stars={len(star_items)}, Plowhorses={len(plowhorse_items)}, Puzzles={len(puzzle_items)}, Dogs={len(dog_items)}")

    # 3. Update food costs to skew margins
    # Star (High Popularity, High Margin): 25% cost
    # Plowhorse (High Popularity, Low Margin): 80% cost
    # Puzzle (Low Popularity, High Margin): 25% cost
    # Dog (Low Popularity, Low Margin): 80% cost
    
    async def update_cost(items, cost_factor):
        for item in items:
            food_cost = round(item['selling_price'] * cost_factor, 2)
            await db.menu_items.update_one({"_id": item["_id"]}, {"$set": {"food_cost": food_cost}})

    await update_cost(star_items, 0.25)
    await update_cost(plowhorse_items, 0.80)
    await update_cost(puzzle_items, 0.25)
    await update_cost(dog_items, 0.80)
    print("Updated food costs per segment.")

    # 4. Clear existing orders to start fresh
    await db.orders.delete_many({})
    print("Cleared existing orders.")

    # 5. Generate 5000 skewed orders
    # Popularity weights:
    # Stars & Plowhorses: Weight 10
    # Puzzles & Dogs: Weight 1
    
    weighted_items = []
    for item in star_items + plowhorse_items:
        weighted_items.extend([item] * 10)
    for item in puzzle_items + dog_items:
        weighted_items.extend([item] * 1)

    now = datetime.now()
    orders = []
    
    for i in range(5000):
        # Pick 1-4 items per order
        num_order_items = random.randint(1, 4)
        order_items_list = random.sample(weighted_items, num_order_items)
        
        items_payload = []
        for o_item in order_items_list:
            items_payload.append({
                "menu_item_id": str(o_item["_id"]),
                "name": o_item["name"],
                "qty": random.randint(1, 4),
                "modifiers": [],
                "notes": "",
                "selling_price": o_item["selling_price"] # Needed for aggregation if missing in schema
            })
            
        # Distribute orders over the last 14 days
        order_date = now - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))
        
        order = {
            "orderNumber": f"ORD-SYN-{i:05d}",
            "items": items_payload,
            "status": "served",
            "type": "dine-in",
            "table": str(random.randint(1, 20)),
            "created_at": order_date,
            "time": order_date.strftime("%I:%M %p"),
            "elapsed": random.randint(5, 30)
        }
        orders.append(order)
        
        if len(orders) >= 1000:
            await db.orders.insert_many(orders)
            orders = []
            print(f"Inserted {i+1} orders...")

    if orders:
        await db.orders.insert_many(orders)

    print("Successfully generated 5000 new synthetic orders with skewed popularity.")
    client.close()

if __name__ == "__main__":
    asyncio.run(generate_data())
