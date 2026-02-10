import plivo from 'plivo';

/**
 * Plivo Service - Voice calling integration for Pratham TeleHub
 *
 * Features:
 * - Make outbound calls (telecaller to lead)
 * - Call recording
 * - Call status tracking
 * - Call analytics
 *
 * Pricing: ~₹0.35-0.50/min
 */
class PlivoService {
  constructor() {
    this.authId = process.env.PLIVO_AUTH_ID;
    this.authToken = process.env.PLIVO_AUTH_TOKEN;
    this.fromNumber = process.env.PLIVO_FROM_NUMBER; // Your Plivo number

    if (!this.authId || !this.authToken) {
      console.warn('⚠️  Plivo credentials not configured. Using mock mode.');
      this.mockMode = true;
    } else {
      this.client = new plivo.Client(this.authId, this.authToken);
      this.mockMode = false;
      console.log('✅ Plivo client initialized');
    }
  }

  /**
   * Make a call connecting telecaller to lead
   * @param {string} telecallerNumber - Agent's phone number
   * @param {string} leadNumber - Customer's phone number
   * @param {object} options - Call options (recording, timeout, etc.)
   * @returns {Promise<object>} Call details with call_uuid
   */
  async makeCall(telecallerNumber, leadNumber, options = {}) {
    if (this.mockMode) {
      return this._mockMakeCall(telecallerNumber, leadNumber, options);
    }

    try {
      // Plivo bridge call: calls telecaller first, then connects to lead
      const response = await this.client.calls.create(
        this.fromNumber, // From: Your Plivo number
        telecallerNumber, // To: Telecaller first
        `https://your-domain.com/plivo/answer?lead=${encodeURIComponent(leadNumber)}`, // Answer URL
        {
          answerMethod: 'POST',
          record: options.record !== false, // Record by default
          recordCallbackUrl: options.recordCallbackUrl || `https://your-domain.com/plivo/recording`,
          timeLimit: options.timeLimit || 3600, // 1 hour max
          callbackUrl: options.callbackUrl || `https://your-domain.com/plivo/status`,
          callbackMethod: 'POST'
        }
      );

      return {
        call_uuid: response.callUuid,
        message: response.message,
        status: 'initiated',
        telecaller: telecallerNumber,
        lead: leadNumber,
        provider: 'plivo'
      };
    } catch (error) {
      console.error('Plivo call error:', error);
      throw new Error(`Failed to initiate call: ${error.message}`);
    }
  }

  /**
   * Get call details and status
   * @param {string} callUuid - Plivo call UUID
   * @returns {Promise<object>} Call details
   */
  async getCallDetails(callUuid) {
    if (this.mockMode) {
      return this._mockGetCallDetails(callUuid);
    }

    try {
      const call = await this.client.calls.get(callUuid);

      return {
        call_uuid: call.callUuid,
        from: call.fromNumber,
        to: call.toNumber,
        status: call.callState, // initiated, ringing, answered, completed, failed
        duration: call.billDuration, // Seconds
        start_time: call.initiationTime,
        end_time: call.endTime,
        cost: call.totalRate, // USD
        recording_url: null // Fetched separately
      };
    } catch (error) {
      console.error('Plivo get call error:', error);
      throw new Error(`Failed to get call details: ${error.message}`);
    }
  }

  /**
   * Get call recording URL
   * @param {string} callUuid - Plivo call UUID
   * @returns {Promise<string>} Recording URL
   */
  async getRecording(callUuid) {
    if (this.mockMode) {
      return this._mockGetRecording(callUuid);
    }

    try {
      const recordings = await this.client.recordings.list({
        callUuid: callUuid
      });

      if (recordings && recordings.length > 0) {
        const recording = recordings[0];
        return {
          recording_id: recording.recordingId,
          recording_url: recording.recordingUrl,
          duration: recording.recordingDurationMs / 1000, // Convert to seconds
          format: recording.recordingFormat
        };
      }

      return null;
    } catch (error) {
      console.error('Plivo get recording error:', error);
      return null;
    }
  }

  /**
   * Hang up an ongoing call
   * @param {string} callUuid - Plivo call UUID
   * @returns {Promise<boolean>} Success status
   */
  async hangupCall(callUuid) {
    if (this.mockMode) {
      return this._mockHangupCall(callUuid);
    }

    try {
      await this.client.calls.hangup(callUuid);
      return true;
    } catch (error) {
      console.error('Plivo hangup error:', error);
      return false;
    }
  }

  /**
   * Generate XML for answering call (connects telecaller to lead)
   * @param {string} leadNumber - Lead's phone number
   * @returns {string} Plivo XML
   */
  generateAnswerXML(leadNumber) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>Connecting you to the customer. Please wait.</Speak>
  <Dial>
    <Number>${leadNumber}</Number>
  </Dial>
</Response>`;
  }

  /**
   * Get account balance
   * @returns {Promise<object>} Balance info
   */
  async getBalance() {
    if (this.mockMode) {
      return { balance: 0, currency: 'USD', mock: true };
    }

    try {
      const account = await this.client.account.get(this.authId);
      return {
        balance: parseFloat(account.cashCredits),
        currency: 'USD'
      };
    } catch (error) {
      console.error('Plivo balance error:', error);
      return { balance: 0, currency: 'USD', error: error.message };
    }
  }

  // ============================================
  // MOCK MODE (for testing without credentials)
  // ============================================

  _mockMakeCall(telecallerNumber, leadNumber, options) {
    const callUuid = 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    return {
      call_uuid: callUuid,
      message: 'Mock call initiated',
      status: 'initiated',
      telecaller: telecallerNumber,
      lead: leadNumber,
      provider: 'plivo-mock'
    };
  }

  _mockGetCallDetails(callUuid) {
    return {
      call_uuid: callUuid,
      from: '+919876543210',
      to: '+919123456789',
      status: 'completed',
      duration: 180, // 3 minutes
      start_time: new Date(Date.now() - 180000).toISOString(),
      end_time: new Date().toISOString(),
      cost: 0.50,
      recording_url: 'https://mock-recording.mp3'
    };
  }

  _mockGetRecording(callUuid) {
    return {
      recording_id: 'mock-rec-' + callUuid,
      recording_url: 'https://mock-recording.mp3',
      duration: 180,
      format: 'mp3'
    };
  }

  _mockHangupCall(callUuid) {
    return true;
  }
}

// Singleton instance
let plivoServiceInstance = null;

export function getPlivoService() {
  if (!plivoServiceInstance) {
    plivoServiceInstance = new PlivoService();
  }
  return plivoServiceInstance;
}

export { PlivoService };
