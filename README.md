# 🏢 Workforce Hub - Enterprise HRMS & Real-Time Collaboration Suite

Workforce Hub is a premium, enterprise-grade Employee Management System (EMS) and Human Resource Management System (HRMS). It combines core HR administrative functions (headcount, payroll, attendance, leave management) with a live collaboration suite featuring real-time WebSockets chat, group rooms, and low-latency peer-to-peer WebRTC voice and video calling.

---

## 🚀 Key Features

### 1. 👥 Employee & User Management
* **Active Employee Profiles**: Full-fledged CRUD capabilities with avatar uploads, contact cards, and position assignments.
* **Access Control & Approvals**: Role-based access control (Super Admin, HR/Admin staff, Employee) with a dedicated signup review queue.
* **Auto-Profile Synchronization**: Automatic generation of corresponding employee profiles upon Django user creation (via commands or signup).

### 2. 💬 Live Collaboration Suite
* **Real-time Organization Chat**: Direct messaging and group channels powered by secure WebSocket handlers.
* **Rich Interactions**: File attachments, inline image previews, interactive emoji reactions, and live unread message counters.
* **WebRTC Voice & Video Calling**: Fully integrated peer-to-peer calling using Google STUN signaling relays. Supports real-time local/remote track binding and active call timers.

### 3. 🏢 Organization & Departments
* **Department Hub**: Create, edit, and delete departments to organize headcount and track coverage metrics.
* **Dynamic Interactive Org Chart**: Interactive canvas using React zoom-pan-pinch to visualize company hierarchy from Executive Board to staff.

### 4. 📅 Attendance & Time Clock
* **Real-time Check In/Out**: Live clocking widget for employees to track daily work logs.
* **Admin Overview**: Operational notes, daily present/late/leave distribution graphs, and detailed audit tables.

### 5. ✉️ Leave & Approval Queue
* **Leave Application**: Easy balance checks and application submission.
* **Manager Review**: Instant review dialogs that update employee balances upon approval or rejection.

---

## 🛠️ Technology Stack

### Frontend (`employee-management-frontend`)
* **Core**: React 18, TypeScript, Vite.
* **Styling & UI**: Vanilla CSS Design Tokens, Tailwind CSS, Lucide Icons.
* **Animations**: Framer Motion.
* **Real-Time & Media**: HTML5 WebRTC API, WebSockets.

### Backend (`employee-management-backend`)
* **Core**: Django 4.x, Django REST Framework (DRF).
* **Asynchronous Signalling**: Django Channels, Daphne ASGI Server.
* **Database**: SQL / SQLite.

---

## 📦 Getting Started & Setup

### Prerequisites
* **Python 3.10+**
* **Node.js 18+**
* **npm** or **yarn**

---

### 1. Backend Setup (`employee-management-backend`)

1. **Navigate to backend folder**:
   ```bash
   cd employee-management-backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create an administrator account**:
   * *Note: Creating a superuser automatically triggers the signal handler to configure their "Administration" department profile.*
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the ASGI development server**:
   ```bash
   daphne -b 127.0.0.1 -p 8000 core.asgi:application
   ```
   *The backend will now be active at `http://127.0.0.1:8000/`.*

---

### 2. Frontend Setup (`employee-management-frontend`)

1. **Navigate to frontend folder**:
   ```bash
   cd ../employee-management-frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Verify / Set environment variables**:
   Create a `.env` file in the frontend root:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173/` in your browser.*

---

## 🧑‍💻 Development Workflow & Verification

* **Production Builds**: Build the frontend bundle with validation checks:
  ```bash
  npm run build
  ```
* **Production Run**: Preview production output locally:
  ```bash
  npm run preview
  ```

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
