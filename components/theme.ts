export const COLORS = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF4FF',
  border: '#E4EAF2',
  accent: '#1264F4',
  accentDark: '#0D47B5',
  accentLight: '#6D9EFF',
  success: '#17A673',
  warning: '#F59E0B',
  danger: '#E5484D',
  orange: '#F28C28',
  text: '#152238',
  textSub: '#516078',
  textMuted: '#8A96A8',
  card: '#FFFFFF',
  white: '#FFFFFF',
};

export const FONTS = {
  heading: { fontFamily: 'System', fontWeight: '800' as const },
  subheading: { fontFamily: 'System', fontWeight: '700' as const },
  body: { fontFamily: 'System', fontWeight: '400' as const },
  label: { fontFamily: 'System', fontWeight: '600' as const },
};

export const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
