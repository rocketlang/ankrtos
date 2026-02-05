/**
 * WhatsApp Bot Integration for CORALS
 * Daily horoscope delivery, muhurat queries, and customer support
 * Using WhatsApp Business API / Twilio
 */

import { ZodiacSign } from './daily-horoscope-engine';

export interface WhatsAppUser {
  phoneNumber: string;
  name?: string;
  zodiacSign?: ZodiacSign;
  subscribed: boolean;
  preferredDeliveryTime: string; // HH:MM format
  language: 'en' | 'hi';
  subscriptionType: 'free' | 'premium';
  subscriptionExpiry?: Date;
}

export interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  messageType: 'text' | 'template' | 'interactive';
  timestamp: Date;
}

export interface BotResponse {
  message: string;
  type: 'text' | 'button' | 'list';
  buttons?: Button[];
  listItems?: ListItem[];
}

interface Button {
  id: string;
  title: string;
}

interface ListItem {
  id: string;
  title: string;
  description: string;
}

/**
 * WhatsApp Bot Handler
 */
export class WhatsAppBot {
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioWhatsAppNumber: string;

  constructor(config: {
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioWhatsAppNumber: string;
  }) {
    this.twilioAccountSid = config.twilioAccountSid;
    this.twilioAuthToken = config.twilioAuthToken;
    this.twilioWhatsAppNumber = config.twilioWhatsAppNumber;
  }

  /**
   * Process incoming WhatsApp message
   */
  async processMessage(message: WhatsAppMessage): Promise<BotResponse> {
    const userMessage = message.body.toLowerCase().trim();

    // Command routing
    if (userMessage === 'hi' || userMessage === 'hello' || userMessage === 'start') {
      return this.sendWelcomeMessage();
    }

    if (userMessage === 'subscribe' || userMessage === 'daily horoscope') {
      return this.sendSubscriptionOptions();
    }

    if (userMessage === 'unsubscribe' || userMessage === 'stop') {
      return this.handleUnsubscribe(message.from);
    }

    if (userMessage === 'muhurat' || userMessage === 'auspicious time') {
      return this.sendMuhuratMenu();
    }

    if (userMessage === 'help' || userMessage === 'menu') {
      return this.sendMainMenu();
    }

    if (userMessage.startsWith('horoscope')) {
      return this.sendHoroscopeMenu();
    }

    if (userMessage === 'premium' || userMessage === 'upgrade') {
      return this.sendPremiumOptions();
    }

    // Zodiac sign detection
    const zodiacSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
                         'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    const detectedSign = zodiacSigns.find(sign => userMessage.includes(sign));

    if (detectedSign) {
      return this.sendDailyHoroscope(detectedSign as ZodiacSign);
    }

    // Default response
    return this.sendMainMenu();
  }

  /**
   * Send welcome message to new users
   */
  private sendWelcomeMessage(): BotResponse {
    return {
      message: `🕉️ *Namaste! Welcome to CORALS* 🙏

I'm your personal astrology assistant! I can help you with:

✨ Daily Horoscope (Free)
🗓️ Muhurat Finder (Auspicious Timings)
💍 Kundli Matching
🔮 Ask Astrologer
🛍️ Temple Store

*Reply with:*
• Your zodiac sign for today's horoscope
• "Subscribe" for daily horoscope
• "Muhurat" for auspicious timings
• "Menu" to see all options

_Powered by CORALS - Your Spiritual Companion_`,
      type: 'button',
      buttons: [
        { id: 'subscribe', title: 'Subscribe Daily' },
        { id: 'muhurat', title: 'Find Muhurat' },
        { id: 'menu', title: 'Main Menu' },
      ],
    };
  }

  /**
   * Send main menu
   */
  private sendMainMenu(): BotResponse {
    return {
      message: `📱 *CORALS Main Menu*

Choose what you'd like to explore:`,
      type: 'list',
      listItems: [
        {
          id: 'daily_horoscope',
          title: '✨ Daily Horoscope',
          description: 'Get your personalized daily predictions',
        },
        {
          id: 'muhurat_finder',
          title: '🗓️ Muhurat Finder',
          description: 'Find auspicious timings for events',
        },
        {
          id: 'kundli_matching',
          title: '💑 Kundli Matching',
          description: 'Check compatibility with partner',
        },
        {
          id: 'ask_astrologer',
          title: '💬 Ask Astrologer',
          description: 'Get expert guidance (Premium)',
        },
        {
          id: 'temple_store',
          title: '🛍️ Temple Store',
          description: 'Browse gemstones and spiritual items',
        },
        {
          id: 'premium',
          title: '💎 Go Premium',
          description: 'Unlock all features',
        },
      ],
    };
  }

  /**
   * Send subscription options
   */
  private sendSubscriptionOptions(): BotResponse {
    return {
      message: `📅 *Subscribe to Daily Horoscope*

Get personalized horoscope every morning at 8 AM!

*Choose your plan:*

🆓 *FREE Plan*
• Daily Horoscope for your sign
• Lucky numbers & colors
• Basic predictions

💎 *PREMIUM Plan* (₹99/month)
• Everything in Free
• Weekly & Monthly horoscopes
• Detailed transit analysis
• Priority support
• Muhurat alerts

*Reply with your zodiac sign to start:*
Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces`,
      type: 'button',
      buttons: [
        { id: 'free', title: 'Free Plan' },
        { id: 'premium', title: 'Premium ₹99' },
        { id: 'back', title: 'Back' },
      ],
    };
  }

  /**
   * Send daily horoscope for a sign
   */
  private async sendDailyHoroscope(sign: ZodiacSign): Promise<BotResponse> {
    // In production, this would call the actual horoscope engine
    const signIcon = this.getZodiacIcon(sign);

    return {
      message: `${signIcon} *${sign} - Today's Horoscope*

📅 ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}

⭐ *Overall Rating:* 4/5

🌟 *Overview:*
Dynamic energy flows through you today. Mars blesses you with courage and initiative. Perfect day for taking bold steps in your career and expressing yourself in relationships.

💕 *Love:* 4/5
Romance takes an exciting turn. Express your feelings openly.

💼 *Career:* 5/5
Leadership opportunities arise. Your ideas gain recognition.

🏥 *Health:* 3/5
High energy but avoid overexertion. Stay hydrated.

💰 *Finance:* 4/5
Good day for planning investments. Avoid impulse buys.

🍀 *Lucky:*
• Number: 7
• Color: Red
• Time: 10-12 PM
• Direction: East

*Want detailed report?*
Visit: https://corals.in/daily-horoscope

_Reply "Subscribe" for daily horoscope_`,
      type: 'button',
      buttons: [
        { id: 'subscribe', title: 'Subscribe Daily' },
        { id: 'weekly', title: 'Weekly View' },
        { id: 'menu', title: 'Main Menu' },
      ],
    };
  }

  /**
   * Send muhurat menu
   */
  private sendMuhuratMenu(): BotResponse {
    return {
      message: `🗓️ *Find Auspicious Muhurat*

Choose your event type:`,
      type: 'list',
      listItems: [
        {
          id: 'marriage',
          title: '💒 Marriage / Wedding',
          description: 'Find perfect date for wedding',
        },
        {
          id: 'business',
          title: '🚀 Business Launch',
          description: 'Auspicious time for business',
        },
        {
          id: 'house',
          title: '🏡 House Warming',
          description: 'Griha Pravesh muhurat',
        },
        {
          id: 'vehicle',
          title: '🚗 Vehicle Purchase',
          description: 'Best time to buy vehicle',
        },
        {
          id: 'surgery',
          title: '⚕️ Surgery / Medical',
          description: 'Safe timing for procedures',
        },
        {
          id: 'travel',
          title: '✈️ Travel / Journey',
          description: 'Auspicious travel timing',
        },
      ],
    };
  }

  /**
   * Send horoscope menu
   */
  private sendHoroscopeMenu(): BotResponse {
    return {
      message: `⭐ *Horoscope Options*

Choose your preferred reading:`,
      type: 'button',
      buttons: [
        { id: 'daily', title: 'Daily' },
        { id: 'weekly', title: 'Weekly' },
        { id: 'monthly', title: 'Monthly (Premium)' },
      ],
    };
  }

  /**
   * Send premium options
   */
  private sendPremiumOptions(): BotResponse {
    return {
      message: `💎 *CORALS Premium Membership*

₹99/month or ₹999/year (Save ₹189!)

*Premium Benefits:*

✅ Daily, Weekly & Monthly Horoscopes
✅ Unlimited Muhurat Calculations
✅ Detailed Kundli Reports
✅ Live Chat with Astrologers (2 sessions/month)
✅ Transit Alerts & Notifications
✅ Personalized Remedies
✅ Priority Customer Support
✅ Ad-Free Experience

*Payment Options:*
💳 UPI / Credit Card / Debit Card
📱 PhonePe / Google Pay / Paytm

*Special Offer:* Get 1 month FREE when you buy yearly plan!

Visit: https://corals.in/choose-plan

_Reply "Pay" to get payment link_`,
      type: 'button',
      buttons: [
        { id: 'monthly', title: 'Monthly ₹99' },
        { id: 'yearly', title: 'Yearly ₹999' },
        { id: 'back', title: 'Back' },
      ],
    };
  }

  /**
   * Handle unsubscribe
   */
  private async handleUnsubscribe(phoneNumber: string): Promise<BotResponse> {
    // In production, update database
    return {
      message: `😔 *Unsubscribed Successfully*

We're sad to see you go!

You'll no longer receive daily horoscopes.

To subscribe again anytime, just send "Subscribe"

*We'd love your feedback:*
What can we improve?

_Thank you for using CORALS_ 🙏`,
      type: 'button',
      buttons: [
        { id: 'subscribe', title: 'Subscribe Again' },
        { id: 'feedback', title: 'Give Feedback' },
      ],
    };
  }

  /**
   * Send message via Twilio WhatsApp API
   */
  async sendMessage(to: string, message: string): Promise<void> {
    // In production, integrate with Twilio
    console.log(`Sending to ${to}: ${message}`);

    /*
    const twilio = require('twilio');
    const client = twilio(this.twilioAccountSid, this.twilioAuthToken);

    await client.messages.create({
      from: `whatsapp:${this.twilioWhatsAppNumber}`,
      to: `whatsapp:${to}`,
      body: message,
    });
    */
  }

  /**
   * Send daily horoscope to all subscribers (Scheduled job)
   */
  async sendDailyHoroscopeToSubscribers(users: WhatsAppUser[]): Promise<void> {
    for (const user of users) {
      if (user.subscribed && user.zodiacSign) {
        const response = await this.sendDailyHoroscope(user.zodiacSign);
        await this.sendMessage(user.phoneNumber, response.message);
      }
    }
  }

  /**
   * Send muhurat alert
   */
  async sendMuhuratAlert(to: string, event: string, date: Date): Promise<void> {
    const message = `🗓️ *Muhurat Reminder*

Your ${event} is scheduled for:
📅 ${date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
⏰ ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

*Preparations:*
• Perform Ganesh Puja before starting
• Wear auspicious colors
• Keep environment clean and positive

Good luck! 🙏

_CORALS - Your Spiritual Companion_`;

    await this.sendMessage(to, message);
  }

  /**
   * Get zodiac icon
   */
  private getZodiacIcon(sign: ZodiacSign): string {
    const icons: Record<ZodiacSign, string> = {
      'Aries': '♈',
      'Taurus': '♉',
      'Gemini': '♊',
      'Cancer': '♋',
      'Leo': '♌',
      'Virgo': '♍',
      'Libra': '♎',
      'Scorpio': '♏',
      'Sagittarius': '♐',
      'Capricorn': '♑',
      'Aquarius': '♒',
      'Pisces': '♓',
    };
    return icons[sign];
  }

  /**
   * Handle payment confirmation
   */
  async handlePaymentConfirmation(phoneNumber: string, plan: 'monthly' | 'yearly'): Promise<BotResponse> {
    const amount = plan === 'monthly' ? 99 : 999;
    const validity = plan === 'monthly' ? '1 month' : '1 year';

    return {
      message: `💳 *Payment Confirmation*

Plan: ${plan === 'monthly' ? 'Monthly' : 'Yearly'} Premium
Amount: ₹${amount}
Validity: ${validity}

🔐 *Secure Payment Link:*
https://corals.in/payment/${phoneNumber}/${plan}

*Pay via:*
• UPI (PhonePe, Google Pay, Paytm)
• Credit/Debit Card
• Net Banking

Your subscription activates immediately after payment!

_Payment powered by Razorpay - 100% Secure_`,
      type: 'text',
    };
  }

  /**
   * Send transit alert
   */
  async sendTransitAlert(to: string, planet: string, effect: string): Promise<void> {
    const message = `🌟 *Important Transit Alert*

${planet} is changing position!

*Effect on your sign:*
${effect}

*Recommendations:*
• Stay positive and patient
• Focus on spiritual practices
• Avoid major decisions this week

For detailed analysis, visit:
https://corals.in/transits

_CORALS - Guiding Your Journey_ ✨`;

    await this.sendMessage(to, message);
  }
}

/**
 * WhatsApp Bot Configuration
 */
export const whatsAppBotConfig = {
  commands: {
    start: ['hi', 'hello', 'start', 'namaste'],
    subscribe: ['subscribe', 'daily', 'daily horoscope'],
    unsubscribe: ['unsubscribe', 'stop', 'cancel'],
    muhurat: ['muhurat', 'auspicious', 'timing'],
    help: ['help', 'menu', 'options'],
    premium: ['premium', 'upgrade', 'pro'],
  },
  schedules: {
    dailyHoroscope: '08:00', // 8 AM IST
    weeklyHoroscope: 'Monday 08:00',
    monthlyHoroscope: '1st of month 08:00',
  },
  messages: {
    welcome: 'Welcome to CORALS! Your spiritual companion for daily guidance.',
    subscribed: 'You are now subscribed to daily horoscope! Check your messages at 8 AM every day.',
    unsubscribed: 'You have been unsubscribed. We hope to serve you again!',
    error: 'Sorry, something went wrong. Please try again or contact support.',
  },
};

/**
 * Initialize WhatsApp Bot
 */
export function initializeWhatsAppBot(): WhatsAppBot {
  return new WhatsAppBot({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
  });
}

/**
 * Webhook handler for incoming WhatsApp messages
 */
export async function handleWhatsAppWebhook(req: any): Promise<any> {
  const bot = initializeWhatsAppBot();

  const message: WhatsAppMessage = {
    from: req.body.From.replace('whatsapp:', ''),
    to: req.body.To.replace('whatsapp:', ''),
    body: req.body.Body,
    messageType: 'text',
    timestamp: new Date(),
  };

  const response = await bot.processMessage(message);

  return {
    statusCode: 200,
    body: response.message,
  };
}
