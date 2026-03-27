export const Colors = {
  primary: '#075E54', // WhatsApp dark green
  primaryLight: '#128C7E', // WhatsApp light green
  secondary: '#25D366', // WhatsApp bright green
  background: '#FFFFFF',
  backgroundDark: '#121B22',
  surface: '#FFFFFF',
  surfaceDark: '#1F2C34',
  text: '#111B21',
  textDark: '#E9EDEF',
  textMuted: '#667781',
  textMutedDark: '#8696A0',
  border: '#E9EDEF',
  borderDark: '#202C33',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

export const paperTheme = {
  colors: {
    primary: Colors.primary,
    accent: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    error: Colors.error,
    text: Colors.text,
    onSurface: Colors.text,
    disabled: Colors.textMuted,
    placeholder: Colors.textMuted,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: Colors.error,
  },
};
