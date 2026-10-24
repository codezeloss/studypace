import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { fonts } from '@/ui/theme';

/**
 * Text for numbers. IBM Plex Mono with tabular figures keeps every digit the
 * same width, so values such as the running timer do not jump while they change.
 */
export function Num({ style, ...props }: ComponentProps<typeof Text>) {
  return <Text {...props} style={[styles.num, style]} />;
}

const styles = StyleSheet.create({
  num: { fontFamily: fonts.mono, fontVariant: ['tabular-nums'] },
});
