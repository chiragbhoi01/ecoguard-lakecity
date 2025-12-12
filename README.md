# 🛡️ EcoGuard Lakecity
> **Team Marshal** | Google Lakecity Hackathon 2026

**EcoGuard** is an Agentic AI System designed to automate urban waste management. It leverages **Google Gemini 1.5 Flash** to analyze waste from images and **Google Maps API** to optimize collection routes for drivers.

## 🚀 Tech Stack
* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS (Glassmorphism UI)
* **Backend & Auth:** Firebase (Firestore, Auth)
* **AI Engine:** Google Gemini 1.5 Flash (Multimodal)
* **Maps:** Google Maps Javascript API

## 👥 Team Marshal (Core Team)
| Member | Role | Responsibilities |
| :--- | :--- | :--- |
| **Chirag Bhoi** | Tech Lead & Architect | Backend Logic, AI Integration, Pitch Deck & Documentation |
| **Mohit** | Frontend Lead | UI/UX Design, Google Maps Visualization, QA Testing |

## 🛠️ Getting Started (For Team)

1.  **Clone the repo:**
    ```bash
    # Replace 'YOUR_USERNAME' with your actual GitHub username below
    git clone [https://github.com/YOUR_USERNAME/ecoguard-lakecity.git](https://github.com/YOUR_USERNAME/ecoguard-lakecity.git)
    cd ecoguard-lakecity
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root and add:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
    GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run the server:**
    ```bash
    npm run dev
    ```

## 🎯 Key Features (MVP Goals)
* [ ] **Smart Sense:** AI detection of waste type (Plastic/Organic) & severity using Gemini Vision.
* [ ] **Live Maps:** Real-time visualization of waste hotspots on Google Maps.
* [ ] **Route Optimization:** Efficient pathfinding for collection trucks.
* [ ] **Impact Tracker:** Dashboard showing CO2 saved.

---
*Built with ❤️ by Team Marshal for a cleaner Udaipur.*