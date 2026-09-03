import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { Screen } from "@/src/components/screen";
import { formatWorkoutDate, getWorkouts } from "@/src/services/workouts";
import type { Workout } from "@/src/types";
import { translateExerciseName } from "@/src/i18n";
import { usePreferences } from "@/src/providers/preferences-provider";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const maximum = (workouts: Workout[], aliases: string[]) =>
  Math.max(
    0,
    ...workouts.flatMap((workout) =>
      workout.exercises
        .filter((exercise) => aliases.some((alias) => normalize(exercise.name).includes(alias)))
        .flatMap((exercise) => exercise.sets.map((set) => set.weight)),
    ),
  );
const convertWeight = (value: number, unit: "kg" | "lbs") => (unit === "lbs" ? Math.round(value * 2.20462 * 10) / 10 : value);

export default function ProgressScreen() {
  const { language, weightUnit } = usePreferences();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setWorkouts(await getWorkouts());
    } catch (error) {
      Alert.alert(
        language === "sk" ? "Pokrok sa nepodarilo načítať" : "Could not load progress",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [language]);
  useFocusEffect(useCallback(() => void load(), [load]));
  const recent = useMemo(() => workouts.slice(0, 6).reverse(), [workouts]);
  const lifts = useMemo(
    () =>
      [
        { aliases: ["bench press", "benchpress"], label: "Bench press" },
        { aliases: ["mrtvy tah", "deadlift"], label: "Deadlift" },
        { aliases: ["drep", "squat"], label: "Squat" },
      ].map((lift) => ({ ...lift, value: maximum(workouts, lift.aliases) })),
    [workouts],
  );
  const maxDuration = Math.max(1, ...recent.map((workout) => workout.duration));
  const bodyWeight = workouts.filter((workout) => workout.bodyWeight != null).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const bodyFat = workouts
    .filter((workout) => workout.bodyFatPercentage != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const best = Math.max(...lifts.map((lift) => lift.value), 0);

  return (
    <Screen>
      {isLoading ? (
        <ActivityIndicator color="#B7F34A" style={styles.loader} />
      ) : (
        <>
          <Text style={styles.eyebrow}>{language === "sk" ? "VÝSLEDKY" : "RESULTS"}</Text>
          <Text style={styles.title}>{language === "sk" ? "Váš pokrok" : "Your progress"}</Text>
          <Text style={styles.subtitle}>{language === "sk" ? "Sledujte svoju konzistentnosť a silu." : "Track your consistency and strength."}</Text>
          <Card eyebrow={language === "sk" ? "TRVANIE" : "DURATION"} title={language === "sk" ? "Čas tréningov" : "Workout time"}>
            <View style={styles.bars}>
              {recent.map((workout) => (
                <View key={workout.id} style={styles.barWrap}>
                  <View style={[styles.bar, { height: `${Math.max(12, (workout.duration / maxDuration) * 100)}%` }]} />
                  <Text style={styles.barLabel}>{formatWorkoutDate(workout.date, language).split(" ")[0]}</Text>
                </View>
              ))}
            </View>
            {!recent.length && <Text style={styles.empty}>{language === "sk" ? "Zatiaľ nie sú žiadne tréningy." : "No workouts yet."}</Text>}
          </Card>
          <Card eyebrow="POWERLIFTING" title={language === "sk" ? "Veľká trojka" : "Big Three"}>
            <View style={styles.lifts}>
              {lifts.map((lift) => (
                <View key={lift.label} style={styles.lift}>
                  <Text style={styles.liftName}>{translateExerciseName(lift.label, language)}</Text>
                  <Text style={styles.liftValue}>
                    {convertWeight(lift.value, weightUnit)} {weightUnit}
                  </Text>
                  <Text style={styles.muted}>{language === "sk" ? "najťažšia séria" : "heaviest set"}</Text>
                </View>
              ))}
            </View>
            <View style={styles.total}>
              <Text style={styles.totalText}>{language === "sk" ? "Súčet powerliftingu" : "Powerlifting total"}</Text>
              <Text style={styles.totalValue}>
                {convertWeight(
                  lifts.reduce((sum, lift) => sum + lift.value, 0),
                  weightUnit,
                )}{" "}
                {weightUnit}
              </Text>
            </View>
          </Card>
          <HistoryCard
            title={language === "sk" ? "Vývoj hmotnosti" : "Weight history"}
            unit={weightUnit}
            values={bodyWeight.map((workout) => ({ date: workout.date, value: workout.bodyWeight! }))}
            language={language}
            convert={(value) => convertWeight(value, weightUnit)}
          />
          <HistoryCard
            title={language === "sk" ? "Vývoj telesného tuku" : "Body fat progress"}
            unit="%"
            values={bodyFat.map((workout) => ({ date: workout.date, value: workout.bodyFatPercentage! }))}
            language={language}
            convert={(value) => value}
          />
          <View style={styles.record}>
            <Ionicons color="#B7F34A" name="trophy-outline" size={28} />
            <View>
              <Text style={styles.muted}>{language === "sk" ? "OSOBNÝ REKORD" : "PERSONAL RECORD"}</Text>
              <Text style={styles.recordValue}>
                {convertWeight(best, weightUnit)} {weightUnit}
              </Text>
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

function Card({ children, eyebrow, title }: { children: React.ReactNode; eyebrow: string; title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}
function HistoryCard({
  convert,
  language,
  title,
  unit,
  values,
}: {
  convert: (value: number) => number;
  language: "en" | "sk";
  title: string;
  unit: string;
  values: { date: string; value: number }[];
}) {
  const latest = values.at(-1);
  return (
    <Card eyebrow={language === "sk" ? "MERANIA" : "MEASUREMENTS"} title={title}>
      {latest ? (
        <>
          <Text style={styles.historyValue}>
            {convert(latest.value)} {unit}
          </Text>
          <Text style={styles.muted}>
            {language === "sk" ? "posledné meranie" : "latest measurement"} · {formatWorkoutDate(latest.date, language)}
          </Text>
          <View style={styles.historyDots}>
            {values.slice(-8).map((value) => (
              <View key={value.date} style={[styles.dot, { opacity: 0.35 + (value.value / Math.max(...values.map((item) => item.value))) * 0.65 }]} />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.empty}>{language === "sk" ? "Zatiaľ nie sú žiadne údaje." : "No data yet."}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 64 },
  eyebrow: { color: "#B7F34A", fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: "#F7F8F5", fontSize: 32, fontWeight: "800", marginTop: 8 },
  subtitle: { color: "#A0AAA0", fontSize: 16, marginTop: 8 },
  card: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 16, borderWidth: 1, marginTop: 24, padding: 16 },
  cardTitle: { color: "#F7F8F5", fontSize: 21, fontWeight: "800", marginTop: 4 },
  bars: { alignItems: "flex-end", flexDirection: "row", gap: 10, height: 150, marginTop: 22 },
  barWrap: { alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { backgroundColor: "#B7F34A", borderRadius: 6, minHeight: 8, width: "100%" },
  barLabel: { color: "#A0AAA0", fontSize: 10, marginTop: 7 },
  lifts: { flexDirection: "row", gap: 8, marginTop: 16 },
  lift: { backgroundColor: "#101510", borderRadius: 10, flex: 1, padding: 10 },
  liftName: { color: "#F7F8F5", fontSize: 12, fontWeight: "700" },
  liftValue: { color: "#B7F34A", fontSize: 16, fontWeight: "800", marginTop: 8 },
  muted: { color: "#A0AAA0", fontSize: 12, marginTop: 4 },
  total: {
    alignItems: "center",
    borderTopColor: "#2B372C",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
  },
  totalText: { color: "#F7F8F5", fontWeight: "700" },
  totalValue: { color: "#B7F34A", fontSize: 18, fontWeight: "800" },
  historyValue: { color: "#B7F34A", fontSize: 30, fontWeight: "800", marginTop: 16 },
  historyDots: { flexDirection: "row", gap: 8, marginTop: 16 },
  dot: { backgroundColor: "#B7F34A", borderRadius: 5, height: 10, width: 10 },
  record: { alignItems: "center", backgroundColor: "#24301B", borderRadius: 16, flexDirection: "row", gap: 14, marginTop: 24, padding: 18 },
  recordValue: { color: "#F7F8F5", fontSize: 24, fontWeight: "800", marginTop: 2 },
  empty: { color: "#A0AAA0", marginTop: 18 },
});
