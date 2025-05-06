// src/lib/utils.ts
import { hapticFeedback } from '@telegram-apps/sdk-react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Функция из shadcn/ui для объединения классов Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Простая функция для генерации случайных ID (для моков)
export function generateId(length = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

// Функция для форматирования валюты (пример)
export function formatCurrency(amount: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// Функция для форматирования даты (пример)
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    // hour: '2-digit',
    // minute: '2-digit',
  };
  return new Intl.DateTimeFormat('ru-RU', { ...defaultOptions, ...options }).format(dateObj);
}

export function mediumHaptic() {
  if (hapticFeedback.impactOccurred.isAvailable()) {
    hapticFeedback.impactOccurred('medium');
  }
}

/**
 * Форматирует число, добавляя разделители тысяч
 * @param value - число для форматирования
 * @returns отформатированная строка
 */
export function formatNumberWithSpaces(value: number | string): string {
  // Преобразуем в строку и удаляем все нецифровые символы кроме точки
  const stringValue = String(value).replace(/[^\d.]/g, '');
  
  // Разделяем на целую и дробную части
  const [integerPart, decimalPart] = stringValue.split('.');
  
  // Форматируем целую часть, добавляя пробелы
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Возвращаем результат с дробной частью, если она есть
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

/**
 * Преобразует отформатированное число обратно в числовое значение
 * @param value - отформатированная строка
 * @returns числовое значение
 */
export function parseFormattedNumber(value: string): number {
  // Удаляем все пробелы и заменяем запятую на точку
  const cleanValue = value.replace(/\s/g, '').replace(',', '.');
  return Number(cleanValue);
}