# TempleTrip - Live Crowd Temple Travel Planner

A full-stack web application for planning temple visits across India with real-time crowd predictions based on time, day, historical patterns, and festival calendars.

![TempleTrip](https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&h=400&fit=crop)

## Features

- **20+ Major Indian Temples** - Comprehensive data on popular temples across India
- **Real-time Crowd Predictions** - Algorithmic predictions based on:
  - Time of day patterns
  - Day of week multipliers
  - Festival calendar (50+ major festivals)
  - Temple-specific patterns (pilgrimage vs tourist)
  - Special days (e.g., Tuesdays for Hanuman temples)
- **Trip Planning** - Create and organize your temple visit itinerary
- **Smart Optimization** - Automatically reorder visits by crowd levels
- **User Authentication** - Save plans and preferences with your account
- **Festival Calendar** - Track upcoming festivals and their crowd impact
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Radix-based component library
- **Zustand** - State management
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database (with MongoDB Atlas free tier)
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (free tier available)

## Getting Started

### 1. Clone the Repository

```bash
cd templeRun
```

### 2. Set Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free Tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string

### 3. Configure Backend

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your settings:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/templetrip?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

### 4. Configure Frontend

```bash
cd ../client

# Install dependencies
npm install
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
templeRun/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── Header.jsx
│   │   │   └── TempleCard.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx    # Temple listing
│   │   │   ├── Plan.jsx    # Trip planning
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Festivals.jsx
│   │   ├── store/          # Zustand stores
│   │   ├── lib/            # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
├── server/                 # Express backend
│   ├── index.js           # Main server file with all routes
│   ├── .env.example
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Temples
- `GET /api/temples` - List all temples with crowd predictions
- `GET /api/temples/:id` - Get temple details with hourly forecast
- `GET /api/temples/:id/forecast` - Get hourly crowd forecast

### Plans (Protected)
- `POST /api/plans` - Save a new plan
- `GET /api/plans` - Get user's saved plans
- `DELETE /api/plans/:planId` - Delete a plan

### Favorites (Protected)
- `POST /api/favorites/:templeId` - Add to favorites
- `DELETE /api/favorites/:templeId` - Remove from favorites

### Festivals
- `GET /api/festivals` - Get upcoming festivals

## Crowd Prediction Algorithm

The crowd prediction system uses multiple factors:

### 1. Hourly Patterns
Different patterns for different temple types:
- **General** - Standard temple pattern
- **High Traffic** - Always busy temples (e.g., Tirupati)
- **Pilgrimage** - Religious pilgrimage sites
- **Tourist** - Tourist-focused temples

### 2. Day of Week Multipliers
- Sunday: 1.4x (holiday crowds)
- Monday: 0.85x (quieter)
- Tuesday-Thursday: 0.8-0.85x (weekday lull)
- Friday: 0.95x (picking up)
- Saturday: 1.5x (weekend peak)

### 3. Festival Calendar
50+ Indian festivals tracked with crowd multipliers:
- Diwali: 1.9x
- Ganesh Chaturthi: 1.8x
- Maha Shivaratri: 2.0x
- And more...

### 4. Temple-Specific Factors
- Special days (e.g., Tuesdays for Siddhivinayak: 2x)
- Peak months (e.g., Shravan for Shiva temples)
- Temple type multipliers

## Temples Included

1. Kashi Vishwanath Temple, Varanasi
2. Tirumala Venkateswara Temple, Tirupati
3. Golden Temple (Harmandir Sahib), Amritsar
4. Jagannath Temple, Puri
5. Meenakshi Amman Temple, Madurai
6. Siddhivinayak Temple, Mumbai
7. Somnath Temple, Gujarat
8. Dwarkadhish Temple, Dwarka
9. Brihadeeswarar Temple, Thanjavur
10. Vaishno Devi Temple, Katra
11. Rameshwaram Temple, Tamil Nadu
12. Kedarnath Temple, Uttarakhand
13. Badrinath Temple, Uttarakhand
14. Akshardham Temple, Delhi
15. Shirdi Sai Baba Temple, Maharashtra
16. Lingaraja Temple, Bhubaneswar
17. Mahabodhi Temple, Bodh Gaya
18. Kamakhya Temple, Guwahati
19. Ramanathaswamy Temple, Rameswaram
20. Padmanabhaswamy Temple, Thiruvananthapuram

## Environment Variables

### Server (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT tokens | `random-string-here` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |

## Development

### Adding a New Temple

Edit `server/index.js` and add to the `templesData` array in the `seedTemples` function:

```javascript
{
  name: "Temple Name",
  location: "City, State",
  state: "State",
  description: "Description...",
  imageUrl: "https://...",
  rating: 4.5,
  timings: "6:00 AM - 9:00 PM",
  darshanTime: "1 hour",
  bestTimeToVisit: "Morning",
  lat: 0.0,
  lng: 0.0,
  deity: "Lord Shiva",
  significance: "...",
  crowdPattern: { type: "general" }, // general, high_traffic, pilgrimage, tourist
  specialDays: [{ day: "Monday", multiplier: 1.5 }],
  peakMonths: [6, 7] // 0-indexed months
}
```

### Adding a Festival

Edit the `festivals` object in `server/index.js`:

```javascript
'2025-MM-DD': { name: 'Festival Name', multiplier: 1.5 }
```

## Deployment

### Backend (e.g., Railway, Render, Fly.io)

1. Set environment variables
2. Deploy with `npm start`

### Frontend (e.g., Vercel, Netlify)

1. Set `VITE_API_URL` if using separate backend
2. Build: `npm run build`
3. Deploy `dist` folder

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Temple images from [Unsplash](https://unsplash.com)
- Icons from [Lucide](https://lucide.dev)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com)
