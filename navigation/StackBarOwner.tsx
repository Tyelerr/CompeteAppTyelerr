import { Text } from 'react-native';
import StackHeader from './StackHeader';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScreenBarOwnerDashboard from '../screens/BarOwner/ScreenBarOwnerDashboard';
import ScreenBarOwnerVenues from '../screens/BarOwner/ScreenBarOwnerVenues';

const Stack = createNativeStackNavigator();

export default function StackBarOwner({ navigation, route }: any) {
  const ArrayBarOwnerScreens = [
    { name: 'BarOwnerDashboard', component: ScreenBarOwnerDashboard },
    { name: 'BarOwnerVenues', component: ScreenBarOwnerVenues },
  ];

  return (
    <Stack.Navigator
      initialRouteName="BarOwnerDashboard"
      screenOptions={{
        animation: 'none',
        animationDuration: 0,
        header: () => (
          <StackHeader
            title="Bar Owner Dashboard"
            subtitle="Manage your venues, directors, and tournaments"
            type="centered-no-icon"
          />
        ),
      }}
    >
      {ArrayBarOwnerScreens.map((obj, key: number) => {
        return (
          <Stack.Screen
            key={`bar-owner-screen-${key}`}
            name={obj.name}
            component={obj.component}
          />
        );
      })}
    </Stack.Navigator>
  );
}
