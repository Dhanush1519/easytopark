# Easy To Park 🚗

Easy To Park is a premium peer-to-peer parking network that connects drivers with unused parking spaces. It allows homeowners or commercial space owners to rent out their empty parking spots, and provides drivers with a seamless way to find, book, and manage parking in real-time.

---

## 🌟 Key Features

### 👤 Driver (User) Experience
* **Real-time Search & Discovery:** Find available parking spots nearby instantly.
* **Instant Booking:** Secure spots for hourly, daily, or monthly durations.
* **Live Dashboard:** Monitor active and upcoming bookings with real-time updates.
* **In-App Communication:** Chat directly with spot owners.
* **Emergency Support:** Dedicated emergency assistance capabilities.

### 🏠 Parking Host (Owner) Experience
* **List Spaces:** Add new parking spots with photos, pricing, and availability.
* **Approval System:** Review and approve/reject booking requests.
* **Revenue Tracking:** Track daily, monthly, and overall earnings in a visual dashboard.
* **Slot Management:** Toggle slot status (Available, Full, Pending) instantly.

### 🛡️ Administrator Control Panel
* **Platform Overview:** High-level metrics on total revenue, active bookings, and system health.
* **User & Owner Management:** Suspend or unblock accounts, verify owners.
* **Listing Moderation:** Review and approve pending parking spots before they go live.
* **Dispute Resolution:** Cancel active bookings if necessary.

---

## 🛠️ Technology Stack

* **Frontend Framework:** React 18
* **Build Tool:** Vite
* **Routing:** React Router v6
* **Styling:** Custom Vanilla CSS (with CSS Variables & Modules)
* **Icons:** Lucide React
* **Backend & Database:** Supabase (PostgreSQL)
* **Authentication:** Supabase Auth
* **Realtime Sync:** Supabase Realtime Channels

---

## 📂 Project Structure (Pin-to-Pin)

```text
easy-to-park/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── EmergencyButton.jsx # Global emergency action
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   └── ParkingCard.jsx     # Card component for spots
│   │
│   ├── lib/                # Configuration and utilities
│   │   └── supabaseClient.js   # Supabase connection setup
│   │
│   ├── pages/              # Application Routes
│   │   ├── AddParkingPage.jsx   # Form wizard for new listings
│   │   ├── AdminDashboard.jsx   # Super admin control panel
│   │   ├── HomePage.jsx         # Main feed for logged-in users
│   │   ├── LandingPage.jsx      # Public marketing page
│   │   ├── LoginPage.jsx        # User authentication
│   │   ├── OwnerDashboard.jsx   # Host management interface
│   │   ├── ParkingDetailsPage.jsx # Detailed view of a specific spot
│   │   ├── SignupPage.jsx       # Account creation (User/Owner)
│   │   └── UserDashboard.jsx    # Driver interface and bookings
│   │
│   ├── App.jsx             # Main routing configuration
│   ├── index.css           # Global design system & tokens
│   └── main.jsx            # React entry point
│
├── .env                    # Environment variables (Supabase Keys)
├── .gitignore              # Git ignore rules
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
└── vite.config.js          # Vite bundler configuration
```

---

## 🔄 System Architecture & Pipeline

### 1. Data Pipeline
The application uses **Supabase** as a Backend-as-a-Service (BaaS). 
* **Frontend requests** are made directly from React components using the `@supabase/supabase-js` client.
* **Realtime Sync:** The dashboards (`AdminDashboard`, `OwnerDashboard`, `UserDashboard`) establish WebSocket connections (`supabase.channel`) to listen for database changes on tables like `bookings` and `parking_spots`. This ensures UI consistency across all devices without manual refreshing.

### 2. Database Schema (Core Tables)
* `profiles`: Stores user data (`id`, `full_name`, `phone`, `role`, `status`). Linked to Supabase Auth.
* `parking_spots`: Stores listing data (`id`, `owner_id`, `name`, `location`, `price`, `status`, `images`).
* `bookings`: Maps users to spots (`id`, `user_id`, `spot_id`, `start_time`, `end_time`, `amount`, `status`).

---

## 🚀 Working Procedure & Flows

### 1. Authentication Flow
1. User lands on `LandingPage.jsx` and clicks "Get Started".
2. Directed to `SignupPage.jsx` where they select a role: **Driver** or **Parking Host**.
3. Upon registration, a record is created in Supabase Auth and a trigger inserts their profile into the `profiles` table.
4. User logs in via `LoginPage.jsx` and is routed to their respective dashboard based on their `role`.

### 2. Spot Creation Flow (Owner)
1. Owner navigates to the "Add New Slot" tab in `OwnerDashboard.jsx`.
2. Completes a multi-step wizard (`AddParkingWizard`) capturing details: location, size, pricing, and images.
3. Images are uploaded to Supabase Storage bucket (`parking-images`).
4. Data is saved to `parking_spots` table with a default status of 'Pending' (waiting for Admin) or 'Available'.

### 3. Booking Pipeline (User)
1. Driver searches for spots on `UserDashboard.jsx` or `HomePage.jsx`.
2. Selects a spot to view `ParkingDetailsPage.jsx`.
3. Confirms duration and clicks "Book Now".
4. A new record is inserted into the `bookings` table with status 'Pending'.
5. **Realtime Trigger:** The Owner sees the pending request immediately on their dashboard.

### 4. Approval & Management Pipeline
1. **Owner Approval:** Owner accepts the booking. The booking status changes to 'Confirmed'. The spot status automatically updates to 'Full'.
2. **Admin Oversight:** The Admin monitors all active transactions and platform revenue in `AdminDashboard.jsx`. Admins have override privileges to suspend problematic accounts or remove fraudulent listings.

---

## 💻 Setup & Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dhanush1519/easytopark.git
   cd easytopark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.
