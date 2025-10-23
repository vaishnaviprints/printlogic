#!/bin/bash

# Azure Deployment Script for Vaishnavi Printers
# This script deploys the application to Azure Container Instances and App Service

set -e

# Configuration
RESOURCE_GROUP="vaishnavi-printers-rg"
LOCATION="centralindia"  # Central India region
ACR_NAME="vaishnaviprinters"  # Must be globally unique
APP_SERVICE_PLAN="vaishnavi-plan"
BACKEND_APP="vaishnavi-backend"
FRONTEND_APP="vaishnavi-frontend"

echo "🚀 Starting Azure Deployment for Vaishnavi Printers..."

# Step 1: Check Azure CLI
echo "📝 Step 1: Checking Azure CLI..."
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not installed. Install it:"
    echo "   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

# Login to Azure
if ! az account show &> /dev/null; then
    echo "Please login to Azure..."
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "✅ Azure Subscription: $SUBSCRIPTION_ID"

# Step 2: Create Resource Group
echo "📦 Step 2: Creating Resource Group..."
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output none

echo "✅ Resource Group created: $RESOURCE_GROUP"

# Step 3: Create Azure Container Registry
echo "🗄️  Step 3: Creating Azure Container Registry..."
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true \
    --location $LOCATION \
    --output none || echo "ACR already exists"

# Get ACR credentials
ACR_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

echo "✅ ACR created: $ACR_SERVER"

# Step 4: Build and push images
echo "🏗️  Step 4: Building and pushing Docker images..."

# Login to ACR
az acr login --name $ACR_NAME

# Build backend
echo "Building backend..."
cd ../backend
az acr build \
    --registry $ACR_NAME \
    --image vaishnavi-backend:latest \
    --file ../deployment/Dockerfile.backend \
    .

# Build frontend
echo "Building frontend..."
cd ../frontend
az acr build \
    --registry $ACR_NAME \
    --image vaishnavi-frontend:latest \
    --file ../deployment/Dockerfile.frontend \
    .

echo "✅ Images pushed to ACR"

# Step 5: Create App Service Plan
echo "📋 Step 5: Creating App Service Plan..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --is-linux \
    --sku B1 \
    --location $LOCATION \
    --output none || echo "App Service Plan already exists"

echo "✅ App Service Plan created"

# Step 6: Create Backend Web App
echo "🔧 Step 6: Creating Backend Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $BACKEND_APP \
    --deployment-container-image-name $ACR_SERVER/vaishnavi-backend:latest \
    --output none || echo "Backend app already exists"

# Configure backend app
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP \
    --settings \
        WEBSITES_PORT=8001 \
        ENVIRONMENT=production \
        DB_NAME=vaishnavi_printers \
    --output none

# Configure container registry
az webapp config container set \
    --name $BACKEND_APP \
    --resource-group $RESOURCE_GROUP \
    --docker-custom-image-name $ACR_SERVER/vaishnavi-backend:latest \
    --docker-registry-server-url https://$ACR_SERVER \
    --docker-registry-server-user $ACR_USERNAME \
    --docker-registry-server-password $ACR_PASSWORD \
    --output none

BACKEND_URL=$(az webapp show --resource-group $RESOURCE_GROUP --name $BACKEND_APP --query defaultHostName -o tsv)
echo "✅ Backend deployed: https://$BACKEND_URL"

# Step 7: Create Frontend Web App
echo "🎨 Step 7: Creating Frontend Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $FRONTEND_APP \
    --deployment-container-image-name $ACR_SERVER/vaishnavi-frontend:latest \
    --output none || echo "Frontend app already exists"

# Configure frontend app
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $FRONTEND_APP \
    --settings \
        WEBSITES_PORT=80 \
        REACT_APP_BACKEND_URL=https://$BACKEND_URL \
    --output none

# Configure container registry
az webapp config container set \
    --name $FRONTEND_APP \
    --resource-group $RESOURCE_GROUP \
    --docker-custom-image-name $ACR_SERVER/vaishnavi-frontend:latest \
    --docker-registry-server-url https://$ACR_SERVER \
    --docker-registry-server-user $ACR_USERNAME \
    --docker-registry-server-password $ACR_PASSWORD \
    --output none

FRONTEND_URL=$(az webapp show --resource-group $RESOURCE_GROUP --name $FRONTEND_APP --query defaultHostName -o tsv)
echo "✅ Frontend deployed: https://$FRONTEND_URL"

# Step 8: Enable HTTPS
echo "🔒 Step 8: Enabling HTTPS..."
az webapp update \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP \
    --https-only true \
    --output none

az webapp update \
    --resource-group $RESOURCE_GROUP \
    --name $FRONTEND_APP \
    --https-only true \
    --output none

echo "✅ HTTPS enabled"

# Step 9: Configure custom domain (Optional)
echo "🌐 Step 9: Custom Domain Configuration..."
echo "   To add custom domain, run:"
echo "   az webapp config hostname add --webapp-name $FRONTEND_APP --resource-group $RESOURCE_GROUP --hostname vaishnaviprinters.com"

# Summary
echo ""
echo "═══════════════════════════════════════"
echo "🎉 Azure Deployment Successful!"
echo "═══════════════════════════════════════"
echo ""
echo "📋 Deployment Details:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Container Registry: $ACR_SERVER"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: https://$FRONTEND_URL"
echo "   Backend:  https://$BACKEND_URL"
echo ""
echo "📊 Monitor your deployment:"
echo "   Azure Portal: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure custom domain in Azure Portal"
echo "   2. Set up SSL certificate"
echo "   3. Configure MongoDB Atlas connection"
echo "   4. Update environment variables in App Settings"
echo ""
echo "💡 Useful Commands:"
echo "   View logs: az webapp log tail --name $BACKEND_APP --resource-group $RESOURCE_GROUP"
echo "   Restart app: az webapp restart --name $BACKEND_APP --resource-group $RESOURCE_GROUP"
echo "   Delete resources: az group delete --name $RESOURCE_GROUP --yes"
echo ""
