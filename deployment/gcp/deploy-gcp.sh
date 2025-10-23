#!/bin/bash

# Google Cloud Platform Deployment Script for Vaishnavi Printers
# This script deploys the application to Google Cloud Run

set -e

# Configuration
PROJECT_ID="vaishnavi-printers"  # Change this to your GCP project ID
REGION="asia-south1"  # Mumbai region
BACKEND_SERVICE="vaishnavi-backend"
FRONTEND_SERVICE="vaishnavi-frontend"
REGISTRY="gcr.io"

echo "🚀 Starting Google Cloud Deployment for Vaishnavi Printers..."

# Step 1: Check gcloud CLI
echo "📝 Step 1: Checking Google Cloud CLI..."
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not installed. Install it:"
    echo "   curl https://sdk.cloud.google.com | bash"
    echo "   exec -l $SHELL"
    echo "   gcloud init"
    exit 1
fi

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "Please login to Google Cloud..."
    gcloud auth login
fi

echo "✅ Google Cloud CLI configured"

# Step 2: Set project
echo "📦 Step 2: Setting up project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    cloudresourcemanager.googleapis.com

echo "✅ Project and APIs configured"

# Step 3: Configure Docker for GCR
echo "🔐 Step 3: Configuring Docker authentication..."
gcloud auth configure-docker
echo "✅ Docker configured for GCR"

# Step 4: Build and push backend
echo "🏗️  Step 4: Building and pushing backend..."
cd ../backend

gcloud builds submit \
    --tag $REGISTRY/$PROJECT_ID/$BACKEND_SERVICE:latest \
    --dockerfile ../deployment/Dockerfile.backend \
    .

echo "✅ Backend image pushed"

# Step 5: Build and push frontend
echo "🎨 Step 5: Building and pushing frontend..."
cd ../frontend

gcloud builds submit \
    --tag $REGISTRY/$PROJECT_ID/$FRONTEND_SERVICE:latest \
    --dockerfile ../deployment/Dockerfile.frontend \
    .

echo "✅ Frontend image pushed"

# Step 6: Deploy backend to Cloud Run
echo "🚀 Step 6: Deploying backend to Cloud Run..."
gcloud run deploy $BACKEND_SERVICE \
    --image $REGISTRY/$PROJECT_ID/$BACKEND_SERVICE:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8001 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 1 \
    --max-instances 10 \
    --set-env-vars ENVIRONMENT=production,DB_NAME=vaishnavi_printers

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --platform managed --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"

# Step 7: Deploy frontend to Cloud Run
echo "🌐 Step 7: Deploying frontend to Cloud Run..."
gcloud run deploy $FRONTEND_SERVICE \
    --image $REGISTRY/$PROJECT_ID/$FRONTEND_SERVICE:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 80 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 1 \
    --max-instances 5 \
    --set-env-vars REACT_APP_BACKEND_URL=$BACKEND_URL

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --platform managed --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed: $FRONTEND_URL"

# Step 8: Configure custom domain (Optional)
echo "🌐 Step 8: Custom Domain Setup..."
echo "   To map custom domain, run:"
echo "   gcloud run domain-mappings create --service $FRONTEND_SERVICE --domain vaishnaviprinters.com --region $REGION"

# Summary
echo ""
echo "═══════════════════════════════════════"
echo "🎉 Google Cloud Deployment Successful!"
echo "═══════════════════════════════════════"
echo ""
echo "📋 Deployment Details:"
echo "   Project ID: $PROJECT_ID"
echo "   Region: $REGION"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "📊 Monitor your deployment:"
echo "   Cloud Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo ""
echo "📝 Next Steps:"
echo "   1. Map custom domain (vaishnaviprinters.com)"
echo "   2. Configure MongoDB Atlas connection"
echo "   3. Update environment variables"
echo "   4. Set up Cloud CDN for better performance"
echo ""
echo "💡 Useful Commands:"
echo "   View logs: gcloud run services logs read $BACKEND_SERVICE --region $REGION"
echo "   Update service: gcloud run deploy $BACKEND_SERVICE --image $REGISTRY/$PROJECT_ID/$BACKEND_SERVICE:latest --region $REGION"
echo "   Delete service: gcloud run services delete $BACKEND_SERVICE --region $REGION"
echo ""