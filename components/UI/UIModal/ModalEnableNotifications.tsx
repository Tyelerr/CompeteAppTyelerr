import React from 'react';
import { View } from 'react-native';
import ModalInfoMessage from './ModalInfoMessage';
import LFButton from '../../LoginForms/Button/LFButton';
import {
  enableNotifications,
  showOpenSettingsAlert,
} from '../../../utils/NotificationUtils';

interface ModalEnableNotificationsProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const ModalEnableNotifications: React.FC<ModalEnableNotificationsProps> = ({
  visible,
  setVisible,
}) => {
  const handleEnableNotifications = async () => {
    const result = await enableNotifications();

    if (result.success) {
      // Show success message
      alert('Notifications enabled');
      setVisible(false);
    } else {
      // If failed due to denied permissions, show settings alert
      if (result.message.includes('Permission not granted')) {
        showOpenSettingsAlert();
      } else {
        alert(`Failed to enable notifications: ${result.message}`);
      }
      setVisible(false);
    }
  };

  return (
    <ModalInfoMessage
      id={0}
      visible={visible}
      set_visible={setVisible}
      title="Enable Notifications"
      message="Turn on notifications to get alerts and updates."
      buttons={[
        <LFButton
          label="Not now"
          type="secondary"
          size="small"
          onPress={() => {
            setVisible(false);
          }}
        />,
        <LFButton
          label="Enable Notifications"
          type="primary"
          size="small"
          icon="notifications"
          onPress={handleEnableNotifications}
        />,
      ]}
    />
  );
};

export default ModalEnableNotifications;
