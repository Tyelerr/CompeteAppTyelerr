import { Image, Text, View } from "react-native";
import { BaseColors, BasePaddingsMargins, TextsSizes } from "../../hooks/Template";
import UIBadge from "../../components/UI/UIBadge";
import { ICAUserData, useContextAuth } from "../../context/ContextAuth";

export default function ProfileHeadingAdmin({
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
    marginBottom: BasePaddingsMargins.m30
  }}>
    <Image source={{
      uri: user.profile_image_url!=='' && user.profile_image_url!==undefined ? user.profile_image_url : 'https://placehold.co/600x400/png',
    }}
    style={{
      width: 50,
      height: 50,
      borderRadius: 25,
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
        fontSize: TextsSizes.h4,
        color: BaseColors.title,
        marginBottom: BasePaddingsMargins.m5,
        width: '100%'
      }}>{user?.email.split('@')[0]}</Text>
      {/*<Text style={{
        fontSize: TextsSizes.h3,
        color: BaseColors.title
      }}>Tyelerr Hill</Text>*/}
      
      {/*<UIBadge label="PL-000007" marginBottom={BasePaddingsMargins.m5} />*/}

      <Text style={{
        fontSize: TextsSizes.p,
        color: BaseColors.othertexts,
        width: '100%'
      }}>
        Joined {(new Date(user?.created_at as string).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', // e.g., "July"
        day: '2-digit', // e.g., "02"
      }))}
      </Text>
    </View>
  </View>
}