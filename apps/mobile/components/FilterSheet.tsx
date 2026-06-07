import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize, useLayout, formatPrice } from "@/lib/theme";
import { Button } from "./ui";
import { CATEGORIES, REGIONS, type HotelQuery } from "@aurelia/data";

export type Filters = {
  region?: string;
  category?: string;
  maxPrice?: number;
  minRating?: number;
  sort?: HotelQuery["sort"];
};

const PRICE_STEPS = [600, 900, 1200, 1800, 2500];
const RATINGS = [4.5, 4.7, 4.8, 4.9];

export function FilterSheet({
  visible,
  initial,
  resultCount,
  onApply,
  onClose,
}: {
  visible: boolean;
  initial: Filters;
  resultCount: number;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const { isMobile } = useLayout();
  const [draft, setDraft] = useState<Filters>(initial);

  React.useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));
  const clear = () => setDraft({ sort: draft.sort });

  return (
    <Modal visible={visible} transparent animationType={isMobile ? "slide" : "fade"} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, isMobile ? styles.sheetMobile : styles.sheetDesktop]}
          onPress={(e) => e.stopPropagation?.()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
            <Group label="Region">
              <Chips
                options={REGIONS as unknown as string[]}
                value={draft.region}
                onPick={(v) => set({ region: draft.region === v ? undefined : v })}
              />
            </Group>
            <Group label="Property type">
              <Chips
                options={CATEGORIES as unknown as string[]}
                value={draft.category}
                onPick={(v) => set({ category: draft.category === v ? undefined : v })}
              />
            </Group>
            <Group label="Max nightly price">
              <Chips
                options={PRICE_STEPS.map((p) => formatPrice(p))}
                value={draft.maxPrice ? formatPrice(draft.maxPrice) : undefined}
                onPick={(label) => {
                  const p = PRICE_STEPS[PRICE_STEPS.map((x) => formatPrice(x)).indexOf(label)];
                  set({ maxPrice: draft.maxPrice === p ? undefined : p });
                }}
              />
            </Group>
            <Group label="Guest rating">
              <Chips
                options={RATINGS.map((r) => `${r}+`)}
                value={draft.minRating ? `${draft.minRating}+` : undefined}
                onPick={(label) => {
                  const r = parseFloat(label);
                  set({ minRating: draft.minRating === r ? undefined : r });
                }}
              />
            </Group>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={clear} hitSlop={8}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
            <Button label={`Show ${resultCountFor(draft, resultCount)} results`} variant="primary" onPress={() => onApply(draft)} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// The live count is computed by the parent; we just display what it passed.
function resultCountFor(_: Filters, count: number) {
  return count;
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chips({ options, value, onPick }: { options: string[]; value?: string; onPick: (v: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = value === o;
        return (
          <Pressable key={o} style={[styles.chip, active && styles.chipActive]} onPress={() => onPick(o)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, padding: spacing.lg },
  sheetMobile: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "85%" },
  sheetDesktop: { alignSelf: "center", marginVertical: "auto", width: 520, borderRadius: radius.xl, maxHeight: "80%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  group: { marginBottom: spacing.lg },
  groupLabel: { fontSize: fontSize.md, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: "600" },
  chipTextActive: { color: colors.surface },
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md,
  },
  clearText: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: "700" },
});
