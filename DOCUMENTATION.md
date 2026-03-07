# PetPooja Technical Documentation

This document provides a deep dive into the architecture, data models, and specialized logic of the PetPooja Restaurant Operating System.

---

## 🏗️ System Architecture

PetPooja follows a modern micro-service-inspired monolithic architecture on the backend, with a highly interactive React-based frontend.

### 1. Data Flow
- **Frontend**: React (Vite) communicates via REST APIs (FastAPI) and raw WebSockets (Gemini Bidi).
- **Backend**: FastAPI acts as the orchestrator for database operations and business logic.
- **AI Layer**: Direct WebSocket connection from Browser to Google's Generative AI Gateway (Gemini 2.5 Flash) for ultra-low latency voice.

---

## 📊 Database Schema (MongoDB)

### `menu_items`
Stores the source of truth for all food and beverage products.
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Unique name of the item |
| `selling_price`| Float | Price shown to customers |
| `food_cost` | Float | Internal COGS for margin analysis |
| `category` | String | e.g., Paratha, Sabji, Drink |
| `veg` | Boolean | Dietary classification |
| `is_active` | Boolean | Soft-delete/Availability toggle |

### `orders`
Stores historical and active KOTs (Kitchen Order Tickets).
| Field | Type | Description |
| :--- | :--- | :--- |
| `orderNumber` | String | Unique reference (e.g., KOT-123) |
| `items` | Array | Objects containing `menu_item_id`, `qty`, `modifiers` |
| `status` | String | `new`, `preparing`, `ready`, `served`, `cancelled` |
| `table` | String | Table number or "Takeaway" |
| `created_at` | DateTime| Timestamp for velocity analysis |

---

## 🎙️ AI Voice Copilot
The system uses a bidirectional WebSocket protocol to communicate with Gemini.

### Key Logic:
- **Sample Rate**: 24kHz Mono PCM.
- **System Instructions**: Enforces female personification (Aoede), concise Hinglish speech, and menu-only selling.
- **Tool Calling**:
    - `process_order`: Updates the reactive frontend cart in real-time.
    - `place_order`: Finalizes the transaction and sends data to the KDS.
- **Audio Chain**: Implements a browser-side `DynamicsCompressor` and `BiquadFilter` to ensure clear voice playback even in noisy restaurant environments.

---

## 📈 Intelligence Modules

### BCG Matrix Analysis
The `RevenueIntelligenceService` groups items into four quadrants:
1.  **Stars**: High Margin, High Volume. (Action: Keep & Invest)
2.  **Plowhorses**: Low Margin, High Volume. (Action: Optimize recipe costs)
3.  **Puzzles**: High Margin, Low Volume. (Action: Boost promotion)
4.  **Dogs**: Low Margin, Low Volume. (Action: Consider removal)

### Market Basket Analysis (Combos)
Uses **Association Rule Mining** (Support and Confidence) to find item pairs frequently bought together.
- **Support**: Frequency of pair occurrence across all orders.
- **Confidence**: Probability that Item B is bought if Item A is purchased.

---

## 🛠️ Internal API Reference

### Kitchen API (`/kitchen`)
- `GET /orders`: Returns all active (non-served) orders.
- `PATCH /orders/{id}/status`: Advances order through KDS stages.

### Revenue API (`/revenue`)
- `GET /analysis`: Triggers BCG Matrix calculation for the entire menu.
- `GET /combos`: Returns recommended item pairings.
- `POST /combos/promote`: Manually prioritizes a specific combo for the AI Agent.

---

## 🚀 Future Roadmap
- [ ] Integration with Physical Thermal Printers.
- [ ] Predictive Inventory Management based on sales velocity.
- [ ] Multi-store dashboard for franchise owners.
