import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";

import { processDueRecurringTransactions } from "@/lib/recurring-processing";

export default function DashboardScreen() {
  useFocusEffect(
    useCallback(() => {
      processDueRecurringTransactions();
    }, [])
  );

  return (
    <View className="flex-1 items-center justify-center gap-2 px-6">
      <Text className="text-xl font-semibold text-ink dark:text-white">Dashboard</Text>
      <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Aquí irá el resumen de saldos, ingresos y gastos del mes.
      </Text>
    </View>
  );
}
