'use client';

import { Button } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      type="text"
      icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  );
}

