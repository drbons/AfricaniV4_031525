import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { RDS } from "@aws-sdk/client-rds";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

// AWS Region
export const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

// Cognito Configuration
export const COGNITO_CONFIG = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  Region: AWS_REGION,
};

// Initialize Cognito Client
export const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
});

// Database Configuration
export const DB_CONFIG = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'africani',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  production: {
    host: process.env.RDS_HOSTNAME,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DB_NAME,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
  },
};

// Initialize RDS Client
export const rdsClient = new RDS({
  region: AWS_REGION,
});

// Initialize Secrets Manager Client
export const secretsClient = new SecretsManager({
  region: AWS_REGION,
}); 