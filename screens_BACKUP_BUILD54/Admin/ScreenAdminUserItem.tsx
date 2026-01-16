import { View } from "react-native";
import { BaseColors, BasePaddingsMargins } from "../../hooks/Template";
import LFCheckBox from "../../components/LoginForms/LFCheckBox";
import ProfileHeadingAdminV2 from "./ProfileHeadingAdminV2";
import LFInput from "../../components/LoginForms/LFInput";
import { EUserRole, ICAUserData, UserRoles } from "../../hooks/InterfacesGlobal";
import { UpdateProfile } from "../../ApiSupabase/CrudUser";
import LFButton from "../../components/LoginForms/Button/LFButton";
import { useContextAuth } from "../../context/ContextAuth";
import ScreenAdminUserModalEditor from "./ScreenAdminUserModalEditor";
import { useState } from "react";

export default function ScreenAdminUserItem(
  {
    userFromTheList,
    __DeleteUser,
    onSubmitUpdateUserButton
  }
  :
  {
    userFromTheList: ICAUserData,
    __DeleteUser: (u: ICAUserData)=>void,
    onSubmitUpdateUserButton?: ()=>void
  }
){

  const {
    user
  } = useContextAuth();

  const [ScreenAdminUserModalEditor_visible, set_ScreenAdminUserModalEditor_visible] = useState<boolean>(false);

  return <><View style={[
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: BaseColors.secondary,
      borderWidth: 1,
      borderStyle: 'solid',
      marginBottom: 0,
      paddingVertical: BasePaddingsMargins.m5
      // height: 20,
      // backgroundColor: 'red'
    }
  ]}>
    {
      /*<View style={[
      {
        width: 40
      }
    ]}>
      <LFCheckBox label="" />
    </View>*/
    }
    <View style={[
      {
        // width: 150,
        flex: 1
      }
    ]}>
      <ProfileHeadingAdminV2 user={userFromTheList} />
    </View>
    {/*<View style={[
      {
        width: 40,
        marginRight: BasePaddingsMargins.m5
      }
    ]}>
      <LFButton type="primary" size="small" icon="pencil" />
    </View>*/}
    {
      user?.role === EUserRole.MasterAdministrator?
      <>
      <View style={[
        {
          width: 40,
          marginRight: BasePaddingsMargins.m5
        }
      ]}>
        <LFButton type="primary" size="small" icon="pencil" onPress={()=>{
          set_ScreenAdminUserModalEditor_visible(true);
        }} />
      </View>
      <View style={[
        {
          width: 40
        }
      ]}>
        <LFButton type="danger" size="small" icon="trash" onPress={()=>{
          __DeleteUser(userFromTheList)
        }} />
      </View>
      </>
      :
      null
    }
    {/*<View style={[
      {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
      }
    ]}>
      <LFInput
        typeInput="dropdown"
        placeholder="User Role"
        defaultValue={userFromTheList.role}
        value={userFromTheList.role}
        marginBottomInit={0}
        // items={UserRoles.slice(1,UserRoles.length)}
        items={UserRoles}
        onChangeText={(text:string)=>{
          // Alert.alert('12');
          // // // // // // // // // // console.log('Updating the role of the user');
          // // // // // console.log('New role: ', text);
          UpdateProfile( userFromTheList.id, {role:text} ); 
        }}
      />
    </View>*/}
  </View>
  
  
  {
    ScreenAdminUserModalEditor_visible===true?
    <ScreenAdminUserModalEditor
        F_isOpened={set_ScreenAdminUserModalEditor_visible}
        isOpened={ScreenAdminUserModalEditor_visible}
        userForEditing={userFromTheList}
        onSubmitUpdateUserButton={onSubmitUpdateUserButton}
      />
    :
    null
  }
  

  </>
}