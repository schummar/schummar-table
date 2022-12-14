import { useTheme } from '../hooks/useTheme';
import type { TableTheme } from '../types';

export interface TextProps {
  id: keyof TableTheme['text'];
}

export function Text({ id }: TextProps) {
  const text = useTheme((t) => t.text[id]);

  return <>{text}</>;
}
