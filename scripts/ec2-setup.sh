#!/bin/bash

# This script should be run on the EC2 instance to set up the API server
# Usage: ./ec2-setup.sh <github_repo_url> <branch_name>

set -e

# Check arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 <github_repo_url> <branch_name>"
  echo "Example: $0 https://github.com/yourusername/africani.git aws_deployment"
  exit 1
fi

REPO_URL=$1
BRANCH_NAME=$2

# Update system
echo "Updating system packages..."
sudo yum update -y

# Install Node.js
echo "Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
echo "Installing Git..."
sudo yum install -y git

# Install PM2 for process management
echo "Installing PM2..."
sudo npm install -g pm2

# Install PostgreSQL client (for database operations)
echo "Installing PostgreSQL client..."
sudo yum install -y postgresql15

# Create app directory
echo "Creating application directory..."
mkdir -p ~/africani
cd ~/africani

# Clone the repository
echo "Cloning repository from $REPO_URL..."
git clone $REPO_URL .
git checkout $BRANCH_NAME

# Install dependencies
echo "Installing dependencies..."
npm install

# Create production environment file
echo "Creating .env.production file..."
cat > .env.production << EOL
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1

# Database Configuration
RDS_HOSTNAME=YOUR_RDS_ENDPOINT
RDS_PORT=5432
RDS_DB_NAME=africani
RDS_USERNAME=africani_admin
RDS_PASSWORD=YOUR_DB_PASSWORD

# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_CLIENT_ID

# S3 Configuration
NEXT_PUBLIC_S3_BUCKET_MEDIA=africani-media
NEXT_PUBLIC_S3_BUCKET_UPLOADS=africani-uploads

# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
EOL

echo "Please edit .env.production with your actual configuration values"

# Build the application
echo "Building the application..."
npm run build

# Set up PM2 to start the application
echo "Setting up PM2..."
pm2 start npm --name "africani-api" -- start
pm2 save
pm2 startup

# Install NGINX
echo "Installing NGINX..."
sudo amazon-linux-extras install nginx1 -y

# Configure NGINX
echo "Configuring NGINX..."
cat > /tmp/africani.conf << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

sudo mv /tmp/africani.conf /etc/nginx/conf.d/africani.conf

# Start NGINX
echo "Starting NGINX..."
sudo systemctl enable nginx
sudo systemctl start nginx

echo "EC2 setup completed!"
echo "Next steps:"
echo "1. Update .env.production with your actual configuration values"
echo "2. Configure SSL with Let's Encrypt"
echo "3. Set up your domain to point to this server" 