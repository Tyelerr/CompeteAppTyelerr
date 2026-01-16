import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { BaseColors } from "../../hooks/Template";

export type ShopTab = "home" | "rewards" | "manage";

export default function ShopSubNavigation({
  active,
  onChange,
  isMaster,
}: {
  active?: ShopTab;
  onChange?: (t: ShopTab) => void;
  isMaster?: boolean;
}) {
  const [internalTab, setInternalTab] = useState<ShopTab>(active ?? "home");
  useEffect(() => {
    if (active && active !== internalTab) setInternalTab(active);
  }, [active]);

  const current = active ?? internalTab;
  const change = (t: ShopTab) => {
    setInternalTab(t);
    onChange?.(t);
  };

  const Btn = ({ k, label }: { k: ShopTab; label: string }) => {
    if (k === "manage" && !isMaster) return null;
    const isActive = current === k;
    return (
      <Pressable
        onPress={() => change(k)}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: BaseColors.PanelBorderColor,
          backgroundColor: isActive ? "#2563eb" : "#141416",
          alignItems: "center",
          marginRight: 8,
        }}
      >
        <Text
          style={{ color: isActive ? "#fff" : "#cbd5e1", fontWeight: "700" }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row" }}>
        <Btn k="home" label="Shop" />
        <Btn k="rewards" label="Giveaways" />
        <Btn k="manage" label="Manage" />
      </View>
    </View>
  );
}
