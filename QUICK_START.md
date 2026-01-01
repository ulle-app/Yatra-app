# Temple-Yatra: Quick Start & Developer Guide

## Quick Overview

**Temple-Yatra** is a React + Node.js web application that helps users plan temple visits across India with:
- Live crowd prediction algorithms
- Trip planning and management
- Visit tracking with gamification
- Favorites/bookmarks system
- In-app notification center

**Latest Release:** v2.0.0 (Jan 15, 2024)
**Status:** Production Ready

---

## 📋 Project Structure

```
templeRun/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/          # Route pages (Home, Plan, SavedPlans, Visits, etc.)
│   │   ├── components/     # Reusable components
│   │   │   ├── ui/        # Radix UI components (button, card, dialog, etc.)
│   │   │   ├── Header.jsx
│   │   │   ├── TempleCard.jsx
│   │   │   └── Toaster.jsx
│   │   ├── store/         # Zustand stores (auth, temples, plans, favorites, visits, notifications)
│   │   ├── hooks/         # Custom React hooks (useToast)
│   │   ├── lib/           # Utilities (formatDate, getCrowdColor, cn)
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── server/                  # Node.js/Express backend
│   ├── index.js            # All API routes and business logic (900+ lines)
│   ├── templeData.js       # Temple seed data
│   ├── package.json
│   └── .env.example
│
├── temples_images/         # Temple image assets
├── DEPLOYMENT_GUIDE.md     # Complete deployment & testing guide
├── CHANGELOG.md            # Version history and changes
└── QUICK_START.md          # This file
```

---

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js 16+
- npm or yarn
- Git
- MongoDB Atlas account (or use in-memory mode)

### 1. Clone & Setup

```bash
cd /Users/anandulle/Work/templeRun

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

**Backend (.env):**
```bash
cd /Users/anandulle/Work/templeRun/server

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/temple-yatra
JWT_SECRET=your-super-secret-key-change-this
PORT=5000
NODE_ENV=development
EOF
```

**Frontend (vite.config.js):**
- Already configured to proxy `/api` to `http://localhost:5050`
- Vercel deployment uses production backend URL

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd /Users/anandulle/Work/templeRun/server
npm start
# Should see: "Server running on port 5000"
# Database status in console
```

**Terminal 2 - Frontend:**
```bash
cd /Users/anandulle/Work/templeRun/client
npm run dev
# Should see: "Local: http://localhost:5173"
# Open in browser and start developing
```

### 4. Test Data

**Create Test Account:**
1. Open http://localhost:5173
2. Click "Sign Up"
3. Register with test data:
   - Name: Test User
   - Email: test@example.com
   - Password: password123

**Test Features:**
1. Go to "Plan Trip"
2. Add temples
3. Save plan → View in "My Plans"
4. Add favorites
5. Log visits
6. Check notifications

---

## 🏗️ Architecture Overview

### Frontend Architecture

**State Management (Zustand Stores):**
- `useAuthStore` - User authentication & session
- `useTempleStore` - Temple data & search/filtering
- `usePlanStore` - Trip planning
- `useSavedPlansStore` - Saved plans management
- `useFavoritesStore` - User favorites
- `useVisitsStore` - Visit history & statistics
- `useNotificationStore` - User notifications
- `useFestivalStore` - Festival calendar

**Component Structure:**
- Pages are route-based (`pages/Home.jsx`, `pages/Plan.jsx`, etc.)
- Components are reusable UI building blocks
- UI components from Radix UI + custom styling with Tailwind

**Styling:**
- Tailwind CSS for utility-first styling
- CSS variables for theming
- Responsive design (mobile-first)
- Dark mode support (future)

### Backend Architecture

**Technology Stack:**
- Node.js + Express for HTTP server
- MongoDB for persistent storage (or in-memory fallback)
- JWT for authentication
- Mongoose for database modeling

**API Design:**
- REST endpoints with standard HTTP methods
- JWT bearer token authentication
- JSON request/response format
- Proper HTTP status codes
- Error handling middleware

**Data Models:**
- User (with embedded visitHistory, notifications, savedPlans, favoriteTemples)
- Temple (20+ temples with detailed information)
- Festival (50+ festivals with crowd multipliers)

---

## 📚 Key Features Guide

### 1. Saved Plans Management
**Files:**
- Frontend: `client/src/pages/SavedPlans.jsx`, `client/src/store/useStore.js`
- Backend: `server/index.js` (routes: /api/plans)

**How It Works:**
1. User creates trip in plan page
2. Clicks "Save Plan"
3. Plan saved to `user.savedPlans` array in database
4. User can view in "My Plans" page
5. Click to load back into planner or delete

### 2. Favorites System
**Files:**
- Frontend: `client/src/components/TempleCard.jsx`, `client/src/pages/Home.jsx`
- Backend: `server/index.js` (routes: /api/favorites)

**How It Works:**
1. Click heart icon on temple card
2. Heart fills red and temple added to favorites
3. "Favorites" filter button shows only favorites
4. Favorites count in header dropdown

### 3. Visit Tracking
**Files:**
- Frontend: `client/src/pages/Visits.jsx`, `client/src/components/TempleCard.jsx`
- Backend: `server/index.js` (routes: /api/visits)

**How It Works:**
1. Click "Mark as Visited" on temple
2. Dialog opens for rating and notes
3. Submit to log visit
4. View history in "My Visits" page
5. Get achievements based on visit count

### 4. Notifications
**Files:**
- Frontend: `client/src/components/Header.jsx`, `client/src/store/useStore.js`
- Backend: `server/index.js` (routes: /api/notifications)

**How It Works:**
1. Click bell icon in header
2. See notification list with unread count
3. Click to mark as read
4. Notifications auto-refresh every 30 seconds
5. Can delete individual notifications

---

## 🔧 Common Development Tasks

### Adding a New Feature

1. **Create Store (if needed)**
   ```javascript
   // In client/src/store/useStore.js
   export const useNewFeatureStore = create((set, get) => ({
     // state
     items: [],
     // actions
     fetchItems: async () => { /* ... */ },
   }))
   ```

2. **Create API Endpoint (if needed)**
   ```javascript
   // In server/index.js
   app.get('/api/new-feature', authMiddleware, async (req, res) => {
     // Your logic here
     res.json({ data: results })
   })
   ```

3. **Create Component**
   ```javascript
   // In client/src/components/NewFeature.jsx
   export function NewFeature() {
     const { items } = useNewFeatureStore()
     return <div>{/* JSX */}</div>
   }
   ```

4. **Add Route (if needed)**
   ```javascript
   // In client/src/App.jsx
   <Route path="/new-feature" element={<NewFeature />} />
   ```

### Testing Endpoints

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass"}'

# Save token from response
export TOKEN="copy-token-from-response"

# Test endpoint
curl -X GET http://localhost:5000/api/visits \
  -H "Authorization: Bearer $TOKEN"
```

### Debugging

**Frontend:**
```javascript
// In components
console.log("State:", store_name.getState())

// In browser DevTools
// Open Network tab to see API calls
// Open Console to see logs and errors
// Use React DevTools browser extension to inspect components
```

**Backend:**
```javascript
// In server/index.js
console.log('DEBUG:', variable_name)

// Check logs in terminal
// Add error logging middleware
```

---

## 🐛 Debugging Tips

### Problem: API calls failing
1. Check if backend is running: `curl http://localhost:5000/api/temples`
2. Check network tab in DevTools (Network → XHR)
3. Look for CORS errors (verify proxy in vite.config.js)
4. Check Authorization header in Network tab

### Problem: Feature not showing
1. Check if component is imported and mounted
2. Verify route is added to App.jsx
3. Check browser console for JavaScript errors
4. Verify store is properly exported and imported

### Problem: Data not persisting
1. Check if using MongoDB or in-memory mode
2. Verify database is accessible
3. Check server logs for save errors
4. Verify schema has the field defined

### Problem: Styling looks wrong
1. Check if Tailwind CSS is building
2. Verify class names are correct (no typos)
3. Check CSS variables in theme config
4. Open DevTools and inspect element classes

---

## 📊 Database Schema

### User Document
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),

  // New in v2.0
  visitHistory: [{
    temple: ObjectId (ref Temple),
    visitDate: Date,
    rating: Number (1-5),
    notes: String,
    crowdLevel: String (low/medium/high),
    checkedInAt: Date
  }],

  notifications: [{
    type: String (trip_reminder/crowd_alert/achievement),
    title: String,
    message: String,
    relatedTrip: ObjectId,
    relatedTemple: ObjectId,
    read: Boolean,
    createdAt: Date
  }],

  // Existing
  savedPlans: [{ name, date, temples: [ObjectId] }],
  favoriteTemples: [ObjectId (ref Temple)],

  createdAt: Date
}
```

---

## 🚀 Performance Tips

### Frontend
- Use React DevTools Profiler to find slow renders
- Check bundle size: `npm run build`
- Lazy load routes with `React.lazy()`
- Use `useCallback` to memoize expensive operations
- Monitor Network tab for slow API calls

### Backend
- Add caching for temples list (doesn't change often)
- Use database indexes on frequently queried fields
- Monitor response times in logs
- Consider pagination for large result sets

---

## 🔐 Security Checklist

- [x] All endpoints have authentication (except public ones)
- [x] Passwords are hashed with bcryptjs
- [x] JWT tokens are used for session management
- [x] Input validation on all endpoints
- [x] CORS properly configured
- [x] Sensitive data not exposed in responses
- [x] Rate limiting should be added (future)
- [x] HTTPS in production (Vercel/Render handle this)

---

## 📈 Monitoring in Production

**What to Monitor:**
- Error rates (5xx errors)
- API response times (target: < 500ms)
- User engagement (daily active users)
- Feature adoption (% using new features)
- Database performance (query times)

**Tools to Setup:**
- Sentry or LogRocket for error tracking
- Vercel Analytics for frontend metrics
- Render logs for backend monitoring
- Google Analytics for user behavior

---

## 🤝 Contributing

### Code Style
- Use consistent naming: camelCase for variables, PascalCase for components
- Keep functions small and focused
- Add comments for complex logic
- Use TypeScript-like JSDoc annotations

### Pull Request Process
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit: `git commit -am "Add new feature"`
3. Push: `git push origin feature/new-feature`
4. Create PR on GitHub
5. Wait for review and approval
6. Merge to main

### Commit Message Format
```
feat: Add new feature name
fix: Fix bug description
docs: Update documentation
refactor: Refactor code without changing behavior
test: Add tests
```

---

## 📞 Support & Troubleshooting

### Getting Help
1. Check DEPLOYMENT_GUIDE.md for common issues
2. Look at browser console for errors
3. Check server logs in terminal
4. Search existing issues on GitHub
5. Ask for help with context and error messages

### Common Questions

**Q: Why is the app slow?**
A: Check Network tab for slow API calls, check DevTools Profiler for slow React renders

**Q: How do I seed test data?**
A: Call `/api/admin/seed` endpoint with POST request (seed data auto-loads)

**Q: How do I reset database?**
A: Call `/api/admin/reset` endpoint with POST request

**Q: Can I use this without MongoDB?**
A: Yes! App has in-memory fallback that doesn't require database

---

## 🎓 Learning Resources

- **React**: https://react.dev
- **Zustand**: https://github.com/pmndrs/zustand
- **Tailwind CSS**: https://tailwindcss.com
- **Radix UI**: https://radix-ui.com
- **Express**: https://expressjs.com
- **MongoDB**: https://docs.mongodb.com

---

## 📝 Version History

- **v2.0.0** (Jan 15, 2024) - Added visits, notifications, favorites
- **v1.0.0** (Jan 1, 2024) - Initial release with temple browse & planning

---

## ✅ Next Steps

1. **Development**
   - Follow "Getting Started" section above
   - Test features locally
   - Read DEPLOYMENT_GUIDE.md for production

2. **Deployment**
   - Follow DEPLOYMENT_GUIDE.md
   - Deploy backend to Render
   - Deploy frontend to Vercel
   - Run full test checklist

3. **Monitoring**
   - Set up error tracking
   - Monitor user engagement
   - Gather feedback
   - Plan next features

---

**Last Updated:** Jan 15, 2024
**Created By:** Claude (AI)
**Maintained By:** Development Team

For questions, check the documentation or create an issue on GitHub!
