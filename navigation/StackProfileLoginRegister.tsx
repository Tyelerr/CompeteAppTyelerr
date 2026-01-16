import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScreenProfileLogin from '../screens/ProfileLoginRegister/ScreenProfileLogin';
import ScreenProfileRegister from '../screens/ProfileLoginRegister/ScreenProfileRegister';
import ScreenForgotPassword from '../screens/ProfileLoginRegister/ScreenForgotPassword';

const Stack = createNativeStackNavigator();

export default function StackProfileLoginRegister() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScreenProfileLogin" component={ScreenProfileLogin} />
      <Stack.Screen
        name="ScreenProfileRegister"
        component={ScreenProfileRegister}
      />
      <Stack.Screen name="ForgotPassword" component={ScreenForgotPassword} />
    </Stack.Navigator>
  );
}
