import { Alert, Button, Text, View } from 'react-native';
import ScreenScrollView from '../ScreenScrollView';
import LoginFormHeading from '../../components/LoginForms/LoginFormHeading';
import { StyleZ } from '../../assets/css/styles';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import LFForgotPasswordLink from '../../components/LoginForms/LFForgotPasswordLink';
import { demoCreate } from '../../ApiSupabase/CrudDemo';
import { useState } from 'react';
import { EInputValidation } from '../../components/LoginForms/Interface';
import { TheFormIsValid } from '../../hooks/Validations';
import { BasePaddingsMargins } from '../../hooks/Template';
import { SignIn } from '../../ApiSupabase/CrudUser';
import { ICrudUserData } from '../../ApiSupabase/CrudUserInterface';
import { ICAUserData, useContextAuth } from '../../context/ContextAuth';
// import { useNavigation } from "@react-navigation/native";

export default function ScreenProfileRegisterTest() {
  const { login } = useContextAuth();

  // const navigation = useNavigation();

  const TryToLogin = async () => {
    // Alert.alert(process.env.EXPO_PUBLIC_SUPABASE_URL);
    // Alert.alert('before');
    // Alert.alert('after');
    // Alert.alert('data', data)
    // Alert.alert('error')
    if (
      !TheFormIsValid([
        {
          value: email,
          validations: [EInputValidation.Email],
        },
        {
          value: password,
          validations: [EInputValidation.Password],
        },
        // [email, [EInputValidation.Email]],
        // [password, [EInputValidation.Password]]
      ])
    ) {
      setErrorForm('Please enter your email address and password to log in.');
      // Alert.alert('error')
      return;
    }

    // const { data, demo } = await demoCreate();

    set_loading(true);
    const { user, data, error } = await SignIn({
      email: email,
      password: password,
    } as ICrudUserData);

    if (error !== null) {
      // // // // // // // // // // console.log(error);
      setErrorForm('Invalid login credentials');
    } else {
      setErrorForm('');
      // // // // // // // // // // console.log('data after login: ', data);
      if (data !== null) {
        // login( data as ICAUserData );
        login(user);

        // setTimeout(()=>{}, 100)
      }
    }
    set_loading(false);
  };

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorForm, setErrorForm] = useState<string>('');
  const [loading, set_loading] = useState<boolean>(false);

  return (
    <ScreenScrollView>
      <View style={[StyleZ.loginFromContainer]}>
        <Button
          title="BBBBBB"
          onPress={() => {
            Alert.alert('12');
          }}
        />

        <LFForgotPasswordLink
          label="Need an account? Register"
          route="ScreenProfileRegister"
        />

        <Button
          title="BBBBBB"
          onPress={() => {
            Alert.alert('12');
          }}
        />
      </View>
    </ScreenScrollView>
  );
}
