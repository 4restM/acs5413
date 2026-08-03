import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export function FormField({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function AppTextInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={colors.mutedText} style={[styles.input, props.multiline && styles.multiline, props.style]} {...props} />;
}

export function ChoiceRow({ value, choices, onChange, accessibilityLabel }: { value: string; choices: readonly string[]; onChange: (choice: string) => void; accessibilityLabel?: string }) {
  return (
    <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {choices.map((choice) => {
        const selected = choice === value;
        return (
          <Pressable
            key={choice}
            accessibilityRole="radio"
            accessibilityLabel={choice}
            accessibilityState={{ selected }}
            onPress={() => onChange(choice)}
            style={[styles.choice, selected && styles.choiceSelected]}>
            <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 15, fontWeight: '700' },
  hint: { color: colors.mutedText, fontSize: 13, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  input: { minHeight: 46, borderColor: colors.border, borderWidth: 1, borderRadius: radii.sm, color: colors.text, backgroundColor: '#FCFDFC', paddingHorizontal: spacing.md, fontSize: 16 },
  multiline: { minHeight: 92, paddingTop: spacing.md, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: { minHeight: 44, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, justifyContent: 'center', backgroundColor: colors.surface },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  choiceText: { color: colors.text, fontWeight: '600', textTransform: 'capitalize' },
  choiceTextSelected: { color: colors.primaryDark },
});
