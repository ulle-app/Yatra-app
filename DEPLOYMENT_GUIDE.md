# Temple-Yatra: Deployment & Testing Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Testing Checklist](#testing-checklist)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Pre-Deployment Checklist

### Backend Server
- [ ] All 12 new endpoints added:
  - [ ] `GET /api/favorites`
  - [ ] `POST /api/visits`, `GET /api/visits`, `PUT /api/visits/:visitId`, `DELETE /api/visits/:visitId`
  - [ ] `GET /api/notifications`, `PUT /api/notifications/:notificationId/read`, `PUT /api/notifications/read-all`, `DELETE /api/notifications/:notificationId`
- [ ] User schema updated with:
  - [ ] `visitHistory` field with proper structure
  - [ ] `notifications` field with proper structure
- [ ] In-memory mode supports new fields
- [ ] MongoDB mode supports new fields
- [ ] All endpoints tested locally
- [ ] Environment variables configured

### Frontend Client
- [ ] All new pages created:
  - [ ] `SavedPlans.jsx`
  - [ ] `Visits.jsx`
- [ ] All new stores added:
  - [ ] `useSavedPlansStore`
  - [ ] `useFavoritesStore`
  - [ ] `useVisitsStore`
  - [ ] `useNotificationStore`
- [ ] All components updated:
  - [ ] `Header.jsx` - notification bell + badges
  - [ ] `TempleCard.jsx` - favorites heart + visit dialog
  - [ ] `Home.jsx` - favorites filter
- [ ] Toast system implemented:
  - [ ] `toast.jsx` component
  - [ ] `useToast.js` hook
  - [ ] `Toaster.jsx` component
- [ ] All routes added to `App.jsx`
- [ ] No console errors in development build
- [ ] Build runs successfully: `npm run build`

---

## Backend Deployment (Render)

### Step 1: Prepare Backend
```bash
cd /Users/anandulle/Work/templeRun/server

# Verify server runs locally
node index.js

# Check if it listens on correct port
# Should see: "Server running on port 5000"
```

### Step 2: Test All Endpoints Locally

**Test Authentication:**
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Copy the token from response
export TOKEN="your_token_here"
```

**Test Favorites:**
```bash
# Get favorites
curl -X GET http://localhost:5000/api/favorites \
  -H "Authorization: Bearer $TOKEN"

# Should return: []
```

**Test Visits:**
```bash
# Get visits
curl -X GET http://localhost:5000/api/visits \
  -H "Authorization: Bearer $TOKEN"

# Should return: []

# Create visit (replace templeId with actual ID)
curl -X POST http://localhost:5000/api/visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "templeId": "507f1f77bcf86cd799439011",
    "visitDate": "2024-01-15",
    "rating": 5,
    "notes": "Beautiful temple"
  }'
```

**Test Notifications:**
```bash
# Get notifications
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# Should return: []
```

### Step 3: Deploy to Render

1. **Commit changes to git:**
   ```bash
   git add -A
   git commit -m "Add visit tracking and notifications (Week 2)"
   git push origin main
   ```

2. **In Render Dashboard:**
   - Navigate to existing service: `yatra-backend-server`
   - **Manual Deployment:**
     - Click "Deploy" button
     - Wait for build to complete (~2-3 minutes)
   - **Monitor Build:**
     - Check build logs for errors
     - Should see "Server running on port 5000" in logs

3. **Verify Production:**
   ```bash
   # Test endpoint with production URL
   curl -X GET https://yatra-backend-vf3v.onrender.com/api/temples

   # Should return temple array
   ```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
```bash
cd /Users/anandulle/Work/templeRun/client

# Install any new dependencies
npm install

# Build locally to test
npm run build

# Should complete without errors
```

### Step 2: Verify Environment

Check `client/vite.config.js` has correct API proxy:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5050',
    changeOrigin: true
  }
}
```

### Step 3: Deploy to Vercel

1. **Commit frontend changes:**
   ```bash
   git add -A
   git commit -m "Add Week 2 features (visits, notifications, favorites)"
   git push origin main
   ```

2. **Vercel Auto-Deploy:**
   - Vercel watches for pushes to main branch
   - Automatically triggers build and deployment
   - Build takes ~1-2 minutes
   - Check Vercel dashboard for status

3. **Verify Frontend Loads:**
   - Visit https://temple-yatra.vercel.app
   - Should load homepage
   - Check browser console for errors
   - Check if favicon loads (no 404s)

---

## Testing Checklist

### Phase 1: Authentication (5 minutes)
- [ ] Can register new account
- [ ] Can login with existing account
- [ ] Token persists after refresh
- [ ] Can logout
- [ ] Redirects to login when accessing protected routes

### Phase 2: Saved Plans (10 minutes)
- [ ] Navigate to "Plan Trip"
- [ ] Add 3+ temples to plan
- [ ] Fill in trip name and date
- [ ] Click "Save Plan" button
- [ ] Navigate to "My Plans"
- [ ] See saved plan in list
- [ ] Click "Edit" to load plan into planner
- [ ] Verify temples are loaded
- [ ] Delete a plan
- [ ] Verify it's removed from list

### Phase 3: Favorites (8 minutes)
- [ ] On home page, click heart on temple
- [ ] Heart should fill red
- [ ] Click heart again to unfavorite
- [ ] Heart should empty
- [ ] Click "Favorites" button to filter
- [ ] Should show only favorite temples
- [ ] Click "Favorites" again to show all
- [ ] Check user dropdown shows favorite count

### Phase 4: Visit Tracking (12 minutes)
- [ ] On temple card, click "Mark as Visited"
- [ ] Dialog opens with rating and notes
- [ ] Select 5-star rating
- [ ] Add notes
- [ ] Click "Mark Visited"
- [ ] Button changes to show "Visited"
- [ ] Navigate to "My Visits"
- [ ] See visit in timeline
- [ ] Check statistics updated (total visits, states)
- [ ] Verify achievements unlocked (should see badges)
- [ ] Sort by date
- [ ] Sort by rating
- [ ] Delete a visit
- [ ] Verify removed from list

### Phase 5: Notifications (10 minutes)
- [ ] Check header notification bell
- [ ] Bell shows unread count
- [ ] Click bell to open dropdown
- [ ] Should see notification list
- [ ] Click "Mark as read" on notification
- [ ] Notification appearance changes
- [ ] Click "Mark all as read"
- [ ] All notifications marked
- [ ] Delete a notification
- [ ] Count badge updates
- [ ] Wait 30 seconds (auto-refresh)
- [ ] Check if notifications updated

### Phase 6: Mobile Responsiveness (8 minutes)
- [ ] Test on mobile device (or DevTools)
- [ ] All buttons are tappable (44px minimum)
- [ ] Text is readable without zooming
- [ ] Dialogs resize properly
- [ ] Navigation menu collapses on mobile
- [ ] Temple cards stack properly
- [ ] Notification dropdown fits screen

### Phase 7: Edge Cases (10 minutes)
- [ ] Log out and back in (session persistence)
- [ ] Open multiple tabs and test synchronization
- [ ] Browser back button works correctly
- [ ] Refresh page on each feature (data persists)
- [ ] Test with network throttling (slow 3G)
- [ ] Test with no network (offline)

### Phase 8: Performance (5 minutes)
- [ ] Page loads in < 3 seconds
- [ ] Interactions respond immediately
- [ ] No lag when scrolling temple list
- [ ] Toast notifications appear instantly
- [ ] Navigation between pages is smooth

### Phase 9: Data Validation (5 minutes)
- [ ] Can't save empty plan
- [ ] Rating must be 1-5
- [ ] Visit date is required
- [ ] Max 500 chars for notes
- [ ] Can't add duplicate temples to plan
- [ ] Empty states show proper messages

---

## Post-Deployment Verification

### Check Production Logs

**Render Backend:**
1. Go to Render Dashboard
2. Select `yatra-backend-server`
3. Click "Logs" tab
4. Check for errors in last 50 lines
5. Should see: "✅ Database connected" or "⚠️ Running in In-Memory Mode"

**Vercel Frontend:**
1. Go to Vercel Dashboard
2. Select temple-yatra project
3. Click "Deployments" tab
4. Check latest deployment status
5. Click deployment to view build logs
6. Should see: "✅ Build completed successfully"

### Verify API Connectivity

In frontend console (DevTools), run:
```javascript
// Check if API is reachable
fetch('https://yatra-backend-vf3v.onrender.com/api/temples')
  .then(r => r.json())
  .then(data => console.log('✅ API working, temples:', data.length))
  .catch(e => console.error('❌ API error:', e))

// Check notifications endpoint
fetch('https://yatra-backend-vf3v.onrender.com/api/notifications', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
  .then(r => r.json())
  .then(data => console.log('✅ Notifications endpoint working'))
  .catch(e => console.error('❌ Error:', e))
```

### Database Check

**For MongoDB:**
1. Go to MongoDB Atlas
2. Select temple-yatra cluster
3. Click "Collections"
4. Select "users" collection
5. Find user created during testing
6. Verify `visitHistory` and `notifications` arrays exist

**For In-Memory:**
- Backend will show data until server restarts
- No persistence between restarts

---

## Monitoring & Troubleshooting

### Common Issues & Solutions

#### Issue: 404 on `/api/notifications`
**Solution:**
- [ ] Verify backend has latest code deployed
- [ ] Check server logs for errors
- [ ] Restart server on Render (Manual Deploy)
- [ ] Verify endpoint spelling in frontend code

#### Issue: Favorites not persisting
**Solution:**
- [ ] Check if user is authenticated
- [ ] Verify token is sent in request header
- [ ] Check browser DevTools Network tab for 401 errors
- [ ] Re-login if session expired

#### Issue: Toast notifications not showing
**Solution:**
- [ ] Check browser console for JavaScript errors
- [ ] Verify Toaster component is mounted in App.jsx
- [ ] Clear browser cache and reload
- [ ] Check if notifications are being dispatched (add console.log)

#### Issue: Visit dialog won't close
**Solution:**
- [ ] Check if required fields filled
- [ ] Look for validation errors in console
- [ ] Try refreshing page
- [ ] Check backend logs for error response

#### Issue: Slow page loads
**Solution:**
- [ ] Check Network tab in DevTools
- [ ] Identify slow requests
- [ ] Check if backend is responding (might be cold start on Render)
- [ ] Wait 30 seconds for Render to warm up
- [ ] Check frontend bundle size: `npm run build`

#### Issue: Notifications endpoint returns 401
**Solution:**
- [ ] Token might be expired
- [ ] Token not sent in request
- [ ] Token format incorrect (should be "Bearer TOKEN")
- [ ] Backend middleware issue

---

## Performance Optimization Tips

### Backend
- Cache frequently accessed data (temples list)
- Use database indexes on frequently queried fields
- Implement pagination for large result sets
- Add request rate limiting

### Frontend
- Lazy load pages with React.lazy()
- Implement image optimization
- Minimize bundle size: `npm run build --stats`
- Use React DevTools Profiler to identify slow renders

---

## Rollback Plan

If something goes wrong:

**Frontend (Vercel):**
1. Go to Deployments tab
2. Find previous working deployment
3. Click the "..." menu
4. Select "Redeploy"

**Backend (Render):**
1. Go to service
2. Click Manual Deploy
3. This re-deploys last committed version
4. Or force-push to git revert commit

---

## Monitoring Checklist

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor API response times
- [ ] Track user engagement metrics
- [ ] Monitor database performance
- [ ] Set up alerts for 5xx errors
- [ ] Monitor Render cold starts
- [ ] Check Vercel deployment frequency

---

## Success Metrics (First 7 Days)

- [ ] 0 critical errors in production logs
- [ ] < 500ms API response time (p95)
- [ ] > 95% test checklist passing
- [ ] All new features functional
- [ ] No regressions from previous features

---

## Next Steps After Successful Deployment

1. **Monitor User Feedback**
   - Check for feature requests
   - Monitor support tickets
   - Track usage patterns

2. **Analytics**
   - Track feature adoption rates
   - Monitor user retention
   - Identify bottlenecks

3. **Improvements**
   - Optimize based on usage data
   - Add analytics events for key actions
   - Improve performance based on metrics

4. **Future Features (Week 3+)**
   - Personalized recommendations
   - Multi-day trip planning
   - PWA offline support
   - Weather integration

---

## Support & Escalation

**If deployment fails:**
1. Check Render/Vercel logs
2. Verify environment variables
3. Check GitHub commits
4. Review recent code changes
5. Try manual redeployment

**If production breaks:**
1. Check error tracking service
2. Review recent deployments
3. Identify the breaking change
4. Rollback to last known good version
5. Fix issue locally and redeploy

---

## Deployed URLs

**Production:**
- Frontend: https://temple-yatra.vercel.app
- Backend API: https://yatra-backend-vf3v.onrender.com

**Local Development:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

**Last Updated:** 2024-01-15
**Version:** 2.0 (Week 1 + Week 2 Complete)
