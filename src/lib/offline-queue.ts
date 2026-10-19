import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "finzen_pending_transactions";

export type PendingTransaction = {
  localId: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  account_id: string;
  category_id?: string | null;
  transfer_account_id?: string | null;
  occurred_on: string;
  description?: string | null;
};

async function readQueue(): Promise<PendingTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingTransaction[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingTransaction[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable — the entry just won't persist.
  }
}

const listeners = new Set<() => void>();

/** Notified whenever the queue changes, so the banner can refresh without polling. */
export function subscribeToQueueChanges(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyChange() {
  for (const listener of listeners) listener();
}

export function getPendingTransactions(): Promise<PendingTransaction[]> {
  return readQueue();
}

export async function addPendingTransaction(entry: Omit<PendingTransaction, "localId">) {
  const queue = await readQueue();
  const localId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  queue.push({ ...entry, localId });
  await writeQueue(queue);
  notifyChange();
  return localId;
}

export async function removePendingTransaction(localId: string) {
  const queue = (await readQueue()).filter((item) => item.localId !== localId);
  await writeQueue(queue);
  notifyChange();
}
