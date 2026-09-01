import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/src/providers/auth-provider';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = isRegistering ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
      if (isRegistering && !session) Alert.alert('Check your email', 'Confirm your email address, then sign in.');
    } catch (error) {
      Alert.alert(isRegistering ? 'Could not create account' : 'Could not sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>FITTRACK</Text>
        <Text style={styles.title}>{isRegistering ? 'Create account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>{isRegistering ? 'Create an account to save your workouts.' : 'Sign in to continue to your workouts.'}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#778177"
          style={styles.input}
          value={email}
        />
        <TextInput
          autoComplete={isRegistering ? 'new-password' : 'current-password'}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#778177"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.disabled]}>
          {isSubmitting ? <ActivityIndicator color="#101510" /> : <Text style={styles.primaryButtonText}>{isRegistering ? 'Create account' : 'Sign in'}</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={() => setIsRegistering(value => !value)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{isRegistering ? 'I already have an account' : 'Create an account'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#101510', flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  eyebrow: { color: '#B7F34A', fontSize: 12, fontWeight: '700', letterSpacing: 1.4 },
  title: { color: '#F7F8F5', fontSize: 36, fontWeight: '800', marginTop: 10 },
  subtitle: { color: '#A0AAA0', fontSize: 16, lineHeight: 24, marginBottom: 28, marginTop: 8 },
  input: { backgroundColor: '#182019', borderColor: '#2B372C', borderRadius: 12, borderWidth: 1, color: '#F7F8F5', fontSize: 16, marginBottom: 12, padding: 15 },
  primaryButton: { alignItems: 'center', backgroundColor: '#B7F34A', borderRadius: 12, marginTop: 8, minHeight: 52, justifyContent: 'center' },
  primaryButtonText: { color: '#101510', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', marginTop: 16, padding: 12 },
  secondaryButtonText: { color: '#B7F34A', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.65 },
});
