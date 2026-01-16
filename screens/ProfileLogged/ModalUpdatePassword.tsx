import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { StyleZ } from '../../assets/css/styles';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { supabase } from '../../ApiSupabase/supabase';

export default function ModalUpdatePassword({
  isOpened,
  onClose,
}: {
  isOpened: boolean;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleUpdatePassword = async () => {
    console.log('=== ModalUpdatePassword: handleUpdatePassword called ===');

    // Validation
    if (!newPassword || newPassword.trim() === '') {
      setErrorMessage('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      setIsLoading(false);

      if (error) {
        console.error('Password update error:', error);
        setErrorMessage(error.message || 'Failed to update password');
        return;
      }

      // Clear fields
      setNewPassword('');
      setConfirmNewPassword('');
      setErrorMessage('');

      // Show success alert and close modal
      Alert.alert('Success', 'Password has been updated.', [
        {
          text: 'OK',
          onPress: () => {
            console.log('User acknowledged password update');
            onClose();
          },
        },
      ]);
    } catch (error) {
      setIsLoading(false);
      console.error('Password update exception:', error);
      setErrorMessage('Failed to update password. Please try again.');
    }
  };

  const handleCancel = () => {
    setNewPassword('');
    setConfirmNewPassword('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      visible={isOpened}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 500,
            backgroundColor: '#0c0c0c',
            borderRadius: 12,
            overflow: 'hidden',
            maxHeight: '80%',
          }}
        >
        {/* Header */}
        <View
          style={{
            paddingTop: Platform.OS === 'ios' ? 54 : 24,
            paddingHorizontal: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: BaseColors.PanelBorderColor,
            backgroundColor: '#0c0c0c',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
            Update Password
          </Text>
          <TouchableOpacity
            onPress={handleCancel}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: BaseColors.danger,
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="always"
        >
          {errorMessage !== '' && (
            <View
              style={{
                justifyContent: 'center',
                marginBottom: BasePaddingsMargins.sectionMarginBottom,
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

          <View style={StyleZ.loginForm}>
            <LFInput
              keyboardType="default"
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              isPassword={true}
              description="Minimum 6 characters"
              onChangeText={(text: string) => {
                setNewPassword(text);
                setErrorMessage('');
              }}
              disableAccessoryBar={true}
            />

            <LFInput
              keyboardType="default"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmNewPassword}
              isPassword={true}
              description="Must match new password"
              onChangeText={(text: string) => {
                setConfirmNewPassword(text);
                setErrorMessage('');
              }}
              disableAccessoryBar={true}
            />
          </View>
        </ScrollView>

        {/* Fixed Footer with Action Buttons */}
        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: BaseColors.PanelBorderColor,
            flexDirection: 'row',
            gap: 12,
            backgroundColor: '#0c0c0c',
          }}
        >
          <View style={{ flex: 1 }}>
            <LFButton type="danger" label="Cancel" onPress={handleCancel} />
          </View>
          <View style={{ flex: 1 }}>
            <LFButton
              type="success"
              label={isLoading ? 'Updating...' : 'Update Password'}
              icon="key"
              onPress={handleUpdatePassword}
              disabled={isLoading}
              loading={isLoading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
