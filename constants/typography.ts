import { StyleSheet } from 'react-native';

export const typography = StyleSheet.create({
  h1: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  h2: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 23,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 21,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
  },
});
