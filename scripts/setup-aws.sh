#!/bin/bash

# Exit on error
set -e

echo "Setting up AWS deployment environment..."

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
    echo "Then re-run this script."
    exit 1
  fi
fi

# Verify AWS CLI installation
aws --version

# Check if AWS credentials are configured
if [ ! -f ~/.aws/credentials ]; then
  echo "AWS credentials not found. Please configure them now:"
  aws configure
fi

# Install required AWS SDK dependencies
echo "Installing AWS SDK dependencies..."
npm install --save-dev \
  @aws-sdk/client-amplify \
  @aws-sdk/client-ec2 \
  @aws-sdk/client-rds \
  @aws-sdk/client-cognito-identity-provider \
  @aws-sdk/client-s3 \
  @aws-sdk/client-secrets-manager \
  pg \
  dotenv \
  ts-node

# Update package.json scripts
echo "Adding deployment scripts to package.json..."
if command -v jq &> /dev/null; then
  # Use jq if available
  jq '.scripts.deploy = "ts-node scripts/deploy-aws.ts"' package.json > tmp.json && mv tmp.json package.json
  jq '.scripts.migrate = "node scripts/migrate-from-firebase.js"' package.json > tmp.json && mv tmp.json package.json
else
  # Fallback to npm pkg if jq is not available
  npm pkg set scripts.deploy="ts-node scripts/deploy-aws.ts"
  npm pkg set scripts.migrate="node scripts/migrate-from-firebase.js"
fi

# Create .env.aws if it doesn't exist
if [ ! -f .env.aws ]; then
  echo "Creating .env.aws file..."
  cp .env.example .env.aws
  echo "# AWS Configuration" >> .env.aws
  echo "NEXT_PUBLIC_AWS_REGION=us-east-1" >> .env.aws
  echo "# Fill in the rest of the AWS configuration values" >> .env.aws
fi

# Create a deployment script if it doesn't exist
if [ ! -f scripts/deploy-aws.ts ]; then
  echo "Creating AWS deployment script..."
  cat > scripts/deploy-aws.ts << 'EOL'
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  AmplifyClient,
  CreateAppCommand,
  CreateBranchCommand,
  StartJobCommand,
} from '@aws-sdk/client-amplify';
import {
  CognitoIdentityProviderClient,
  CreateUserPoolCommand,
  CreateUserPoolClientCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import dotenv from 'dotenv';

// Load environment variables from .env.aws
dotenv.config({ path: '.env.aws' });

// Load configuration
const config = JSON.parse(
  readFileSync(resolve(__dirname, '../aws-config.json'), 'utf-8')
);

// Initialize AWS clients
const region = process.env.NEXT_PUBLIC_AWS_REGION || config.aws.region;
const amplifyClient = new AmplifyClient({ region });
const cognitoClient = new CognitoIdentityProviderClient({ region });

async function setupAmplify() {
  console.log('Setting up AWS Amplify...');
  try {
    // Create Amplify app
    const createAppResponse = await amplifyClient.send(
      new CreateAppCommand({
        name: config.app.name,
        platform: 'WEB',
        framework: config.amplify.framework,
      })
    );

    const appId = createAppResponse.app?.appId;
    console.log(`Created Amplify app with ID: ${appId}`);

    // Create branch
    await amplifyClient.send(
      new CreateBranchCommand({
        appId,
        branchName: config.amplify.branch,
        framework: config.amplify.framework,
        stage: 'PRODUCTION',
      })
    );

    // Start build
    await amplifyClient.send(
      new StartJobCommand({
        appId,
        branchName: config.amplify.branch,
        jobType: 'RELEASE',
      })
    );

    console.log('Amplify setup completed successfully');
    return appId;
  } catch (error) {
    console.error('Error setting up Amplify:', error);
    throw error;
  }
}

async function setupCognito() {
  console.log('Setting up Cognito...');
  try {
    // Create user pool
    const createPoolResponse = await cognitoClient.send(
      new CreateUserPoolCommand({
        PoolName: config.cognito.userPool.name,
        AutoVerifiedAttributes: config.cognito.userPool.autoVerifiedAttributes,
        Policies: {
          PasswordPolicy: config.cognito.userPool.policies.passwordPolicy,
        },
        Schema: config.cognito.userPool.schema,
      })
    );

    const userPoolId = createPoolResponse.UserPool?.Id;
    console.log(`Created Cognito user pool with ID: ${userPoolId}`);

    // Create user pool client
    const createClientResponse = await cognitoClient.send(
      new CreateUserPoolClientCommand({
        UserPoolId: userPoolId,
        ClientName: config.cognito.client.name,
        GenerateSecret: config.cognito.client.generateSecret,
        RefreshTokenValidity: config.cognito.client.refreshTokenValidity,
        AccessTokenValidity: config.cognito.client.accessTokenValidity,
        IdTokenValidity: config.cognito.client.idTokenValidity,
        AllowedOAuthFlows: config.cognito.client.allowedOAuthFlows,
        AllowedOAuthScopes: config.cognito.client.allowedOAuthScopes,
        CallbackURLs: config.cognito.client.callbackURLs,
        LogoutURLs: config.cognito.client.logoutURLs,
      })
    );

    const clientId = createClientResponse.UserPoolClient?.ClientId;
    console.log(`Created Cognito user pool client with ID: ${clientId}`);
    return { userPoolId, clientId };
  } catch (error) {
    console.error('Error setting up Cognito:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting AWS deployment...');

    // Deploy Amplify and Cognito in parallel
    const [amplifyAppId, cognitoIds] = await Promise.all([
      setupAmplify(),
      setupCognito(),
    ]);

    console.log('\nDeployment completed successfully!');
    console.log('=================================');
    console.log(`Amplify App ID: ${amplifyAppId}`);
    console.log(`Cognito User Pool ID: ${cognitoIds.userPoolId}`);
    console.log(`Cognito Client ID: ${cognitoIds.clientId}`);
    
    console.log('\nNext Steps:');
    console.log('1. Update .env.aws with the Cognito User Pool ID and Client ID');
    console.log('2. Set up an EC2 instance for your backend API');
    console.log('3. Create an RDS PostgreSQL database');
    console.log('4. Run the database migration script with: npm run migrate');
    console.log('5. Configure your domain and SSL certificates');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main();
EOL
fi

echo "AWS setup completed successfully!"
echo "Next steps:"
echo "1. Review aws-config.json and update it with your specific settings"
echo "2. Set up AWS credentials with appropriate permissions"
echo "3. Run 'npm run deploy' to deploy to AWS"
echo "4. After deployment, update .env.aws with the generated IDs"
echo "5. Run 'npm run migrate' to migrate data from Firebase to PostgreSQL" 