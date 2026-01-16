import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { StyleZ } from '../../assets/css/styles';
import { BasePaddingsMargins, BaseColors } from '../../hooks/Template';
import LFInput from '../../components/LoginForms/LFInput';
import { callUpdateUserEmail } from '../../ApiSupabase/EdgeFunctionService';
import { FetchProfileData } from '../../ApiSupabase/CrudUser';
import { ICAUserData } from '../../hooks/InterfacesGlobal';
import { useContextAuth } from '../../context/ContextAuth';

export default function ModalUpdateEmail({
  visible,
  onClose,
  currentEmail,
  userId,
}: {
  visible: boolean;
  onClose: () => void;
  currentEmail: string;
  userId: string;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { set_user } = useContextAuth();

  const handleUpdateEmail = async () => {
    // Validation
    if (!newEmail || newEmail.trim() === '') {
      setErrorMessage('Please enter a new email address');
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setErrorMessage('New email must be different from current email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!currentPassword || currentPassword.trim() === '') {
      setErrorMessage('Please enter your current password to confirm');
      return;
    }

    // Show confirmation
    Alert.alert(
      'Confirm Email Change',
      `Are you sure you want to change your email from "${currentEmail}" to "${newEmail.trim()}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            setIsLoading(true);
            setErrorMessage('');

            try {
              console.log('=== Calling Edge Function for email update ===');
              console.log('New email:', newEmail.trim());

              const result = await callUpdateUserEmail(
                newEmail.trim(),
                currentPassword.trim(),
              );

              console.log('=== Edge Function result ===', result);

              if (result.success) {
                // Fetch updated user data
                const updatedUserData = await FetchProfileData(userId);

                if (updatedUserData.user) {
                  set_user(updatedUserData.user as ICAUserData);
                }

                Alert.alert('Success!', 'Email updated successfully!', [
                  {
                    text: 'OK',
                    onPress: () => {
                      setNewEmail('');
                      setCurrentPassword('');
                      onClose();
                    },
                  },
                ]);
              } else {
                const errorMsg =
                  result.message || result.error || 'Failed to update email';
                setErrorMessage(errorMsg);
              }
            } catch (error) {
              console.error('Error updating email:', error);
              setErrorMessage('An error occurred. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleClose = () => {
    setNewEmail('');
    setCurrentPassword('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <View
        style={{
          paddingTop: Platform.OS === 'ios' ? 54 : 24,
          paddingHorizontal: 16,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: BaseColors.PanelBorderColor,
          backgroundColor: '#0c0c0c',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
          Update Email Address
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#0c0c0c' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {errorMessage !== '' && (
          <View
            style={{
              marginBottom: BasePaddingsMargins.formInputMarginLess,
            }}
          >
            <Text
              style={[
                StyleZ.LFErrorMessage,
                StyleZ.LFErrorMessage_addon_centered,
              ]}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Current Email (Read-only) */}
        <View
          style={{
            marginBottom: BasePaddingsMargins.formInputMarginLess,
          }}
        >
          <Text style={[StyleZ.loginFormInputLabel]}>Current Email</Text>
          <View
            style={{
              backgroundColor: '#1a1a1a',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
            }}
          >
            <Text style={{ color: '#999', fontSize: 16 }}>{currentEmail}</Text>
          </View>
        </View>

        {/* Current Password */}
        <LFInput
          keyboardType="default"
          label="Current Password"
          placeholder="Enter your current password"
          value={currentPassword}
          isPassword={true}
          description="Required for security verification"
          onChangeText={(text: string) => {
            setCurrentPassword(text);
            setErrorMessage('');
          }}
          disableAccessoryBar={true}
        />

        {/* New Email */}
        <LFInput
          keyboardType="email-address"
          label="New Email Address"
          placeholder="Enter your new email address"
          value={newEmail}
          onChangeText={(text: string) => {
            setNewEmail(text);
            setErrorMessage('');
          }}
          disableAccessoryBar={true}
        />

        <View style={{ marginTop: 10, marginBottom: 20 }}>
          <Text style={{ color: '#999', fontSize: 14, lineHeight: 20 }}>
            For security, you must enter your current password to update your
            email address. Your email will be updated immediately after
            verification.
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={handleUpdateEmail}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading
                  ? BaseColors.secondary
                  : BaseColors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {isLoading ? 'Updating...' : 'Update Email'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              style={{
                backgroundColor: BaseColors.secondary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
