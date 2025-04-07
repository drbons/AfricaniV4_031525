# AWS Deployment Guide for African Business Directory

This document provides a step-by-step guide for deploying the African Business Directory application to AWS.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Node.js and npm installed
4. Git repository with the `aws_deployment` branch

## 1. Preparing Your Local Environment

1. Clone the repository and switch to the `aws_deployment` branch:
   ```bash
   git clone https://github.com/yourusername/africani.git
   cd africani
   git checkout aws_deployment
   ```

2. Install the required AWS dependencies:
   ```bash
   # Make the setup script executable
   chmod +x scripts/setup-aws.sh
   
   # Run the setup script
   ./scripts/setup-aws.sh
   ```

3. Review and update the `aws-config.json` file with your specific configuration:
   - Update the app name
   - Configure security group rules
   - Set up S3 bucket names
   - Update Cognito settings

## 2. Deploying AWS Infrastructure

1. Run the deployment script:
   ```bash
   npm run deploy
   ```

2. After deployment, note the IDs generated for:
   - Amplify App ID
   - Cognito User Pool ID
   - Cognito Client ID

3. Update your `.env.aws` file with these values.

## 3. Setting Up the EC2 Instance

1. Launch an EC2 instance in the AWS Console:
   - Amazon Linux 2023 AMI
   - t2.micro (or larger for production)
   - Select or create a key pair
   - Configure security group to allow SSH (port 22), HTTP (port 80), and HTTPS (port 443)

2. Connect to your EC2 instance:
   ```bash
   ssh -i /path/to/your-key.pem ec2-user@your-ec2-ip
   ```

3. Run the EC2 setup script:
   ```bash
   # Download the setup script
   curl -O https://raw.githubusercontent.com/yourusername/africani/aws_deployment/scripts/ec2-setup.sh
   
   # Make the script executable
   chmod +x ec2-setup.sh
   
   # Run the script with your repository URL and branch
   ./ec2-setup.sh https://github.com/yourusername/africani.git aws_deployment
   ```

4. Update the `.env.production` file with your actual configuration values:
   ```bash
   nano ~/africani/.env.production
   ```

5. Set up SSL with Let's Encrypt:
   ```bash
   sudo amazon-linux-extras install epel
   sudo yum install -y certbot python-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

## 4. Setting Up the RDS Database

1. Create an RDS PostgreSQL instance in the AWS Console:
   - PostgreSQL 15.3
   - db.t3.micro (or larger for production)
   - Set up a secure master password
   - Configure VPC and security groups

2. Update the database configuration in `.env.aws` and `.env.production` with your RDS endpoint and credentials.

3. Migrate data from Firebase to PostgreSQL:
   ```bash
   # On your local machine
   npm run migrate
   ```

## 5. Setting Up S3 Buckets

1. Create S3 buckets in the AWS Console:
   - africani-media (for static media files)
   - africani-uploads (for user uploads)

2. Configure CORS settings to allow access from your domain.

3. Set up appropriate IAM policies to access these buckets.

## 6. Connecting Amplify to Your GitHub Repository

1. In the AWS Amplify Console:
   - Go to the app you created
   - Click "Connect repository"
   - Select GitHub as the provider
   - Authenticate and select your repository
   - Select the `aws_deployment` branch
   - Configure build settings as defined in `aws-config.json`

2. After the first build completes, your frontend will be available at the Amplify domain.

## 7. Set Up Your Custom Domain

1. In the AWS Amplify Console:
   - Go to "Domain management"
   - Add your custom domain
   - Follow the steps to verify domain ownership

2. In your domain registrar:
   - Update the DNS records as instructed by Amplify

3. For the API subdomain (api.yourdomain.com):
   - Create an A record pointing to your EC2 instance's IP address

## 8. Verify Deployment

1. Test the frontend by visiting your domain.
2. Test the API endpoints.
3. Verify that authentication works with Cognito.
4. Check that file uploads work with S3.
5. Verify that database operations work with RDS.

## 9. Monitoring and Maintenance

1. Set up CloudWatch alarms for:
   - EC2 instance health
   - RDS performance
   - API errors

2. Set up automated backups for:
   - RDS database
   - S3 buckets

3. Monitor your application logs:
   ```bash
   # SSH to your EC2 instance
   ssh -i /path/to/your-key.pem ec2-user@your-ec2-ip
   
   # View application logs
   pm2 logs africani-api
   
   # View NGINX logs
   sudo tail -f /var/log/nginx/error.log
   ```

## 10. Rollback Procedure

If you need to roll back to a previous version:

1. For the frontend (Amplify):
   - Go to the Amplify Console
   - Select your app
   - Go to "Hosting environments"
   - Select the branch
   - Click "Redeploy" and select a previous build

2. For the backend (EC2):
   - SSH to your EC2 instance
   - Navigate to your application directory
   - Use Git to checkout a previous version:
     ```bash
     cd ~/africani
     git pull
     git checkout <previous-commit-hash>
     npm install
     npm run build
     pm2 restart africani-api
     ```

3. For the database (RDS):
   - Restore from a snapshot in the AWS Console

## Troubleshooting

- **Amplify Build Failures**: Check the build logs in the Amplify Console for errors.
- **API Connection Issues**: Verify security group settings and NGINX configuration.
- **Database Connection Problems**: Check RDS security groups and credentials.
- **Authentication Issues**: Verify Cognito configuration and client IDs.

## Security Considerations

- Regularly update your EC2 instance:
  ```bash
  sudo yum update -y
  ```
- Implement IP restrictions for sensitive endpoints.
- Use IAM roles and policies with least privilege.
- Enable encryption for RDS and S3.
- Regularly rotate credentials and keys.

## Additional Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NGINX Documentation](https://nginx.org/en/docs/) 