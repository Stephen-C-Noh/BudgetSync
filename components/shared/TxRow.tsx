import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Category, Transaction } from "@/lib/types";

type Props = {
  tx: Transaction;
  category?: Category;
  dateLabel?: string;
};

export default function TxRow({ tx, category, dateLabel }: Props) {
  const meta = dateLabel ? `${dateLabel} · ${category?.name ?? "—"}` : (category?.name ?? "—");
  return (
    <View style={styles.txRow}>
      <View style={styles.txLeft}>
        <View style={styles.txIconBox}>
          <Text style={styles.txEmoji}>{category?.icon ?? "💳"}</Text>
        </View>
        <View>
          <Text style={styles.txName}>{tx.note || category?.name || "Transaction"}</Text>
          <Text style={styles.txMeta}>{meta}</Text>
        </View>
      </View>
      <Text style={[styles.txAmount, tx.type === "expense" ? styles.expenseColor : styles.incomeColor]}>
        {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1C252E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  txLeft: { flexDirection: "row", alignItems: "center" },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0B1519",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txEmoji: { fontSize: 20 },
  txName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  txMeta: { color: "#7A869A", fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "700" },
  incomeColor: { color: "#00C853" },
  expenseColor: { color: "#FF3B30" },
});
