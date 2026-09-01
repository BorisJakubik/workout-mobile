import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/src/components/screen';
import { useAuth } from '@/src/providers/auth-provider';

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <Screen>
      <Text style={styles.eyebrow}>FITTRACK</Text>
      <Text style={styles.title}>Ready to train?</Text>
      <Text style={styles.subtitle}>Your mobile workout companion is connected.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Signed in as</Text>
        <Text style={styles.email}>{session?.user.email ?? 'your account'}</Text>
      </View>
      <Text style={styles.note}>Workout data will be added in Phase 2.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: '#B7F34A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: '#F7F8F5',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 10,
  },
  subtitle: { color: '#A0AAA0', fontSize: 16, lineHeight: 24, marginTop: 8 },
  card: { backgroundColor: '#182019', borderColor: '#2B372C', borderRadius: 16, borderWidth: 1, marginTop: 32, padding: 20 },
  cardTitle: { color: '#A0AAA0', fontSize: 14 },
  email: { color: '#F7F8F5', fontSize: 16, fontWeight: '600', marginTop: 6 },
  note: { color: '#A0AAA0', fontSize: 14, marginTop: 24 },
});
