import { Alert, Linking, Text, View } from 'react-native';
import UIPanel from '../../components/UI/UIPanel';
import { StyleZ } from '../../assets/css/styles';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { useContextAuth } from '../../context/ContextAuth';
import LFInput from '../../components/LoginForms/LFInput';
import { useEffect, useState } from 'react';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { CreateSupportMessage } from '../../ApiSupabase/CrudMessages';
import { ESupportMessageType } from '../../hooks/InterfacesGlobal';
import ModalInfoMessage from '../../components/UI/UIModal/ModalInfoMessage';

export default function ScreenFAQsContact() {
  const { user } = useContextAuth();

  const [questionType, set_questionType] = useState<string>('General Question');
  const [tournament_id, set_tournament_id] = useState<string>('');
  const [message, set_message] = useState<string>('');
  const [loading, set_loading] = useState<boolean>(false);

  // resend.com api key:

  const __SendTheMessage = async () => {
    /*
    To use resend we must have registered email on our custom domain and add that email in resend and validate it :), we don't have that now we will use mailto:
    try{
      set_loading(true)
      const { data, error } = await resend.emails.send({
        from: 'zlatkoflash@gmail.com', // MUST be a verified Resend domain/email
        to: 'zlatkoflash@gmail.com',
        subject: 'Testing Email',
        html: 'Testing HTML',
      });
      // // // // // // // // console.log('data email send:', data);
      // // // // // // // // console.log('error email send:', error);
      set_loading(false)
    } 
    catch(error){}*/

    const encodedSubject = encodeURIComponent(questionType);
    const encodedBody = encodeURIComponent(`
      ${questionType}\n\n\n
      ${tournament_id !== '' ? `Tournament ID: ${tournament_id}\n\n\n` : ''}
      Message:\n
      ${message}
    `);
    // const encodedCc = encodeURIComponent('zlatkoflash@gmail.com');
    // const encodedBcc = encodeURIComponent('zlatkoflash@gmail.com');

    let url = `mailto:zlatkoflash@gmail.com`;
    url += `?subject=${encodedSubject}`;
    url += `&body=${encodedBody}`;

    // if (cc) url += `&cc=${encodedCc}`;
    // if (bcc) url += `&bcc=${encodedBcc}`;

    try {
      // Check if the device can actually open this type of URL
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Error',
          'No email app found or unable to open email client. Please ensure you have an email app installed and configured.',
        );
      }
    } catch (error) {
      console.error(
        'An error occurred while trying to open email client:',
        error,
      );
      Alert.alert(
        'Error',
        'Failed to open email client due to an unexpected issue.',
      );
    }
  };

  useEffect(() => {
    // // // // // console.log('User in Screen FAQsContact:', user);
  }, []);

  return (
    <UIPanel>
      <Text style={[StyleZ.h2]}>Contact Support</Text>
      <Text
        style={[
          StyleZ.p,
          { marginBottom: BasePaddingsMargins.formInputMarginLess },
        ]}
      >
        Can't find what you're looking for? Send us a message and we'll help you
        out.
      </Text>
      <Text
        style={[
          StyleZ.h4,
          {
            marginBottom: BasePaddingsMargins.m10,
          },
        ]}
      >
        Account Information
      </Text>

      <View
        style={[
          {
            backgroundColor: BaseColors.secondary,
            borderRadius: BasePaddingsMargins.m10,
            padding: BasePaddingsMargins.m10,
            marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
          },
        ]}
      >
        {user !== null && user?.email !== undefined ? (
          <Text style={[StyleZ.h4, {}]}>
            Username:{' '}
            {user?.email.split('@')[0].charAt(0).toUpperCase() +
              user?.email.split('@')[0].slice(1)}
          </Text>
        ) : null}
        <Text style={[StyleZ.p]}>
          We'll use this information to respond to your message.
        </Text>
      </View>

      <LFInput
        label="Message Type"
        typeInput="dropdown"
        defaultValue="General Question"
        placeholder="General Question"
        items={[
          // {label: 'General Question', value: 'General Question'},
          { label: 'Tournament Inquiry', value: 'Tournament Inquiry' },
          { label: 'Technical Support', value: 'Technical Support' },
          { label: 'Account Issue', value: 'Account Issue' },
          { label: 'Feedback / Suggestion', value: 'Feedback / Suggestion' },
        ]}
        onChangeText={(text) => {
          set_questionType(text !== '' ? text : 'General Question');
          // // // // // // // // console.log('text:', text);
          set_tournament_id('');
        }}
      />

      {questionType === 'Tournament Inquiry' ? (
        <LFInput
          label="Tournament ID (Optional)"
          value={tournament_id}
          placeholder="Enter tournament ID"
          onChangeText={(text) => {
            set_tournament_id(text);
          }}
        />
      ) : null}

      <LFInput
        typeInput="textarea"
        label="Message"
        placeholder="Please describe your question or issue in detail..."
        onChangeText={(text) => {
          set_message(text);
        }}
      />

      <View style={[{ width: '50%' }]}>
        <LFButton
          type="primary"
          label="Send Message"
          loading={loading}
          onPress={() => {
            __SendTheMessage();
          }}
        />
      </View>
    </UIPanel>
  );
}
