import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { JdmConfigProvider } from '@gorules/jdm-editor';
import { match } from 'ts-pattern';

import { Toaster } from '../components/ui/sonner';
import { readStorage, writeStorage } from '../lib/storage-key';

const colorMediaQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export enum ThemePreference {
  Automatic = 'automatic',
  Dark = 'dark',
  Light = 'light',
}

type ThemeContextState = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  isDarkTheme: boolean;
};

// eslint-disable-next-line
export const ThemeContext = createContext<ThemeContextState>({} as any);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceInternal] = useState<ThemePreference>(() => {
    return match(readStorage('themePreference'))
      .with('dark', () => ThemePreference.Dark)
      .with('light', () => ThemePreference.Light)
      .otherwise(() => ThemePreference.Automatic);
  });

  const [isAutomaticDark, setIsAutomaticDark] = useState(() => colorMediaQuery().matches);

  const isDarkTheme = useMemo<boolean>(() => {
    return match(themePreference)
      .with(ThemePreference.Dark, () => true)
      .with(ThemePreference.Light, () => false)
      .otherwise(() => isAutomaticDark);
  }, [themePreference, isAutomaticDark]);

  useEffect(() => {
    const eventTarget = colorMediaQuery();
    const listener = (event: MediaQueryListEvent) => {
      setIsAutomaticDark(event.matches);
    };

    eventTarget.addEventListener('change', listener);
    return () => {
      eventTarget.removeEventListener('change', listener);
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceInternal(preference);
    writeStorage('themePreference', preference);
  };

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, isDarkTheme }}>
      <JdmConfigProvider theme={{ mode: isDarkTheme ? 'dark' : 'light' }}>
        {children}
        <Toaster />
      </JdmConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
