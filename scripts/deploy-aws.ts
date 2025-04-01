import {
  AmplifyClient,
  CreateAppCommand,
  CreateBranchCommand,
  StartJobCommand,
} from "@aws-sdk/client-amplify";
import {
  EC2Client,
  RunInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  CreateDBInstanceCommand,
  CreateDBSubnetGroupCommand,
} from "@aws-sdk/client-rds";
import {
  CognitoIdentityProviderClient,
  CreateUserPoolCommand,
  CreateUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load configuration
const config = JSON.parse(
  readFileSync(resolve(__dirname, "../aws-config.json"), "utf-8")
);

// Initialize AWS clients
const amplifyClient = new AmplifyClient({ region: config.aws.region });
const ec2Client = new EC2Client({ region: config.aws.region });
const rdsClient = new RDSClient({ region: config.aws.region });
const cognitoClient = new CognitoIdentityProviderClient({
  region: config.aws.region,
});

async function setupAmplify() {
  console.log("Setting up AWS Amplify...");
  try {
    // Create Amplify app
    const createAppResponse = await amplifyClient.send(
      new CreateAppCommand({
        name: config.app.name,
        platform: "WEB",
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
        stage: "PRODUCTION",
      })
    );

    // Start build
    await amplifyClient.send(
      new StartJobCommand({
        appId,
        branchName: config.amplify.branch,
        jobType: "RELEASE",
      })
    );

    console.log("Amplify setup completed successfully");
    return appId;
  } catch (error) {
    console.error("Error setting up Amplify:", error);
    throw error;
  }
}

async function setupEC2() {
  console.log("Setting up EC2 instance...");
  try {
    // Create security group
    const createSgResponse = await ec2Client.send(
      new CreateSecurityGroupCommand({
        GroupName: config.ec2.vpc.securityGroup.name,
        Description: config.ec2.vpc.securityGroup.description,
      })
    );

    const sgId = createSgResponse.GroupId;
    console.log(`Created security group with ID: ${sgId}`);

    // Configure security group rules
    for (const rule of config.ec2.vpc.securityGroup.rules.inbound) {
      await ec2Client.send(
        new AuthorizeSecurityGroupIngressCommand({
          GroupId: sgId,
          IpProtocol: rule.protocol,
          FromPort: rule.fromPort,
          ToPort: rule.toPort,
          CidrIp: rule.cidrIp,
        })
      );
    }

    // Launch EC2 instance
    const launchResponse = await ec2Client.send(
      new RunInstancesCommand({
        ImageId: config.ec2.instance.ami,
        InstanceType: config.ec2.instance.type,
        MinCount: 1,
        MaxCount: 1,
        SecurityGroupIds: [sgId],
        KeyName: config.ec2.instance.keyName,
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: Object.entries(config.ec2.instance.tags).map(([Key, Value]) => ({
              Key,
              Value: Value as string,
            })),
          },
        ],
      })
    );

    const instanceId = launchResponse.Instances?.[0].InstanceId;
    console.log(`Launched EC2 instance with ID: ${instanceId}`);
    return instanceId;
  } catch (error) {
    console.error("Error setting up EC2:", error);
    throw error;
  }
}

async function setupRDS() {
  console.log("Setting up RDS instance...");
  try {
    // Create DB subnet group
    await rdsClient.send(
      new CreateDBSubnetGroupCommand({
        DBSubnetGroupName: config.rds.subnet.name,
        DBSubnetGroupDescription: "Subnet group for Africani RDS instance",
        SubnetIds: [config.rds.subnet.cidrBlock],
      })
    );

    // Create RDS instance
    const createDbResponse = await rdsClient.send(
      new CreateDBInstanceCommand({
        DBInstanceIdentifier: config.rds.instance.identifier,
        Engine: config.rds.instance.engine,
        EngineVersion: config.rds.instance.engineVersion,
        DBInstanceClass: config.rds.instance.instanceClass,
        AllocatedStorage: config.rds.instance.allocatedStorage,
        MaxAllocatedStorage: config.rds.instance.maxAllocatedStorage,
        PubliclyAccessible: config.rds.instance.publiclyAccessible,
        MultiAZ: config.rds.instance.multiAZ,
        DBName: config.rds.instance.dbName,
        Port: config.rds.instance.port,
        MasterUsername: config.rds.instance.username,
        MasterUserPassword: process.env.DB_PASSWORD, // Should be set as environment variable
        DeletionProtection: config.rds.instance.deletionProtection,
        Tags: Object.entries(config.rds.instance.tags).map(([Key, Value]) => ({
          Key,
          Value: Value as string,
        })),
      })
    );

    const dbEndpoint = createDbResponse.DBInstance?.Endpoint?.Address;
    console.log(`Created RDS instance with endpoint: ${dbEndpoint}`);
    return dbEndpoint;
  } catch (error) {
    console.error("Error setting up RDS:", error);
    throw error;
  }
}

async function setupCognito() {
  console.log("Setting up Cognito...");
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
    console.error("Error setting up Cognito:", error);
    throw error;
  }
}

async function main() {
  try {
    // Ensure required environment variables are set
    if (!process.env.DB_PASSWORD) {
      throw new Error("DB_PASSWORD environment variable must be set");
    }

    console.log("Starting AWS deployment...");

    // Deploy all services in parallel
    const [amplifyAppId, ec2InstanceId, rdsEndpoint, cognitoIds] =
      await Promise.all([
        setupAmplify(),
        setupEC2(),
        setupRDS(),
        setupCognito(),
      ]);

    console.log("\nDeployment completed successfully!");
    console.log("=================================");
    console.log(`Amplify App ID: ${amplifyAppId}`);
    console.log(`EC2 Instance ID: ${ec2InstanceId}`);
    console.log(`RDS Endpoint: ${rdsEndpoint}`);
    console.log(`Cognito User Pool ID: ${cognitoIds.userPoolId}`);
    console.log(`Cognito Client ID: ${cognitoIds.clientId}`);
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main(); 