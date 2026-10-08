import { supabase } from "@/lib/supabase";
import { todayInHonduras, advanceDateByFrequency } from "@/lib/date";

/**
 * Turns any due recurring transaction into a real transaction, catching up
 * on every missed cycle since it was last processed. Meant to be called when
 * the dashboard screen comes into focus.
 */
export async function processDueRecurringTransactions() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const today = todayInHonduras();

  const { data: due } = await supabase
    .from("recurring_transactions")
    .select("id, account_id, category_id, type, amount, description, frequency, next_occurrence")
    .eq("is_active", true)
    .lte("next_occurrence", today);

  if (!due || due.length === 0) return;

  for (const r of due) {
    let occurrence = r.next_occurrence as string;

    while (occurrence <= today) {
      await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: r.account_id,
        category_id: r.category_id,
        type: r.type,
        amount: r.amount,
        description: r.description,
        occurred_on: occurrence,
      });

      occurrence = advanceDateByFrequency(
        occurrence,
        r.frequency as "weekly" | "biweekly" | "monthly" | "yearly"
      );
    }

    await supabase.from("recurring_transactions").update({ next_occurrence: occurrence }).eq("id", r.id);
  }
}
