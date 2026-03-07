# PetPooja - Next-Gen Restaurant Management System

PetPooja is a comprehensive restaurant operating system featuring AI-driven voice ordering, real-time kitchen display (KDS), and revenue intelligence analytics.

## 🚀 Key Features

- **AI Voice Ordering**: Powered by **Gemini 2.5 Flash**, offering a natural, multi-modal voice ordering experience for both customers and staff.
- **Kitchen Display System (KDS)**: Real-time order tracking and status updates (New -> Preparing -> Ready -> Served).
- **Revenue Intelligence**: Automated menu engineering using BCG Matrix classification (Star, Plowhorse, Puzzle, Dog) based on historical sales data.
- **Smart Combo Recommendations**: Market Basket Analysis to suggest high-conversion item pairings.
- **Mobile-First Experience**: Responsive digital menu for seamless tableside ordering.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn/UI, Lucide Icons.
- **Backend**: FastAPI (Python), Motor (Async MongoDB), Pydantic.
- **Database**: MongoDB (Atlas).
- **AI**: Google Gemini Pro & Flash (Vertex AI / Google AI SDK).

## ⚙️ Setup Instructions

### Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder:
   ```env
   MONGODB_URL=your_mongodb_atlas_url
   DATABASE_NAME=petpooja_db
   GEMINI_API_KEY=your_google_ai_api_key
   ```
5. Run the server:
   ```bash
   uvicorn main:app --port 8000 --reload
   ```

### Frontend (Vite)

1. From the root directory, install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. The app will be available at `http://localhost:8080`.

## 📁 Project Structure

- `backend/`: FastAPI application, database logic, and AI services.
- `src/`: React frontend with pages for Menu, KDS, and Admin Analytics.
- `src/components/voice/`: Core logic for the AI Voice Assistant.
- `src/hooks/`: Custom React Query hooks for API interaction.

## 📄 License

This project is licensed under the MIT License.
