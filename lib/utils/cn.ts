import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility pentru combinarea class names cu Tailwind CSS
 * Combină clsx pentru conditional classes cu tailwind-merge pentru deduplicare
 * 
 * @param inputs - Class names variabile (strings, objects, arrays)
 * @returns String cu class names merged
 * 
 * @example
 * cn('px-2 py-1', isActive && 'bg-blue-500', 'px-4') // => 'py-1 bg-blue-500 px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
