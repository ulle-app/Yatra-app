# 🚀 Yatra Deployment Guide

Follow these simple steps to get your **Yatra** app live on the internet! 

## Step 1: Push Code to GitHub
Ensure all your current changes are saved and pushed to your GitHub repository.

## Step 2: Deploy Backend (Render.com)
1.  Log in to [Render.com](https://render.com).
2.  Click **New +** and select **Blueprint**.
3.  Connect your GitHub repository.
4.  Render will automatically find the `render.yaml` file and configure everything:
    - **Service Name**: `yatra-backend-server`
    - **Runtime**: Node
    - **Port**: 5050
5.  When prompted for environment variables, enter:
    - `MONGODB_URI`: Your MongoDB connection string.
6.  Click **Apply**. Wait for the build to finish.
7.  **Copy your Render URL** (e.g., `https://yatra-backend-server.onrender.com`).

## Step 3: Link Backend to Frontend
Now, tell the frontend where to find the server. Run this command in your local terminal:

```bash
./deploy-sync.sh
```

**When prompted:**
- Paste your **Render URL**.
- The script will automatically update `client/vercel.json` and re-deploy your app to Vercel.

## Step 4: Verification
1.  Go to [https://temple-yatra.vercel.app](https://temple-yatra.vercel.app).
2.  Check if the temples load! 

---

### 💡 Troubleshooting
- **CORS Error**: I have already updated the server to allow `temple-yatra.vercel.app`.
- **Database Error**: Ensure your MongoDB Atlas allows traffic from all IPs (`0.0.0.0/0`), as Render's server IPs change frequently.
