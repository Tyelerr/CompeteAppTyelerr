import ScreenScrollView from "../ScreenScrollView";
import ScreenHomeSubNavigation from "./ScreenHomeSubNavigation";
import { View, Text, Alert } from "react-native";

export default function ScreenHomeBarOfTheMonth(){

  // // // // // // // // // // // console.log('AAAAA');
  // Alert.alert('AAAAA');

  return <ScreenScrollView>

    <ScreenHomeSubNavigation />

    <View>
      <Text>ScreenHomeBarOfTheMonth 2</Text>
    </View>

  </ScreenScrollView>
}