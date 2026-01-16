// navigation/AppNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { TRootTabParamList } from './Interface';
import StackHome from './StackHome';
import StackProfileLoginRegister from './StackProfileLoginRegister';
import StackAdmin from './StackAdmin';
import StackBarOwner from './StackBarOwner';
import StackProfileAdmin from './StackProfileAdmin';
import StackSubmit from './StackSubmit';
import StackBilliards from './StackBilliards';
import StackShop from './StackShop';

import ScreenFAQs from '../screens/FAQs/ScreenFAQs'; // ✅ direct FAQ tab

import { BaseColors } from '../hooks/Template';
import { useEffect, useRef } from 'react';
import { useContextAuth } from '../context/ContextAuth';
import { EUserRole, ICAUserData } from '../hooks/InterfacesGlobal';

import CustomTabNavigator from './CustomTabNavigator';
import TabBarIconElement from './TabBarIcon';
import StackHeader from './StackHeader';
import DeepLinkingService from '../services/DeepLinkingService';

const Tab = createBottomTabNavigator<TRootTabParamList>();
const Stack = createNativeStackNavigator();

// Dark theme so background never flashes white
const DarkNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: BaseColors.backgroundColor,
    card: BaseColors.backgroundColor,
    border: BaseColors.secondary,
    text: '#fff',
    primary: BaseColors.primary,
  },
};

const NavigatorBarSettings = () => {
  if (Platform.OS === 'android') {
    // (optional) add Android nav bar styling here
  }
};

/* ---------- Individual Tab Screens ---------- */
const TabScreenHome = () => (
  <Tab.Screen
    name="HomeTab"
    component={StackHome}
    options={{
      title: 'Home',
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'home'} />
      ),
    }}
  />
);

const TabScreenBilliards = () => (
  <Tab.Screen
    name="BilliardsTab"
    component={StackBilliards}
    options={{
      title: 'Billiards',
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'trophy'} />
      ),
    }}
  />
);

const TabScreenProfile = () => (
  <Tab.Screen
    name="ProfileTab"
    component={StackProfileLoginRegister}
    options={{
      title: 'Profile',
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'person'} />
      ),
    }}
  />
);

const TabScreenProfileLogged = () => (
  <Tab.Screen
    name="ProfileLoggedTab"
    component={StackProfileAdmin}
    options={{
      title: 'Profile',
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'person'} />
      ),
    }}
  />
);

const TabShop = () => (
  <Tab.Screen
    name="ShopTab"
    component={StackShop}
    options={{
      title: 'Shop',
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'bag-handle'} />
      ),
    }}
  />
);

const TabScreenAdmin = () => (
  <Tab.Screen
    name="AdminTab"
    component={StackAdmin}
    options={{
      title: 'Admin',
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'settings'} />
      ),
    }}
  />
);

const TabScreenBarOwner = () => (
  <Tab.Screen
    name="BarOwnerTab"
    component={StackBarOwner}
    options={{
      title: 'Admin',
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'settings'} />
      ),
    }}
  />
);

const TabScreenSubmit = () => (
  <Tab.Screen
    name="SubmitTab"
    component={StackSubmit}
    options={{
      title: 'Submit',
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'add-circle'} />
      ),
    }}
  />
);

const TabScreenFAQ = () => (
  <Tab.Screen
    name="FAQTab"
    component={ScreenFAQs}
    options={{
      title: 'FAQ',
      headerShown: true,
      header: () => (
        <StackHeader
          title="Frequently Asked Questions"
          subtitle="Find answers to common questions and get in touch with support"
          type="centered-no-icon"
        />
      ),
      tabBarIcon: ({ focused }) => (
        <TabBarIconElement focused={!!focused} icon={'help-circle'} />
      ),
    }}
  />
);

/* ---------- Tab Navigators ---------- */
const AppTabNavigatorLogged = (user: ICAUserData) => {
  useEffect(() => {
    NavigatorBarSettings();
  }, []);

  return (
    <Tab.Navigator
      key={`tab-navigator-logged`}
      tabBar={(props) => <CustomTabNavigator {...props} />}
      initialRouteName={'HomeTab'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BaseColors.primary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderColor: BaseColors.contentSwitcherBackgroundCOlor,
          backgroundColor: BaseColors.backgroundColor,
          paddingBottom: 0,
          paddingTop: 10,
          height: 110,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 12,
        },
      }}
    >
      {TabScreenHome()}
      {TabScreenBilliards()}
      {/* Show Submit for non-basic roles */}
      {(() => {
        console.log(
          'Navigation: user role check:',
          user?.role,
          'BasicUser:',
          EUserRole.BasicUser,
          'BarAdmin:',
          EUserRole.BarAdmin,
          'All roles:',
          Object.values(EUserRole),
        );
        return user?.role === EUserRole.BasicUser ? null : TabScreenSubmit();
      })()}
      {/* Show Admin for Masters */}
      {user?.role === EUserRole.MasterAdministrator ? TabScreenAdmin() : null}
      {/* Show Bar Owner Dashboard for Bar Admins */}
      {user?.role === EUserRole.BarAdmin ? TabScreenBarOwner() : null}
      {TabScreenProfileLogged()}
      {TabShop()}
      {TabScreenFAQ() /* ✅ FAQ visible again */}
    </Tab.Navigator>
  );
};

const AppTabNavigator = () => {
  useEffect(() => {
    NavigatorBarSettings();
  }, []);

  return (
    <Tab.Navigator
      key={`tab-navigator-not-logged`}
      tabBar={(props) => <CustomTabNavigator {...props} />}
      initialRouteName={'HomeTab'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BaseColors.primary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderColor: BaseColors.contentSwitcherBackgroundCOlor,
          backgroundColor: BaseColors.backgroundColor,
          paddingBottom: 0,
          paddingTop: 10,
          height: 110,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 12,
        },
      }}
    >
      {TabScreenHome()}
      {TabScreenBilliards()}
      {TabScreenProfile()}
      {TabScreenFAQ() /* ✅ FAQ visible for logged-out users too */}
    </Tab.Navigator>
  );
};

/* ---------- Root Container ---------- */
export default function AppNavigator() {
  const { isLogged, user } = useContextAuth();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Set the navigation reference for deep linking
    if (navigationRef.current) {
      DeepLinkingService.setNavigationRef(navigationRef.current);
    }
  }, [navigationRef.current]);

  if (isLogged)
    return (
      <NavigationContainer
        ref={navigationRef}
        key={'logged-navigation-container'}
        theme={DarkNavTheme}
      >
        {AppTabNavigatorLogged(user as ICAUserData)}
      </NavigationContainer>
    );

  return (
    <NavigationContainer
      ref={navigationRef}
      key={'not-logged-navigation-container'}
      theme={DarkNavTheme}
    >
      {AppTabNavigator()}
    </NavigationContainer>
  );
}
