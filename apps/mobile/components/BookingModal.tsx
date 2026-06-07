import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Hotel, RoomType, Booking } from "@aurelia/data";
import { colors, spacing, radius, fontSize, useLayout, formatPrice, webNoOutline } from "@/lib/theme";
import { Button } from "./ui";
import { useAuth } from "@/store/auth";
import { useBookings, makeConfirmationCode, nightsBetween } from "@/store/bookings";
import { createBooking } from "@/lib/api";

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BookingModal({
  visible,
  hotel,
  room,
  onClose,
  onConfirmed,
}: {
  visible: boolean;
  hotel: Hotel;
  room: RoomType;
  onClose: () => void;
  onConfirmed: (b: Booking) => void;
}) {
  const { isMobile } = useLayout();
  const user = useAuth((s) => s.user);
  const addBooking = useBookings((s) => s.addBooking);

  const today = new Date();
  const [checkIn, setCheckIn] = useState(addDays(today, 14));
  const [checkOut, setCheckOut] = useState(addDays(today, 17));
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const subtotal = room.pricePerNight * nights;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;
  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && nights >= 1;

  const confirm = async () => {
    if (!valid) return;
    setSubmitting(true);
    const payload = {
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelImage: hotel.heroImage,
      city: hotel.city,
      country: hotel.country,
      roomTypeId: room.id,
      roomName: room.name,
      checkIn,
      checkOut,
      guests,
      nights,
      pricePerNight: room.pricePerNight,
      total,
      currency: hotel.currency,
      guestName: name.trim(),
      guestEmail: email.trim(),
    };
    // Try the API; always record client-side so the demo flow never blocks.
    const remote = await createBooking(payload);
    const booking: Booking =
      remote ?? {
        ...payload,
        id: `bk-${Date.now()}`,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        confirmationCode: makeConfirmationCode(),
      };
    addBooking(booking);
    setSubmitting(false);
    onConfirmed(booking);
  };

  return (
    <Modal visible={visible} transparent animationType={isMobile ? "slide" : "fade"} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, isMobile ? styles.sheetMobile : styles.sheetDesktop]}
          onPress={(e) => e.stopPropagation?.()}
        >
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>Reserve your stay</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{room.name} · {hotel.name}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
            <View style={styles.dateRow}>
              <Field label="Check-in">
                <TextInput value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textFaint} style={[styles.input, webNoOutline]} />
              </Field>
              <Field label="Check-out">
                <TextInput value={checkOut} onChangeText={setCheckOut} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textFaint} style={[styles.input, webNoOutline]} />
              </Field>
            </View>

            <Field label="Guests">
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => setGuests((g) => Math.max(1, g - 1))} hitSlop={6}>
                  <Ionicons name="remove" size={18} color={colors.navy} />
                </Pressable>
                <Text style={styles.stepVal}>{guests} {guests === 1 ? "guest" : "guests"}</Text>
                <Pressable style={styles.stepBtn} onPress={() => setGuests((g) => Math.min(room.maxGuests, g + 1))} hitSlop={6}>
                  <Ionicons name="add" size={18} color={colors.navy} />
                </Pressable>
                <Text style={styles.stepMax}>Max {room.maxGuests}</Text>
              </View>
            </Field>

            <View style={styles.guestRow}>
              <Field label="Full name" flex>
                <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textFaint} style={[styles.input, webNoOutline]} />
              </Field>
            </View>
            <Field label="Email">
              <TextInput value={email} onChangeText={setEmail} placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textFaint} style={[styles.input, webNoOutline]} />
            </Field>

            <View style={styles.summary}>
              <Row label={`${formatPrice(room.pricePerNight, hotel.currency)} × ${nights} ${nights === 1 ? "night" : "nights"}`} value={formatPrice(subtotal, hotel.currency)} />
              <Row label="Taxes & service" value={formatPrice(taxes, hotel.currency)} />
              <View style={styles.totalDivider} />
              <Row label="Total" value={formatPrice(total, hotel.currency)} bold />
            </View>
          </ScrollView>

          <Button
            label={submitting ? "Confirming…" : `Confirm · ${formatPrice(total, hotel.currency)}`}
            variant="gold"
            full
            loading={submitting}
            disabled={!valid}
            onPress={confirm}
          />
          <Text style={styles.fine}>Free cancellation up to 48h before check-in · Demo booking — no payment taken.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={[styles.field, flex && { flex: 1 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, bold && styles.sumBold]}>{label}</Text>
      <Text style={[styles.sumValue, bold && styles.sumBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, padding: spacing.lg },
  sheetMobile: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "92%" },
  sheetDesktop: { alignSelf: "center", marginVertical: "auto", width: 520, borderRadius: radius.xl, maxHeight: "88%" },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: spacing.md, gap: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  dateRow: { flexDirection: "row", gap: spacing.md },
  guestRow: { flexDirection: "row", gap: spacing.md },
  field: { marginBottom: spacing.md, flex: 1 },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text, marginBottom: 6 },
  input: {
    height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.surface,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.md, height: 48 },
  stepBtn: {
    width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  stepVal: { fontSize: fontSize.md, fontWeight: "700", color: colors.text, minWidth: 80 },
  stepMax: { fontSize: fontSize.xs, color: colors.textFaint, marginLeft: "auto" },
  summary: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  sumLabel: { fontSize: fontSize.md, color: colors.textMuted },
  sumValue: { fontSize: fontSize.md, color: colors.text, fontWeight: "600" },
  sumBold: { fontWeight: "800", color: colors.text, fontSize: fontSize.lg },
  totalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  fine: { fontSize: fontSize.xs, color: colors.textFaint, textAlign: "center", marginTop: spacing.sm },
});
