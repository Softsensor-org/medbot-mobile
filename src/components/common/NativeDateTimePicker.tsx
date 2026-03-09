import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { colors, typography, spacing } from "../../theme";

interface NativeDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
  label?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  testID?: string;
}

export const NativeDateTimePicker: React.FC<NativeDateTimePickerProps> = ({
  value,
  onChange,
  mode = "date",
  label,
  placeholder,
  minimumDate,
  maximumDate,
  testID,
}) => {
  const [show, setShow] = useState(false);
  const [androidMode, setAndroidMode] = useState<"date" | "time">("date");

  const handleOnChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && selectedDate) {
        if (mode === "datetime" && androidMode === "date") {
          // Date selected, now show time picker
          setAndroidMode("time");
          onChange(selectedDate);
          // Keep show=true to trigger the next picker
          return;
        }
        onChange(selectedDate);
      }
      setShow(false);
      setAndroidMode("date"); // Reset for next time
    } else {
      // iOS
      if (event.type === "set" && selectedDate) {
        onChange(selectedDate);
      }
      // On iOS we don't auto-hide because it can be inline or spinner
    }
  };

  const getDisplayText = () => {
    if (!value) return placeholder || "Select date/time";
    
    try {
      if (mode === "date") return format(value, "PPP");
      if (mode === "time") return format(value, "p");
      return format(value, "PPP p");
    } catch {
      return placeholder || "Select date/time";
    }
  };

  const showPicker = () => {
    setAndroidMode(mode === "datetime" ? "date" : mode as "date" | "time");
    setShow(true);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={showPicker}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>
          {getDisplayText()}
        </Text>
        <MaterialIcons
          name={mode === "time" ? "access-time" : "calendar-today"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      
      {Platform.OS === "android" && show && (
        <DateTimePicker
          value={value || new Date()}
          mode={androidMode}
          display="default"
          onChange={handleOnChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          testID={testID}
        />
      )}

      {Platform.OS === "ios" && show && (
        <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                    <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
            </View>
            <DateTimePicker
                value={value || new Date()}
                mode={mode === "datetime" ? "date" : mode} // iOS also handles datetime specially sometimes, but 'date' + 'time' is safer
                display="spinner"
                onChange={handleOnChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                testID={testID}
            />
            {mode === "datetime" && (
                <DateTimePicker
                    value={value || new Date()}
                    mode="time"
                    display="spinner"
                    onChange={handleOnChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  iosPickerContainer: {
    backgroundColor: colors.surface,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  doneText: {
    ...typography.button,
    color: colors.primary,
  }
});
