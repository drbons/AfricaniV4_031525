import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { COGNITO_CONFIG, cognitoClient } from './config';

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export class AuthService {
  private client: CognitoIdentityProviderClient;

  constructor() {
    this.client = cognitoClient;
  }

  async signUp({ email, password, name }: SignUpParams) {
    try {
      const command = new SignUpCommand({
        ClientId: COGNITO_CONFIG.ClientId,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'name',
            Value: name,
          },
        ],
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async confirmSignUp(email: string, code: string) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: COGNITO_CONFIG.ClientId,
        Username: email,
        ConfirmationCode: code,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  }

  async signIn({ email, password }: SignInParams) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_CONFIG.ClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: COGNITO_CONFIG.ClientId,
        Username: email,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Error initiating forgot password:', error);
      throw error;
    }
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string) {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: COGNITO_CONFIG.ClientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Error confirming forgot password:', error);
      throw error;
    }
  }

  async resendConfirmationCode(email: string) {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: COGNITO_CONFIG.ClientId,
        Username: email,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Error resending confirmation code:', error);
      throw error;
    }
  }

  async signOut(accessToken: string) {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
} 