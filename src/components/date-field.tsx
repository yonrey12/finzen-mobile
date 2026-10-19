import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { formatDateEs } from "@/lib/date";

function parseDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DateField({
  label,
  value,
  onChange,
  hint,
  clearable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  clearable?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    setShowPicker(Platform.OS === "ios");
    if (event.type === "set" && selected) {
      onChange(formatDateString(selected));
    }
  }

  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Text>
        {clearable && value ? (
          <Pressable onPress={() => onChange("")}>
            <Text className="text-xs font-medium text-accent">Quitar</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={() => setShowPicker(true)}
        className="rounded-lg border border-zinc-300 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
      >
        <Text className="text-base text-ink dark:text-white">
          {value ? formatDateEs(value) : "Seleccionar fecha"}
        </Text>
      </Pressable>
      {hint ? <Text className="text-xs text-zinc-400">{hint}</Text> : null}
      {showPicker ? (
        <DateTimePicker
          value={value ? parseDateString(value) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
