import { Text } from 'react-native';
import StackHeader from './StackHeader';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScreenAdminUsers from '../screens/Admin/ScreenAdminUsers';
import ScreenAdminPending from '../screens/Admin/ScreenAdminPending';
import ScreenAdminApproved from '../screens/Admin/ScreenAdminApproved';
import ScreenAdminDeleted from '../screens/Admin/ScreenAdminDeleted';
import ScreenAdminAnalytics from '../screens/Admin/ScreenAdminAnalytics';
import ScreenAdminMessages from '../screens/Admin/ScreenAdminMessages';
import ScreenAdminVenues from '../screens/Admin/ScreenAdminVenues';
import ScreenAdminTournaments from '../screens/Admin/ScreenAdminTournaments';

const Stack = createNativeStackNavigator();

const ExampleScreen = () => {
  return <Text>Example messages</Text>;
};

export default function StackAdmin({ navigation, route }) {
  const ArrayAdminScreens = [
    { name: 'AdminUsers', component: ScreenAdminUsers },
    { name: 'AdminPending', component: ScreenAdminPending },
    { name: 'AdminApproved', component: ScreenAdminApproved },
    { name: 'AdminDeleted', component: ScreenAdminDeleted },
    { name: 'AdminAnalytics', component: ScreenAdminAnalytics },
    { name: 'AdminMessages', component: ScreenAdminMessages },
    { name: 'AdminVenues', component: ScreenAdminVenues },
    { name: 'AdminTournaments', component: ScreenAdminTournaments },
  ];

  return (
    <Stack.Navigator
      initialRouteName="AdminUsers"
      // initialRouteName="AdminPending"
      // initialRouteName="AdminAnalytics"
      screenOptions={{
        animation: 'none',
        animationDuration: 0,
        // statusBarAnimation: 'none',
        // headerShown: false,
        header: () => (
          <StackHeader
            title="Compete Admin Dashboard"
            subtitle="Manage users, tournaments, and system settings"
            type="centered-no-icon"
          />
        ),
      }}
    >
      {ArrayAdminScreens.map((obj, key: number) => {
        return (
          <Stack.Screen
            key={`admin-screen-${key}`}
            name={obj.name}
            component={obj.component}
          />
        );
      })}
    </Stack.Navigator>
  );
}
