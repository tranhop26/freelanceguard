import { keccak256, stringToBytes } from 'viem';

class CircleClient {
  private appId: string | null = null;
  private kitKey: string | null = null;
  private mockMode = true;
  private currentEmail: string | null = null;

  constructor() {
    this.appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || null;
    this.kitKey = process.env.NEXT_PUBLIC_KIT_KEY || null;

    // Use mock mode if credentials are not fully configured
    if (this.appId && this.kitKey) {
      this.mockMode = false;
      console.log('Circle SDK initialized.');
    } else {
      this.mockMode = true;
      console.warn('⚠️ Circle SDK not fully configured — using mock wallet mode');
    }
  }

  isMockMode() {
    return this.mockMode;
  }

  async signInWithEmail(email: string): Promise<boolean> {
    this.currentEmail = email;
    if (this.mockMode) {
      console.log(`[MOCK] Sending OTP code to ${email}`);
      return true;
    }
    // Real implementation would interface with Circle's user controlled wallet SDK
    return true;
  }

  async verifyOtp(otp: string): Promise<{ walletAddress: string; circleUserId: string }> {
    if (!this.currentEmail) {
      throw new Error('Email not set. Please request OTP first.');
    }

    if (this.mockMode) {
      // Generate a deterministic wallet address and circle user ID from email hash
      const emailHash = keccak256(stringToBytes(this.currentEmail.toLowerCase().trim()));
      const walletAddress = `0x${emailHash.substring(26, 66)}` as `0x${string}`;
      const circleUserId = `usr_${emailHash.substring(2, 18)}`;

      console.log(`[MOCK] Verified OTP. Address: ${walletAddress}, User ID: ${circleUserId}`);
      return { walletAddress, circleUserId };
    }

    throw new Error('Circle SDK keys missing for real authentication flow.');
  }
}

export const circleClient = new CircleClient();
