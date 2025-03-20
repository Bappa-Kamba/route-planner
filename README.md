# Route Planner PRO
A trip Management System

## 📌 Project Description
This is a **full-stack trip management system** that allows users to create, track, and manage trips efficiently. It integrates **Django (REST API)** for the backend and **React + TailwindCSS** for the frontend, with **Mapbox API** handling route calculations and mapping.

---

## ⚡ Features
- **Trip Creation & Management**
- **Route Calculation using Mapbox**
- **Driver Log Generation (FMCSA Compliant)**
- **Fuel & Rest Stop Recommendations**
- **Interactive Map Integration**
- **API Documentation with Swagger & ReDoc**

---

## 🏗️ Tech Stack
### **Backend:**
- Django (Django REST Framework)
- PostgreSQL
- Mapbox API (Directions & Geocoding)
- Django CORS Headers

### **Frontend:**
- React (Vite)
- TailwindCSS
- React Router
- Mapbox GL JS

---

## 🚀 Installation Guide

Follow these steps to set up and run the application on your local machine:

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/your-repo/trip-management.git
cd trip-management
```

### **2️⃣ Set Up the Backend (Django)**
#### **Step 1: Navigate to the Backend Directory**
```bash
cd backend
```
#### **Step 2: Create and Activate a Virtual Environment**
```bash
python -m venv venv  # Create virtual environment
source venv/bin/activate  # Activate virtual environment (Mac/Linux)
venv\Scripts\activate  # (Windows)
```
#### **Step 3: Install Backend Dependencies**
```bash
pip install -r requirements.txt
```
#### **Step 4: Apply Database Migrations**
```bash
python manage.py migrate
```
#### **Step 5: Start the Django Backend Server**
```bash
python manage.py runserver
```
The backend will now be running at `http://127.0.0.1:8000/`

---

### **3️⃣ Set Up the Frontend (React + Vite)**
#### **Step 1: Navigate to the Frontend Directory**
```bash
cd ../frontend
```
#### **Step 2: Install Frontend Dependencies**
```bash
npm install
```
#### **Step 3: Start the React Development Server**
```bash
npm run dev
```
The frontend will now be running at `http://localhost:5173/`

---

### **4️⃣ Configure Environment Variables**
Create a `.env` file in both `backend/` and `frontend/` with the following values:

#### **Backend (`backend/.env`)**
```
MAPBOX_API_KEY=your_mapbox_api_key_here
DATABASE_URL=your_postgres_database_url
```

#### **Frontend (`frontend/.env`)**
```
VITE_MAPBOX_API_KEY=your_mapbox_api_key_here
```

---

## 📡 API Endpoints

### **1️⃣ Create a Trip**
`POST /api/trip/`
#### **Request Body:**
```json
{
  "current_location": "Abuja, Nigeria",
  "pickup_location": "Kano, Nigeria",
  "dropoff_location": "Lagos, Nigeria"
}
```
#### **Response:**
```json
{
  "trip": { "id": "12345", "distance": "250 miles", "estimated_time": "5 hours" },
  "route_info": { "geometry": {"type": "LineString", "coordinates": [...] } }
}
```

---

### **2️⃣ Get All Trips**
`GET /api/trips/`
#### **Response:**
```json
[ { "id": "12345", "distance": "250 miles", "estimated_time": "5 hours" } ]
```

---

### **3️⃣ Get Trip Details**
`GET /api/trips/{trip_id}/`
#### **Response:**
```json
{
  "trip": { "id": "12345", "distance": "250 miles", "estimated_time": "5 hours" },
  "logs": [ { "date": "2025-03-17", "driving_hours": 10 } ]
}
```

---

### **4️⃣ API Documentation**
- **Swagger UI:** [`http://127.0.0.1:8000/api/docs/`](http://127.0.0.1:8000/api/docs/)
- **ReDoc UI:** [`http://127.0.0.1:8000/api/redoc/`](http://127.0.0.1:8000/api/redoc/)

---

## ✨ Credits
Developed by Attahiru Kamba

---

## 📜 License
MIT License © 2025 Trip Management System

