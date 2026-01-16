// /screens/Shop/ScreenShopManage.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BaseColors, BasePaddingsMargins } from "../../hooks/Template";

export default function ScreenShopManage() {
  const nav = useNavigation<any>();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0c0c0c",
        padding: BasePaddingsMargins.m15,
      }}
    >
      <View
        style={{
          borderWidth: 1,
          borderColor: BaseColors.secondary,
          borderRadius: 12,
          padding: BasePaddingsMargins.m15,
          backgroundColor: BaseColors.dark,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontWeight: "800",
            fontSize: 18,
            marginBottom: 10,
          }}
        >
          Manage Giveaways
        </Text>

        <TouchableOpacity
          onPress={() => nav.navigate("CreateGiveaway")}
          style={{
            backgroundColor: BaseColors.primary,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
            marginBottom: BasePaddingsMargins.m10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            Create New Giveaway
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => nav.navigate("ShopHome", { initialTab: "giveaways" })}
          style={{
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: BaseColors.secondary,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Back to Giveaways
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
