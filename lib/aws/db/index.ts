import { Pool } from 'pg';
import { DB_CONFIG } from '../config';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { secretsClient } from '../config';

let pool: Pool | null = null;

export async function getDbPool() {
  if (pool) return pool;

  const isProduction = process.env.NODE_ENV === 'production';
  let config = DB_CONFIG.development;

  if (isProduction) {
    try {
      // Get RDS credentials from Secrets Manager in production
      const secretResponse = await secretsClient.getSecretValue({
        SecretId: process.env.RDS_SECRET_NAME,
      });

      if (secretResponse.SecretString) {
        const secret = JSON.parse(secretResponse.SecretString);
        config = {
          host: secret.host,
          port: parseInt(secret.port),
          database: secret.dbname,
          user: secret.username,
          password: secret.password,
        };
      }
    } catch (error) {
      console.error('Error fetching RDS credentials:', error);
      throw error;
    }
  }

  pool = new Pool({
    ...config,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: isProduction ? {
      rejectUnauthorized: false // Required for RDS
    } : undefined
  });

  // Test the connection
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    client.release();
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    throw error;
  }

  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = await getDbPool();
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

export async function transaction<T>(callback: (client: any) => Promise<T>) {
  const pool = await getDbPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} 