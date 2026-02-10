import axios from 'axios';

/**
 * MSG91 Service - SMS, WhatsApp, OBD, Click-to-Call integration
 *
 * Features:
 * - SMS messaging
 * - WhatsApp messaging
 * - OBD (Outbound Dialing) - automated calls
 * - Click-to-Call - bridge two numbers
 * - IVR support
 *
 * Pricing (India):
 * - SMS: ₹0.15-0.25 per SMS
 * - WhatsApp: ₹0.35 per message
 * - Voice (OBD): ₹0.20-0.30/min
 * - Click-to-Call: ₹0.30-0.40/min
 */
class MSG91Service {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.senderId = process.env.MSG91_SENDER_ID || 'TELEHB'; // 6 chars max
    this.baseUrl = 'https://control.msg91.com/api/v5';
    this.voiceBaseUrl = 'https://control.msg91.com/api';

    if (!this.authKey) {
      console.warn('⚠️  MSG91 credentials not configured. Using mock mode.');
      this.mockMode = true;
    } else {
      this.mockMode = false;
      console.log('✅ MSG91 client initialized');
    }
  }

  // ============================================
  // SMS SERVICES
  // ============================================

  /**
   * Send SMS to a phone number
   * @param {string} to - Phone number (with country code, e.g., 919876543210)
   * @param {string} message - Message text
   * @param {object} options - Additional options
   * @returns {Promise<object>} SMS details
   */
  async sendSMS(to, message, options = {}) {
    if (this.mockMode) {
      return this._mockSendSMS(to, message);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/flow/`,
        {
          sender: options.senderId || this.senderId,
          route: options.route || '4', // 4 = Transactional, 1 = Promotional
          country: options.country || '91',
          sms: [
            {
              message: message,
              to: [to]
            }
          ]
        },
        {
          headers: {
            'authkey': this.authKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message_id: response.data.request_id,
        to: to,
        message: message,
        provider: 'msg91',
        type: 'sms'
      };
    } catch (error) {
      console.error('MSG91 SMS error:', error.response?.data || error.message);
      throw new Error(`Failed to send SMS: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send OTP SMS
   * @param {string} mobile - Phone number
   * @param {string} otp - OTP code
   * @param {string} templateId - MSG91 template ID
   * @returns {Promise<object>} OTP SMS details
   */
  async sendOTP(mobile, otp, templateId) {
    if (this.mockMode) {
      return this._mockSendOTP(mobile, otp);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/otp`,
        {
          template_id: templateId,
          mobile: mobile,
          otp: otp
        },
        {
          headers: {
            'authkey': this.authKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        type: 'otp',
        mobile: mobile,
        provider: 'msg91'
      };
    } catch (error) {
      console.error('MSG91 OTP error:', error.response?.data || error.message);
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }

  // ============================================
  // WHATSAPP SERVICES
  // ============================================

  /**
   * Send WhatsApp message
   * @param {string} to - Phone number (919876543210)
   * @param {string} message - Message text or template name
   * @param {object} options - Template params, media, etc.
   * @returns {Promise<object>} WhatsApp message details
   */
  async sendWhatsApp(to, message, options = {}) {
    if (this.mockMode) {
      return this._mockSendWhatsApp(to, message);
    }

    try {
      const payload = {
        integrated_number: options.waNumber || process.env.MSG91_WA_NUMBER,
        content_type: 'template', // or 'text'
        payload: {
          to: to,
          type: 'template',
          template: {
            name: options.templateName || 'default_template',
            language: {
              code: options.language || 'en'
            },
            components: options.components || []
          }
        }
      };

      const response = await axios.post(
        'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/',
        payload,
        {
          headers: {
            'authkey': this.authKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message_id: response.data.message_id,
        to: to,
        provider: 'msg91',
        type: 'whatsapp'
      };
    } catch (error) {
      console.error('MSG91 WhatsApp error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp: ${error.message}`);
    }
  }

  // ============================================
  // VOICE SERVICES (OBD + Click-to-Call)
  // ============================================

  /**
   * Make OBD (Outbound Dialing) call - automated pre-recorded message
   * @param {string} to - Phone number
   * @param {string} audioUrl - URL of audio file to play
   * @param {object} options - Additional options
   * @returns {Promise<object>} OBD call details
   */
  async makeOBDCall(to, audioUrl, options = {}) {
    if (this.mockMode) {
      return this._mockMakeOBDCall(to, audioUrl);
    }

    try {
      const response = await axios.post(
        `${this.voiceBaseUrl}/makecall.php`,
        {
          authkey: this.authKey,
          contacts: to,
          audio: audioUrl,
          route: options.route || '1' // 1 = Transactional
        }
      );

      return {
        success: true,
        call_id: response.data.request_id,
        to: to,
        audio_url: audioUrl,
        provider: 'msg91',
        type: 'obd'
      };
    } catch (error) {
      console.error('MSG91 OBD error:', error.response?.data || error.message);
      throw new Error(`Failed to make OBD call: ${error.message}`);
    }
  }

  /**
   * Click-to-Call - bridge two phone numbers
   * Calls 'from' first, then connects to 'to'
   * @param {string} from - Telecaller's number
   * @param {string} to - Lead's number
   * @param {object} options - Additional options
   * @returns {Promise<object>} Click-to-Call details
   */
  async makeClickToCall(from, to, options = {}) {
    if (this.mockMode) {
      return this._mockMakeClickToCall(from, to);
    }

    try {
      // MSG91 Click-to-Call uses different API endpoint
      const response = await axios.post(
        `${this.voiceBaseUrl}/makecall.php`,
        {
          authkey: this.authKey,
          receiver: to,
          receiver_dtmf: from,
          route: options.route || '1'
        }
      );

      return {
        success: true,
        call_id: response.data.request_id || 'msg91-' + Date.now(),
        from: from,
        to: to,
        provider: 'msg91',
        type: 'click_to_call'
      };
    } catch (error) {
      console.error('MSG91 Click-to-Call error:', error.response?.data || error.message);
      throw new Error(`Failed to make Click-to-Call: ${error.message}`);
    }
  }

  /**
   * Get call status
   * @param {string} callId - MSG91 call ID
   * @returns {Promise<object>} Call status
   */
  async getCallStatus(callId) {
    if (this.mockMode) {
      return this._mockGetCallStatus(callId);
    }

    try {
      const response = await axios.get(
        `${this.voiceBaseUrl}/call/getstatus.php`,
        {
          params: {
            authkey: this.authKey,
            request_id: callId
          }
        }
      );

      return {
        call_id: callId,
        status: response.data.status,
        duration: response.data.duration,
        provider: 'msg91'
      };
    } catch (error) {
      console.error('MSG91 status error:', error.response?.data || error.message);
      return { call_id: callId, status: 'unknown', error: error.message };
    }
  }

  /**
   * Get account balance
   * @returns {Promise<object>} Balance info
   */
  async getBalance() {
    if (this.mockMode) {
      return { balance: 0, currency: 'INR', mock: true };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/user/getBalance`,
        {
          headers: {
            'authkey': this.authKey
          }
        }
      );

      return {
        balance: parseFloat(response.data.balance),
        currency: 'INR',
        sms_balance: response.data.sms,
        voice_balance: response.data.voice
      };
    } catch (error) {
      console.error('MSG91 balance error:', error.response?.data || error.message);
      return { balance: 0, currency: 'INR', error: error.message };
    }
  }

  // ============================================
  // CAMPAIGN SERVICES
  // ============================================

  /**
   * Send bulk SMS campaign
   * @param {Array<string>} recipients - Array of phone numbers
   * @param {string} message - Message text
   * @param {object} options - Campaign options
   * @returns {Promise<object>} Campaign details
   */
  async sendBulkSMS(recipients, message, options = {}) {
    if (this.mockMode) {
      return this._mockSendBulkSMS(recipients, message);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/flow/`,
        {
          sender: options.senderId || this.senderId,
          route: options.route || '1', // Promotional
          country: '91',
          sms: [
            {
              message: message,
              to: recipients
            }
          ]
        },
        {
          headers: {
            'authkey': this.authKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        campaign_id: response.data.request_id,
        recipients_count: recipients.length,
        message: message,
        provider: 'msg91',
        type: 'bulk_sms'
      };
    } catch (error) {
      console.error('MSG91 bulk SMS error:', error.response?.data || error.message);
      throw new Error(`Failed to send bulk SMS: ${error.message}`);
    }
  }

  /**
   * Send bulk OBD campaign
   * @param {Array<string>} recipients - Array of phone numbers
   * @param {string} audioUrl - Audio file URL
   * @param {object} options - Campaign options
   * @returns {Promise<object>} Campaign details
   */
  async sendBulkOBD(recipients, audioUrl, options = {}) {
    if (this.mockMode) {
      return this._mockSendBulkOBD(recipients, audioUrl);
    }

    try {
      const response = await axios.post(
        `${this.voiceBaseUrl}/makecall.php`,
        {
          authkey: this.authKey,
          contacts: recipients.join(','),
          audio: audioUrl,
          route: options.route || '1'
        }
      );

      return {
        success: true,
        campaign_id: response.data.request_id,
        recipients_count: recipients.length,
        audio_url: audioUrl,
        provider: 'msg91',
        type: 'bulk_obd'
      };
    } catch (error) {
      console.error('MSG91 bulk OBD error:', error.response?.data || error.message);
      throw new Error(`Failed to send bulk OBD: ${error.message}`);
    }
  }

  // ============================================
  // MOCK MODE (for testing without credentials)
  // ============================================

  _mockSendSMS(to, message) {
    return {
      success: true,
      message_id: 'mock-sms-' + Date.now(),
      to: to,
      message: message,
      provider: 'msg91-mock',
      type: 'sms'
    };
  }

  _mockSendOTP(mobile, otp) {
    return {
      success: true,
      type: 'otp',
      mobile: mobile,
      otp: otp,
      provider: 'msg91-mock'
    };
  }

  _mockSendWhatsApp(to, message) {
    return {
      success: true,
      message_id: 'mock-wa-' + Date.now(),
      to: to,
      provider: 'msg91-mock',
      type: 'whatsapp'
    };
  }

  _mockMakeOBDCall(to, audioUrl) {
    return {
      success: true,
      call_id: 'mock-obd-' + Date.now(),
      to: to,
      audio_url: audioUrl,
      provider: 'msg91-mock',
      type: 'obd'
    };
  }

  _mockMakeClickToCall(from, to) {
    return {
      success: true,
      call_id: 'mock-c2c-' + Date.now(),
      from: from,
      to: to,
      provider: 'msg91-mock',
      type: 'click_to_call'
    };
  }

  _mockGetCallStatus(callId) {
    return {
      call_id: callId,
      status: 'completed',
      duration: 120,
      provider: 'msg91-mock'
    };
  }

  _mockSendBulkSMS(recipients, message) {
    return {
      success: true,
      campaign_id: 'mock-bulk-sms-' + Date.now(),
      recipients_count: recipients.length,
      message: message,
      provider: 'msg91-mock',
      type: 'bulk_sms'
    };
  }

  _mockSendBulkOBD(recipients, audioUrl) {
    return {
      success: true,
      campaign_id: 'mock-bulk-obd-' + Date.now(),
      recipients_count: recipients.length,
      audio_url: audioUrl,
      provider: 'msg91-mock',
      type: 'bulk_obd'
    };
  }
}

// Singleton instance
let msg91ServiceInstance = null;

export function getMSG91Service() {
  if (!msg91ServiceInstance) {
    msg91ServiceInstance = new MSG91Service();
  }
  return msg91ServiceInstance;
}

export { MSG91Service };
