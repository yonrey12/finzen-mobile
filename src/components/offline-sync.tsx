import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import { supabase } from "@/lib/supabase";
import {
  getPendingTransactions,
  removePendingTransaction,
  subscribeToQueueChanges,
} from "@/lib/offline-queue";

export function OfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const pending = await getPendingTransactions();
    setPendingCount(pending.length);
  }, []);

  const sync = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected === false) return;

    const pending = await getPendingTransactions();
    if (pending.length === 0) return;

    setSyncing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      for (const item of pending) {
        const { localId, ...payload } = item;
        try {
          const { error } = await supabase.from("transactions").insert({
            user_id: user.id,
            ...payload,
          });
          if (!error) {
            await removePendingTransaction(localId);
          } else {
            break;
          }
        } catch {
          // Still offline or a blip — stop here, we'll retry later.
          break;
        }
      }
    }

    setSyncing(false);
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();
    sync();

    const unsubscribeQueue = subscribeToQueueChanges(refreshCount);
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) sync();
    });

    return () => {
      unsubscribeQueue();
      unsubscribeNetInfo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pendingCount === 0) return null;

  return (
    <View className="border-b border-warning/20 bg-warning/10 px-4 py-2">
      <Text className="text-center text-sm text-warning">
        {syncing
          ? "Subiendo movimientos guardados sin conexión..."
          : `Tienes ${pendingCount} movimiento${pendingCount === 1 ? "" : "s"} guardado${pendingCount === 1 ? "" : "s"} sin conexión — se subirá${pendingCount === 1 ? "" : "n"} solo${pendingCount === 1 ? "" : "s"} cuando tengas internet.`}
      </Text>
    </View>
  );
}
