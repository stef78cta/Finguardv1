'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Provider pentru gestionarea temei dark/light în aplicație.
 * Folosește next-themes pentru persistență și sincronizare automată.
 * 
 * @param props - Proprietățile ThemeProvider din next-themes
 * @returns Provider component pentru temă
 * 
 * @example
 * ```tsx
 * <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
 *   {children}
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
