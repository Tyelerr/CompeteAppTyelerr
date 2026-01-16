import React from 'react';
import { View } from 'react-native';
import ModalInfoMessage from './ModalInfoMessage';
import LFButton from '../../LoginForms/Button/LFButton';
import { openNotificationSettings } from '../../../utils/NotificationUtils';

interface ModalNotificationSettingsProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const ModalNotificationSettings: React.FC<ModalNotificationSettingsProps> = ({
  visible,
  setVisible,
}) => {
  return (
    <ModalInfoMessage
      id={0}
      visible={visible}
      set_visible={setVisible}
      title="Enable Notifications"
      message="To receive notifications for your search alerts, please enable notifications in your device settings."
      buttons={[
        <LFButton
          label="Cancel"
          type="secondary"
          size="small"
          onPress={() => {
            setVisible(false);
          }}
        />,
        <LFButton
          label="Open Settings"
          type="primary"
          size="small"
          icon="settings"
          onPress={() => {
            openNotificationSettings();
            setVisible(false);
          }}
        />,
      ]}
    />
  );
};

export default ModalNotificationSettings;
