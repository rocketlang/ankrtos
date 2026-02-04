import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { sendOtp, login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const success = await sendOtp('+91' + phone);
      if (success) {
        setStep('otp');
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const success = await login('+91' + phone, code);
      if (!success) {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🌿</Text>
          <Text style={styles.logoText}>Ever Pure</Text>
          <Text style={styles.tagline}>Pure & Natural Products</Text>
        </View>

        {step === 'phone' ? (
          <View style={styles.formContainer}>
            <Text style={styles.title}>Login / Sign Up</Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone Number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, phone.length !== 10 && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading || phone.length !== 10}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get OTP</Text>}
            </TouchableOpacity>
            <Text style={styles.terms}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Enter OTP sent to +91 {phone}</Text>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => otpRefs.current[index] = ref}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={value => handleOtpChange(value, index)}
                  onKeyPress={e => handleOtpKeyPress(e, index)}
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, otp.join('').length !== 6 && styles.buttonDisabled]}
              onPress={() => handleVerifyOtp()}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhone} onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}>
              <Ionicons name="arrow-back" size={16} color="#059669" />
              <Text style={styles.changePhoneText}>Change phone number</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendContainer} onPress={handleSendOtp} disabled={loading}>
              <Text style={styles.resendText}>Didn't receive OTP? </Text>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color="#059669" />
            <Text style={styles.featureText}>Genuine</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="car" size={24} color="#059669" />
            <Text style={styles.featureText}>Fast Delivery</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="leaf" size={24} color="#059669" />
            <Text style={styles.featureText}>Organic</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { fontSize: 60 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#059669', marginTop: 10 },
  tagline: { fontSize: 14, color: '#6B7280', marginTop: 5 },
  formContainer: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 25 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 25 },
  phoneInputContainer: { flexDirection: 'row', marginBottom: 20 },
  countryCode: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 10, justifyContent: 'center' },
  countryCodeText: { fontSize: 16, color: '#111827' },
  phoneInput: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 18, color: '#111827', letterSpacing: 2 },
  button: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  terms: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 20, lineHeight: 18 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  otpInput: { width: 48, height: 56, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  otpInputFilled: { borderColor: '#059669', backgroundColor: '#F0FDF4' },
  changePhone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  changePhoneText: { color: '#059669', marginLeft: 5, fontSize: 14 },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  resendText: { color: '#6B7280', fontSize: 14 },
  resendLink: { color: '#059669', fontSize: 14, fontWeight: '600' },
  features: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 40 },
  featureItem: { alignItems: 'center' },
  featureText: { fontSize: 12, color: '#6B7280', marginTop: 5 },
});
