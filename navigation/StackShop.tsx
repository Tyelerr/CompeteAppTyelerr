// navigation/StackShop.tsx
import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import StackHeader from "./StackHeader";

// ✅ New unified screens
import ScreenShop from "../screens/Shop/ScreenShop"; // public Shop + Giveaways tab
import ScreenShopManage from "../screens/Shop/ScreenShopManage"; // admin Manage screen
import ScreenCreateGiveaway from "../screens/Shop/ScreenCreateGiveaway"; // create giveaway screen

const Stack = createNativeStackNavigator();

// 🔁 Legacy redirect so old code that calls `navigate("ShopRewards")` still works
function ShopRewardsRedirect() {
  const nav = useNavigation<any>();
  useEffect(() => {
    nav.replace("ShopHome", { initialTab: "giveaways" });
  }, [nav]);
  return null;
}

export default function StackShop() {
  return (
    <Stack.Navigator
      initialRouteName="ShopHome"
      screenOptions={{
        animation: "none",
        animationDuration: 0,
        headerShown: true,
        header: () => (
          <StackHeader
            title="Shop"
            subtitle="Discover unique finds and giveaways at our welcoming shop."
            type="centered-no-icon"
          />
        ),
      }}
    >
      {/* Root: unified Shop (with internal tabs: Shop / Giveaways) */}
      <Stack.Screen
        name="ShopHome"
        component={ScreenShop}
        options={{ headerBackVisible: false }}
      />

      {/* Admin-only Manage (navigated from ScreenShop when allowed) */}
      <Stack.Screen name="ShopManage" component={ScreenShopManage} />

      {/* Create Giveaway full screen */}
      <Stack.Screen
        name="CreateGiveaway"
        component={ScreenCreateGiveaway}
        options={{ title: "Create Giveaway", presentation: "card" }}
      />

      {/* 🚧 Backward-compat: if anything still navigates here, redirect to ShopHome→Giveaways */}
      <Stack.Screen name="ShopRewards" component={ShopRewardsRedirect} />
    </Stack.Navigator>
  );
}
