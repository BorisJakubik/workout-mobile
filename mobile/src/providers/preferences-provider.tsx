import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "dark" | "light";
export type WeightUnit = "kg" | "lbs";
export type Language = "sk" | "en";

type PreferencesContextValue = {
  isLoading: boolean;
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setWeightUnit: (unit: WeightUnit) => Promise<void>;
  theme: Theme;
  weightUnit: WeightUnit;
};

const storageKey = "fittrack.preferences";
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>("kg");
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (!value) return;
        const saved = JSON.parse(value) as { language?: Language; theme?: Theme; weightUnit?: WeightUnit };
        if (saved.theme === "light" || saved.theme === "dark") setThemeState(saved.theme);
        if (saved.weightUnit === "kg" || saved.weightUnit === "lbs") setWeightUnitState(saved.weightUnit);
        if (saved.language === "sk" || saved.language === "en") setLanguageState(saved.language);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const save = async (nextTheme: Theme, nextWeightUnit: WeightUnit, nextLanguage: Language) => {
    await AsyncStorage.setItem(storageKey, JSON.stringify({ language: nextLanguage, theme: nextTheme, weightUnit: nextWeightUnit }));
  };

  const value = useMemo<PreferencesContextValue>(
    () => ({
      isLoading,
      language,
      setLanguage: async (nextLanguage) => {
        setLanguageState(nextLanguage);
        await save(theme, weightUnit, nextLanguage);
      },
      setTheme: async (nextTheme) => {
        setThemeState(nextTheme);
        await save(nextTheme, weightUnit, language);
      },
      setWeightUnit: async (nextWeightUnit) => {
        setWeightUnitState(nextWeightUnit);
        await save(theme, nextWeightUnit, language);
      },
      theme,
      weightUnit,
    }),
    [isLoading, language, theme, weightUnit],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used within PreferencesProvider.");
  return value;
}
