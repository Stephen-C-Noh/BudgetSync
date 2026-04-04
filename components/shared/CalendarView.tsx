import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MONTH_NAMES, WEEK_DAYS, buildCalendarDays, formatDate } from "@/lib/dateUtils";
import { Category, Transaction } from "@/lib/types";
import NavRow from "./NavRow";
import TxRow from "./TxRow";

type Props = {
  transactions: Transaction[];
  categories: Category[];
};

export default function CalendarView({ transactions, categories }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const calDays = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const today = formatDate(new Date());

  const txDatesSet = useMemo(() => {
    const s = new Set<string>();
    for (const tx of transactions) {
      const [y, m] = tx.date.split("-").map(Number);
      if (y === calYear && m - 1 === calMonth) s.add(tx.date);
    }
    return s;
  }, [transactions, calYear, calMonth]);

  const selectedTxs = useMemo(
    () => (selected ? transactions.filter((tx) => tx.date === selected) : []),
    [transactions, selected]
  );

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setSelected(null);
  }

  return (
    <>
      <NavRow
        label={`${MONTH_NAMES[calMonth]} ${calYear}`}
        onPrev={prevMonth}
        onNext={nextMonth}
      />

      <View style={styles.calWeekRow}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.calWeekLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {calDays.map((day, i) => {
          if (!day) return <View key={i} style={styles.calCell} />;
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasTx = txDatesSet.has(dateStr);
          const isSelected = selected === dateStr;
          const isToday = dateStr === today;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.calCell, isSelected && styles.calCellSelected]}
              onPress={() => setSelected(isSelected ? null : dateStr)}
            >
              <Text style={[styles.calDayText, isToday && styles.calDayToday, isSelected && styles.calDaySelected]}>
                {day}
              </Text>
              {hasTx && <View style={[styles.calDot, isSelected && { backgroundColor: colors.onAccent }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {selected && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{selected}</Text>
          {selectedTxs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions on this day.</Text>
            </View>
          ) : (
            selectedTxs.map((tx) => (
              <TxRow key={tx.id} tx={tx} category={categoryMap.get(tx.category_id)} />
            ))
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push({ pathname: "/add-transaction", params: { date: selected } })}
          >
            <Text style={styles.addButtonText}>+ Add Transaction</Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    calWeekRow: { flexDirection: "row", marginBottom: 6 },
    calWeekLabel: { width: "14.28%", textAlign: "center", color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
    calGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
    calCell: { width: "14.28%", height: 44, alignItems: "center", justifyContent: "center" },
    calCellSelected: { backgroundColor: colors.accent, borderRadius: 10 },
    calDayText: { color: colors.textPrimary, fontSize: 14 },
    calDayToday: { color: colors.accent, fontWeight: "700" },
    calDaySelected: { color: colors.onAccent, fontWeight: "700" },
    calDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 2 },
    sectionTitle: { color: colors.textPrimary, marginBottom: 15, fontSize: 13, fontWeight: "800", letterSpacing: 1 },
    emptyState: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: "center" },
    emptyText: { color: colors.textSecondary, fontSize: 14 },
    addButton: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 12 },
    addButtonText: { color: colors.onAccent, fontSize: 14, fontWeight: "700" },
  });
}
