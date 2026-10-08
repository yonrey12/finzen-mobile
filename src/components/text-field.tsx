import { Text, TextInput, View, type TextInputProps } from "react-native";

type Props = TextInputProps & {
  label: string;
  hint?: string;
};

export function TextField({ label, hint, ...inputProps }: Props) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Text>
      <TextInput
        placeholderTextColor="#A1A1AA"
        className="rounded-lg border border-zinc-300 px-3 py-2.5 text-base text-ink dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        {...inputProps}
      />
      {hint ? <Text className="text-xs text-zinc-400">{hint}</Text> : null}
    </View>
  );
}
