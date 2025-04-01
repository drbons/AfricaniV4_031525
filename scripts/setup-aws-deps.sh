#!/bin/bash

# Exit on error
set -e

echo "Installing AWS dependencies..."

# Install AWS SDK dependencies
npm install @aws-sdk/client-amplify \
  @aws-sdk/client-ec2 \
  @aws-sdk/client-rds \
  @aws-sdk/client-cognito-identity-provider \
  @aws-sdk/client-secrets-manager

# Install AWS CLI if not already installed
if ! command -v aws &> /dev/null; then
  echo "Installing AWS CLI..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
    sudo installer -pkg AWSCLIV2.pkg -target /
    rm AWSCLIV2.pkg
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
  elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    echo "Please install AWS CLI manually from: https://aws.amazon.com/cli/"
    echo "After installation, run 'aws --version' to verify"
    exit 1
  fi
fi

# Verify AWS CLI installation
aws --version

# Configure AWS credentials if not already configured
if [ ! -f ~/.aws/credentials ]; then
  echo "AWS credentials not found. Please configure them now:"
  aws configure
fi

# Install TypeScript if not already installed
if ! command -v tsc &> /dev/null; then
  echo "Installing TypeScript..."
  npm install -g typescript
fi

# Create tsconfig.json if it doesn't exist
if [ ! -f tsconfig.json ]; then
  echo "Creating tsconfig.json..."
  echo '{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "resolveJsonModule": true
  },
  "include": ["scripts/**/*"],
  "exclude": ["node_modules"]
}' > tsconfig.json
fi

# Add deployment scripts to package.json
echo "Updating package.json scripts..."
npm pkg set scripts.deploy="ts-node scripts/deploy-aws.ts"
npm pkg set scripts.setup-aws="bash scripts/setup-aws-deps.sh"

echo "Installing ts-node for running TypeScript files directly..."
npm install --save-dev ts-node

echo "AWS dependencies setup completed successfully!"
echo "You can now run 'npm run deploy' to deploy to AWS"
echo "Make sure to set the DB_PASSWORD environment variable before deploying" 