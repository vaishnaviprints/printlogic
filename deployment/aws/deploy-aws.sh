#!/bin/bash

# AWS Deployment Script for Vaishnavi Printers
# This script deploys the application to AWS ECS with Fargate

set -e

# Configuration
REGION="ap-south-1"  # Mumbai region
CLUSTER_NAME="vaishnavi-production"
BACKEND_SERVICE="backend-service"
FRONTEND_SERVICE="frontend-service"
ECR_BACKEND_REPO="vaishnavi-backend"
ECR_FRONTEND_REPO="vaishnavi-frontend"
STACK_NAME="vaishnavi-printers-stack"

echo "🚀 Starting AWS Deployment for Vaishnavi Printers..."

# Step 1: Configure AWS CLI
echo "📝 Step 1: Checking AWS CLI configuration..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed. Please install it first:"
    echo "   curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    echo "   unzip awscliv2.zip"
    echo "   sudo ./aws/install"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account ID: $ACCOUNT_ID"

# Step 2: Create ECR Repositories
echo "📦 Step 2: Creating ECR repositories..."
aws ecr describe-repositories --repository-names $ECR_BACKEND_REPO --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $ECR_BACKEND_REPO --region $REGION

aws ecr describe-repositories --repository-names $ECR_FRONTEND_REPO --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $ECR_FRONTEND_REPO --region $REGION

echo "✅ ECR repositories ready"

# Step 3: Login to ECR
echo "🔐 Step 3: Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
echo "✅ ECR login successful"

# Step 4: Build Docker images
echo "🏗️  Step 4: Building Docker images..."

# Build backend
echo "Building backend..."
cd ../backend
docker build -t $ECR_BACKEND_REPO -f ../deployment/Dockerfile.backend .
docker tag $ECR_BACKEND_REPO:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_BACKEND_REPO:latest

# Build frontend
echo "Building frontend..."
cd ../frontend
docker build -t $ECR_FRONTEND_REPO -f ../deployment/Dockerfile.frontend .
docker tag $ECR_FRONTEND_REPO:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest

echo "✅ Docker images built successfully"

# Step 5: Push images to ECR
echo "📤 Step 5: Pushing images to ECR..."
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_BACKEND_REPO:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest
echo "✅ Images pushed to ECR"

# Step 6: Deploy CloudFormation stack
echo "☁️  Step 6: Deploying CloudFormation stack..."
cd ../deployment/aws

aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        EnvironmentName=production \
        DomainName=vaishnaviprinters.com \
    --capabilities CAPABILITY_IAM \
    --region $REGION

echo "✅ CloudFormation stack deployed"

# Step 7: Get Load Balancer DNS
echo "🌐 Step 7: Getting Load Balancer DNS..."
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text \
    --region $REGION)

echo "✅ Load Balancer DNS: $ALB_DNS"

# Step 8: Wait for services to be stable
echo "⏳ Step 8: Waiting for services to become healthy..."
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $BACKEND_SERVICE $FRONTEND_SERVICE \
    --region $REGION

echo "✅ Services are healthy and running"

# Summary
echo ""
echo "═══════════════════════════════════════"
echo "🎉 Deployment Successful!"
echo "═══════════════════════════════════════"
echo ""
echo "📋 Deployment Details:"
echo "   Region: $REGION"
echo "   Cluster: $CLUSTER_NAME"
echo "   Load Balancer: $ALB_DNS"
echo ""
echo "🌐 Access your application at:"
echo "   http://$ALB_DNS"
echo ""
echo "📊 Monitor your deployment:"
echo "   AWS Console: https://console.aws.amazon.com/ecs/home?region=$REGION#/clusters/$CLUSTER_NAME"
echo ""
echo "📝 Next Steps:"
echo "   1. Point your domain (vaishnaviprinters.com) to: $ALB_DNS"
echo "   2. Configure SSL certificate in AWS Certificate Manager"
echo "   3. Update CORS_ORIGINS in backend environment variables"
echo "   4. Set up MongoDB Atlas connection string"
echo ""
echo "💡 Useful Commands:"
echo "   View logs: aws logs tail /ecs/production-backend --follow"
echo "   Update service: aws ecs update-service --cluster $CLUSTER_NAME --service $BACKEND_SERVICE --force-new-deployment"
echo "   Delete stack: aws cloudformation delete-stack --stack-name $STACK_NAME"
echo ""
