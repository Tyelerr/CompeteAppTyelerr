import { Alert, Text, View } from 'react-native';
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

  // Success/Error modal states
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const __SendTheMessage = async () => {
    // Validation
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send a message.');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message before sending.');
      return;
    }

    if (
      questionType === 'Tournament Inquiry' &&
      tournament_id.trim() &&
      isNaN(Number(tournament_id.trim()))
    ) {
      Alert.alert('Error', 'Tournament ID must be a valid number.');
      return;
    }

    try {
      set_loading(true);

      // Convert questionType string to enum
      let messageTypeEnum: ESupportMessageType;
      switch (questionType) {
        case 'Tournament Inquiry':
          messageTypeEnum = ESupportMessageType.TournamentInquiry;
          break;
        case 'Technical Support':
          messageTypeEnum = ESupportMessageType.TechnicalSupport;
          break;
        case 'Account Issue':
          messageTypeEnum = ESupportMessageType.AccountIssue;
          break;
        case 'Feedback / Suggestion':
          messageTypeEnum = ESupportMessageType.FeedbackSuggestion;
          break;
        default:
          messageTypeEnum = ESupportMessageType.GeneralQuestion;
      }

      const result = await CreateSupportMessage(
        user,
        messageTypeEnum,
        message.trim(),
        tournament_id.trim() || undefined,
      );

      if (result.success) {
        console.log('Message sent successfully:', result.data);

        // Clear form
        set_message('');
        set_tournament_id('');
        set_questionType('General Question');

        // Show success modal
        setShowSuccessModal(true);
      } else {
        console.error('Failed to send message:', result.error);
        setErrorMessage(
          result.error?.message || 'Failed to send message. Please try again.',
        );
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Exception while sending message:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowErrorModal(true);
    } finally {
      set_loading(false);
    }
  };

  useEffect(() => {
    // console.log('User in Screen FAQsContact:', user);
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
          { label: 'General Question', value: 'General Question' },
          { label: 'Tournament Inquiry', value: 'Tournament Inquiry' },
          { label: 'Technical Support', value: 'Technical Support' },
          { label: 'Account Issue', value: 'Account Issue' },
          { label: 'Feedback / Suggestion', value: 'Feedback / Suggestion' },
        ]}
        onChangeText={(text) => {
          set_questionType(text !== '' ? text : 'General Question');
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
        value={message}
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

      {/* Success Modal */}
      <ModalInfoMessage
        id={1001}
        visible={showSuccessModal}
        title="Message Sent!"
        message="Your message has been sent successfully. Our support team will review it and get back to you soon."
        buttons={[
          <LFButton
            key="ok"
            type="primary"
            label="OK"
            onPress={() => setShowSuccessModal(false)}
          />,
        ]}
      />

      {/* Error Modal */}
      <ModalInfoMessage
        id={1002}
        visible={showErrorModal}
        title="Error"
        message={errorMessage}
        buttons={[
          <LFButton
            key="ok"
            type="primary"
            label="OK"
            onPress={() => setShowErrorModal(false)}
          />,
        ]}
      />
    </UIPanel>
  );
}
