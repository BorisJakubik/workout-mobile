import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/src/components/screen';
import { useAuth } from '@/src/providers/auth-provider';

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      <Pressable accessibilityRole="button" onPress={handleSignOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#F7F8F5', fontSize: 32, fontWeight: '800' },
  button: { borderColor: '#B7F34A', borderRadius: 12, borderWidth: 1, marginTop: 28, padding: 14 },
  buttonText: { color: '#B7F34A', fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
