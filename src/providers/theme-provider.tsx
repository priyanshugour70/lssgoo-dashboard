'use client';

import { ConfigProvider, theme } from 'antd';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

function AntdConfig({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeMode = mounted 
    ? (currentTheme === 'system' ? systemTheme : currentTheme) || 'light'
    : 'light';

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AntdConfig>{children}</AntdConfig>
    </NextThemeProvider>
  );
}

