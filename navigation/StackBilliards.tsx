import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import StackHeader from './StackHeader';
import ScreenBilliardHome from '../screens/Billiard/ScreenBilliardHome';
import ScreenDailyTournaments from '../screens/Billiard/ScreenDailyTournaments';
import ScreenFargoRatedTournaments from '../screens/Billiard/ScreenFargoRatedTournaments';

const Stack = createNativeStackNavigator();

const ExampleScreen = () => {
  return <Text>Example screen</Text>;
};

export default function StackBilliards({ navigation, route }: any) {
  // const navigation = useNavigation();
  // const route = useRoute();

  const ArrayBilliardsScreens = [
    {
      name: 'BilliardHome',
      component: ScreenBilliardHome,
      header: (
        <StackHeader
          title="Billiards Tournaments"
          subtitle="Browse all billiards tournaments by game type and location"
          type="centered-no-icon"
        />
      ),
    },
    {
      name: 'BilliardDailyTournaments',
      component: ScreenDailyTournaments,
      header: (
        <StackHeader
          title="Daily Tournaments"
          subtitle="Browse all recurring tournaments in your area"
          type="centered-no-icon"
        />
      ),
    },
    {
      name: 'BilliardFargoRated',
      component: ScreenFargoRatedTournaments,
      header: (
        <StackHeader
          title="Fargo Rated Tournaments"
          subtitle="Browse all Fargo rated tournaments and track your progress"
          type="centered-no-icon"
        />
      ),
    },
    // {name: 'BilliardHome', component: ExampleScreen},
    // {name: 'BilliardHome', component: ExampleScreen},
  ];

  /*const FHeaderDetails = ()=>{

    // // // // // // // console.log( `route.name:${route.name}` );

    if(route.name==='BilliardDailyTournaments'){
      return {title:'Daily Tournaments', subtitle:'Browse all recurring tournaments in your area'};
    }
    else if(route.name==='BilliardFargoRated'){
      return {title:'Fargo Rated Tournaments', subtitle:'Browse all Fargo rated tournaments and track your progress'};
    }
    return {title: 'Billiards Tournaments', subtitle: 'Browse all billiards tournaments by game type and location'}
  }*/

  return (
    <Stack.Navigator
      initialRouteName="BilliardHome"
      screenOptions={{
        animation: 'none',
        animationDuration: 0,
        // statusBarAnimation: 'none',
      }}
    >
      {ArrayBilliardsScreens.map((obj, key: number) => {
        return (
          <Stack.Screen
            options={{
              header: () => obj.header,
            }}
            key={`admin-screen-${key}`}
            name={obj.name}
            component={obj.component}
          />
        );
      })}
    </Stack.Navigator>
  );
}
