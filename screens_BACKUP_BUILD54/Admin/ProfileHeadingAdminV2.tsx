import { Image, Text, View } from "react-native";
import { BaseColors, BasePaddingsMargins, TextsSizes } from "../../hooks/Template";
import UIBadge from "../../components/UI/UIBadge";
import { ICAUserData, useContextAuth } from "../../context/ContextAuth";

export default function ProfileHeadingAdminV2({
  user
}:
{
  user:ICAUserData
}){

  /*const {
    user
  } = useContextAuth();*/

  // user.

  return <View style={{
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    // marginBottom: BasePaddingsMargins.m30
  }}>
    <Image source={{
      uri: user.profile_image_url!=='' && user.profile_image_url!==undefined ? user.profile_image_url : 'https://placehold.co/600x400/png',
    }}
    style={{
      width: 30,
      height: 30,
      borderRadius: 0,
      marginRight: BasePaddingsMargins.m15
    }}
    />
    <View style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      // flex: 1,
      // justifyContent: 'center'
    }}>
      <Text style={{
        fontSize: TextsSizes.small,
        color: BaseColors.title,
        // marginBottom: BasePaddingsMargins.m5,
        width: '100%'
      }}>Username: {user?.user_name}</Text>
      <Text style={{
        fontSize: TextsSizes.small,
        color: BaseColors.title,
        // marginBottom: BasePaddingsMargins.m5,
        width: '100%'
      }}>Role: {user?.role}</Text>
      <Text style={{
        fontSize: TextsSizes.small,
        color: BaseColors.title,
        // marginBottom: BasePaddingsMargins.m5,
        width: '100%'
      }}>{user?.email}</Text>
      <Text style={{
        fontSize: TextsSizes.small,
        color: BaseColors.title,
        // marginBottom: BasePaddingsMargins.m5,
        width: '100%'
      }}>User ID: {user.id_auto}</Text>
    </View>
  </View>
}