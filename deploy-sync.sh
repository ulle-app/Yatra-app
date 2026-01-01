#!/bin/bash

# This script links your Render backend to your Vercel frontend

echo "🚀 Yatra Deployment Sync"
echo "-----------------------"

read -p "Enter your Render Service URL (e.g., https://yatra-api.onrender.com): " RENDER_URL

if [[ -z "$RENDER_URL" ]]; then
    echo "❌ Error: URL cannot be empty."
    exit 1
fi

# Remove trailing slash if present
RENDER_URL="${RENDER_URL%/}"

# Update vercel.json
cat <<EOF > client/vercel.json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "$RENDER_URL/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
EOF

echo "✅ Updated client/vercel.json with $RENDER_URL"
echo "🔄 Triggering Vercel deployment..."

cd client && vercel --prod --yes

echo "-----------------------"
echo "🎉 All Done! Your app is now linked."
echo "Frontend: https://temple-yatra.vercel.app"
echo "Backend: $RENDER_URL"
