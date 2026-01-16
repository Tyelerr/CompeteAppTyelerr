import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import StackHeader from './StackHeader';
import ProfileLoggedFavoriteTournaments from '../screens/ProfileLogged/ProfileLoggedFavoriteTournaments';
import ProfileLoggedSearchAlerts from '../screens/ProfileLogged/ProfileLoggedSearchAlerts';
import ScreenUserMessages from '../screens/ProfileLogged/ScreenUserMessages';
// import { useScrollToTop } from "@react-navigation/native";
// import { Component } from "react";

const Stack = createNativeStackNavigator();

const exampleComponent = () => {
  return <Text>This will be the example component</Text>;
};

export default function StackProfileAdmin({ navigation, route }) {
  const ArrayProfileLoggedScreens = [
    {
      name: 'ProfileLoggedFavoriteTournaments',
      component: ProfileLoggedFavoriteTournaments,
    },
    {
      name: 'ProfileLoggedSearchAlerts',
      component: ProfileLoggedSearchAlerts,
    },
    {
      name: 'ScreenUserMessages',
      component: ScreenUserMessages,
    },
  ];

  return (
    <Stack.Navigator
      initialRouteName="ProfileLoggedFavoriteTournaments"
      screenOptions={
        // useScrollToTop(),
        {
          animation: 'none',
          animationDuration: 0,
          // statusBarAnimation: 'none',
          // headerShown: false,
          header: () => (
            <StackHeader
              title="Profile"
              subtitle="View and manage your tournament history"
              type="centered-no-icon"
            />
          ),
        }
      }
    >
      {ArrayProfileLoggedScreens.map((obj, key: number) => {
        return (
          <Stack.Screen
            key={`profile-logged-screen-${obj.name}`}
            name={obj.name}
            component={obj.component}
          />
        );
      })}
    </Stack.Navigator>
  );
}
