import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
// If your supabase client lives elsewhere, adjust this import:
import { supabase } from "../../ApiSupabase/supabase";

type GiveawayStatus = "scheduled" | "active" | "ended";

export default function ScreenCreateGiveaway() {
  const nav = useNavigation<any>();

  // ---- Controlled form state (no defaultValue when value exists) ----
  const [title, setTitle] = useState("");
  const [prizeValue, setPrizeValue] = useState<string>(""); // keep as string for controlled numeric input
  const [rules, setRules] = useState("");
  const [status, setStatus] = useState<GiveawayStatus>("scheduled");
  const [ageCheck, setAgeCheck] = useState(true);
  const [dailyEntry, setDailyEntry] = useState(false);

  const [startAt, setStartAt] = useState<Date | null>(null);
  const [endAt, setEndAt] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const formattedStart = useMemo(
    () => (startAt ? startAt.toLocaleString() : "Select start"),
    [startAt]
  );
  const formattedEnd = useMemo(
    () => (endAt ? endAt.toLocaleString() : "Select end"),
    [endAt]
  );

  const onChangeDate =
    (which: "start" | "end") =>
    (e: DateTimePickerEvent, selected?: Date | undefined) => {
      // On Android, the modal calls onChange with type="dismissed" if canceled.
      if (e.type === "dismissed") {
        if (which === "start") setShowStartPicker(false);
        else setShowEndPicker(false);
        return;
      }
      if (selected) {
        which === "start" ? setStartAt(selected) : setEndAt(selected);
      }
      if (Platform.OS === "android") {
        // Android uses a modal; close after pick
        if (which === "start") setShowStartPicker(false);
        else setShowEndPicker(false);
      }
    };

  const validate = useCallback(() => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a giveaway title.");
      return false;
    }
    if (prizeValue && isNaN(Number(prizeValue))) {
      Alert.alert("Invalid Prize Value", "Please enter a valid number.");
      return false;
    }
    if (startAt && endAt && endAt < startAt) {
      Alert.alert("Invalid Dates", "End time must be after start time.");
      return false;
    }
    return true;
  }, [title, prizeValue, startAt, endAt]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Build insert payload. Adjust column names to match your table.
      const payload = {
        title: title.trim(),
        prize_value: prizeValue ? Number(prizeValue) : null,
        rules: rules.trim() || null,
        status, // 'scheduled' | 'active' | 'ended'
        age_verification_required: ageCheck,
        daily_entry: dailyEntry,
        start_at: startAt ? startAt.toISOString() : null,
        end_at: endAt ? endAt.toISOString() : null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("giveaways")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error(error);
        Alert.alert("Create Failed", error.message);
        return;
      }

      // Success: either go back or show a message then go back
      Alert.alert(
        "Giveaway Created",
        "Your giveaway was created successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              // If your Manage screen reloads on focus, just go back:
              nav.goBack();
              // If you prefer passing a signal to refresh:
              // nav.navigate({ name: "ShopManage", params: { refreshAfterCreate: Date.now() }, merge: true });
            },
          },
        ]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert("Create Failed", e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    title,
    prizeValue,
    rules,
    status,
    ageCheck,
    dailyEntry,
    startAt,
    endAt,
    nav,
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="always"
      >
        <Text style={styles.header}>Create New Giveaway</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Predator BK Rush + Case"
            style={styles.input}
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Prize Value (USD)</Text>
          <TextInput
            value={prizeValue}
            onChangeText={setPrizeValue}
            placeholder="Ex: 999.99"
            style={styles.input}
            keyboardType={Platform.select({
              ios: "number-pad",
              android: "number-pad",
            })}
            returnKeyType="done"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>Start</Text>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              activeOpacity={0.8}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerText}>{formattedStart}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startAt ?? new Date()}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onChangeDate("start")}
              />
            )}
          </View>

          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>End</Text>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              activeOpacity={0.8}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerText}>{formattedEnd}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endAt ?? new Date()}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onChangeDate("end")}
              />
            )}
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Require 18+ / ID Check</Text>
          <Switch value={ageCheck} onValueChange={setAgeCheck} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Allow Daily Entries</Text>
          <Switch value={dailyEntry} onValueChange={setDailyEntry} />
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Status</Text>
        <View style={styles.segment}>
          {(["scheduled", "active", "ended"] as GiveawayStatus[]).map((s) => {
            const selected = s === status;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={[styles.segmentBtn, selected && styles.segmentBtnActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTxt,
                    selected && styles.segmentTxtActive,
                  ]}
                >
                  {s.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Rules / Description</Text>
          <TextInput
            value={rules}
            onChangeText={setRules}
            placeholder="Key terms, eligibility, how winner is chosen, etc."
            style={[styles.input, styles.multiline]}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.9}
          style={[styles.submit, submitting && { opacity: 0.7 }]}
        >
          {submitting ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.submitText}>Create Giveaway</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0d" },
  container: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 6,
  },
  field: { width: "100%" },
  label: { color: "#c7c7cc", fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#2b2b30",
    backgroundColor: "#141418",
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    borderRadius: 10,
    color: "white",
    fontSize: 16,
  },
  multiline: { height: 120 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#2b2b30",
    backgroundColor: "#141418",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
  },
  pickerText: { color: "white", fontSize: 16 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: { color: "#c7c7cc", fontSize: 16 },
  segment: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "nowrap",
    height: 24,
  },
  segmentBtn: {
    flexGrow: 0,
    flexShrink: 0,
    width: 70,
    height: 24,
    minHeight: 24,
    borderWidth: 1,
    borderColor: "#34343a",
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  segmentTxt: {
    color: "#c7c7cc",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  segmentTxtActive: { color: "white" },
  submit: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  submitText: { color: "black", fontSize: 16, fontWeight: "700" },
});
