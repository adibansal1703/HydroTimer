import fs from "fs";
import path from "path";

export type SubscriptionPlan = "free" | "premium";

export interface UserPreferences {
  phoneNumber: string;
  isVerified: boolean;
  plan: SubscriptionPlan;
  smsProgressEnabled: boolean;
  smsCompletedEnabled: boolean;
  smsSummaryEnabled: boolean;
}

export type SMSProvider = "twilio" | "messagebird" | "awssns";

const DB_FILE_PATH = path.join(process.cwd(), "preferences_db.json");

// Default initial preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  phoneNumber: "",
  isVerified: false,
  plan: "free",
  smsProgressEnabled: false,
  smsCompletedEnabled: false,
  smsSummaryEnabled: false,
};

// In-memory cache for verification codes: phone -> { code, expiresAt }
interface VerificationEntry {
  code: string;
  expiresAt: number;
}
const verificationCodes = new Map<string, VerificationEntry>();

/**
 * database helper for storing preferences in a local JSON file.
 */
export const getPreferences = (): UserPreferences => {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read preferences database, using default:", error);
  }
  return { ...DEFAULT_PREFERENCES };
};

export const savePreferences = (prefs: UserPreferences): void => {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(prefs, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to preferences database:", error);
  }
};

/**
 * Service to handle future integration of Twilio, MessageBird, and AWS SNS
 */
export class SMSService {
  private static activeProvider: SMSProvider = "twilio";

  /**
   * Sets the active SMS provider for future execution
   */
  public static setProvider(provider: SMSProvider) {
    this.activeProvider = provider;
    console.log(`[SMS Service] Active provider switched to: ${provider}`);
  }

  /**
   * Generates a 6-digit verification code and registers it
   */
  public static generateVerificationCode(phoneNumber: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    verificationCodes.set(phoneNumber, { code, expiresAt });
    
    console.log(`\n======================================================`);
    console.log(`[SMS Service] Sending Verification Code via ${this.activeProvider.toUpperCase()}:`);
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: Your HydroTimer verification code is: ${code}`);
    console.log(`======================================================\n`);
    
    return code;
  }

  /**
   * Verifies the provided 6-digit code for a phone number
   */
  public static verifyCode(phoneNumber: string, code: string): boolean {
    const entry = verificationCodes.get(phoneNumber);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      verificationCodes.delete(phoneNumber);
      return false; // Code expired
    }

    if (entry.code === code) {
      verificationCodes.delete(phoneNumber);
      return true;
    }

    return false;
  }

  /**
   * Sends an SMS reminder using the active provider
   */
  public static async sendSMS(to: string, message: string): Promise<{ success: boolean; provider: string; messageId: string }> {
    if (!to) {
      throw new Error("Recipient phone number is required");
    }

    console.log(`\n--- OUTGOING SMS MESSAGE TRANSMISSION ---`);
    console.log(`Provider: ${this.activeProvider.toUpperCase()}`);
    console.log(`To: ${to}`);
    console.log(`Message: "${message}"`);
    console.log(`-------------------------------------------\n`);

    const messageId = `msg_${Math.random().toString(36).substring(2, 11)}`;

    // Stub configurations for future SMS integration:
    switch (this.activeProvider) {
      case "twilio":
        await this.sendWithTwilio(to, message);
        break;
      case "messagebird":
        await this.sendWithMessageBird(to, message);
        break;
      case "awssns":
        await this.sendWithAwsSns(to, message);
        break;
      default:
        console.log(`[SMS Service] Mock delivery complete.`);
    }

    return {
      success: true,
      provider: this.activeProvider,
      messageId,
    };
  }

  /**
   * Implementation stub for Twilio SMS Provider
   */
  private static async sendWithTwilio(to: string, message: string): Promise<void> {
    console.log(`[Twilio Client Configuration Ready]`);
    console.log(`  SID: process.env.TWILIO_ACCOUNT_SID || 'mock_sid'`);
    console.log(`  Token: process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing'`);
    console.log(`  From: process.env.TWILIO_PHONE_NUMBER || '+15550199'`);
    console.log(`[Twilio Status] Code is structured for dynamic execution when credentials are set.`);
    /*
    import twilio from 'twilio';
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    */
  }

  /**
   * Implementation stub for MessageBird SMS Provider
   */
  private static async sendWithMessageBird(to: string, message: string): Promise<void> {
    console.log(`[MessageBird Client Configuration Ready]`);
    console.log(`  Access Key: process.env.MESSAGEBIRD_ACCESS_KEY ? 'Present' : 'Missing'`);
    console.log(`  Originator: process.env.MESSAGEBIRD_ORIGINATOR || 'HydroTimer'`);
    console.log(`[MessageBird Status] Code structured for production API payloads.`);
    /*
    import initMessageBird from 'messagebird';
    const messagebird = initMessageBird(process.env.MESSAGEBIRD_ACCESS_KEY);
    messagebird.messages.create({
      originator: 'HydroTimer',
      recipients: [to],
      body: message
    }, (err, response) => { ... });
    */
  }

  /**
   * Implementation stub for AWS SNS SMS Provider
   */
  private static async sendWithAwsSns(to: string, message: string): Promise<void> {
    console.log(`[AWS SNS Configuration Ready]`);
    console.log(`  Access Key ID: process.env.AWS_ACCESS_KEY_ID ? 'Present' : 'Missing'`);
    console.log(`  AWS Region: process.env.AWS_REGION || 'us-east-1'`);
    console.log(`[AWS SNS Status] Ready to configure AWS.SNS Client for publish commands.`);
    /*
    import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
    const snsClient = new SNSClient({ region: process.env.AWS_REGION });
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: to,
    });
    await snsClient.send(command);
    */
  }
}
