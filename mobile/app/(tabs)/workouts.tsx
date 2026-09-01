import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/src/components/screen';

export default function WorkoutsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Workouts</Text>
      <Text style={styles.description}>Your saved workouts will appear here in Phase 2.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#F7F8F5', fontSize: 32, fontWeight: '800' },
  description: { color: '#A0AAA0', fontSize: 16, lineHeight: 24, marginTop: 12 },
});
