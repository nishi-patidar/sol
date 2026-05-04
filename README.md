## sol. —An Aesthetic Wellness Journal☁️

"sol." is a minimalist, full-stack wellness application designed to simplify self-reflection. Born from the realization that most habit-tracking apps are cluttered and overwhelming, "sol." prioritizes a "calm-tech" aesthetic inspired by Pinterest-style minimalism and intuitive user experience. ✨

*currently wokring on this project*
## 🌟 Features

- Dynamic Mood Tracking 🎨: A high-contrast interface to log daily vibes with custom-selected palettes (off-white, terracotta, and butter yellow).

- Journaling with Persistence 📸: Full CRUD functionality allowing users to save, view, and delete journal entries, including support for photo uploads.

- Unified Activity Tracker 🗓️: Tracks daily habits and history through a clean, responsive card-based layout.
  
- PWA Integration 📱: Fully installable on mobile devices, providing a native-app experience without the overhead of a traditional app store download.

## 💻 Tech Stack

- ⚛️ Frontend: React.js, Tailwind CSS 
- 🌐 Backend: Node.js, Express.js
- ☁️ Database: TiDB (MySQL-Compatible Cloud Database) 
- 🚀 Deployment: Vercel (Frontend), Render (Backend) 

## ⚙️ Engineering Highlights

- 🔗 Cloud Connectivity: Successfully migrated from local storage to a live TiDB cloud instance, ensuring data survives across devices and sessions.
  
- ⚡ Optimized Performance: Implemented asynchronous state updates to ensure the UI remains snappy and "frozen-free" during database operations. 
  
- 🧭 Responsive Design: Architected with a mobile-first approach, ensuring seamless transitions between desktop browsing and the "installed" mobile app experience.

 🚀 Getting Started

1. Clone the repository:
   bash
   git clone [https://github.com/nishi-patidar/sol.git](https://github.com/nishi-patidar/sol.git)
   
2. Install dependencies:
   bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
  
3. Environment Variables:
   Create a `.env` file in the backend folder and add your TiDB connection string.
   
5. Run the app:
   bash
   cd backend && node server.js
   cd ../frontend && npm start

## 💡 The Motivation
I built **sol.** because I couldn't find a digital space that felt both functional and visually peaceful.
I wanted to prove that a professional-grade engineering project could also be a work of art.🌿
