import { Text, View } from 'react-native';
import UIPanel from '../../components/UI/UIPanel';
import ProfileHeading from './ProfileHeading';
import LFButton from '../../components/LoginForms/Button/LFButton';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { useContextAuth } from '../../context/ContextAuth';
import { supabase } from '../../ApiSupabase/supabase';
import { useState } from 'react';
import ModalProfileEditor from './ModalProfileEditor';
import ModalEnableNotifications from '../../components/UI/UIModal/ModalEnableNotifications';

export default function PanelUserDetailsAndEditor() {
  const { user } = useContextAuth();

  const [modalProfileIsOpened, set_modalProfileIsOpened] =
    useState<boolean>(false);
  const [modalNotificationsIsOpened, set_modalNotificationsIsOpened] =
    useState<boolean>(false);

  const logout = async () => {
    try {
      console.log('Attempting to sign out...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
        // Still try to clear local state even if Supabase signOut fails
      } else {
        console.log('Successfully signed out from Supabase');
      }
    } catch (error) {
      console.error('Exception during sign out:', error);
    }
  };

  const ProfileDataDetails = [
    { label: 'Home State', data: user?.home_state },
    { label: 'Favorite Player', data: user?.favorite_player },
    { label: 'Favorite Game', data: user?.favorite_game },
  ];

  return (
    <>
      <UIPanel>
        <ProfileHeading />

        {/* Profile Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: BasePaddingsMargins.m15,
            gap: BasePaddingsMargins.m15,
            flexWrap: 'wrap',
          }}
        >
          <View style={{ minWidth: 120, maxWidth: 140 }}>
            <LFButton
              type="success"
              label="Edit Profile"
              icon="settings"
              size="small"
              onPress={() => {
                set_modalProfileIsOpened(true);
              }}
            />
          </View>
          <View style={{ minWidth: 100, maxWidth: 120 }}>
            <LFButton
              type="danger"
              label="Sign Out"
              icon="log-out"
              size="small"
              onPress={() => {
                logout();
              }}
            />
          </View>
          <View style={{ minWidth: 150, maxWidth: 180 }}>
            <LFButton
              type="primary"
              label="🔔 Notifications"
              size="small"
              onPress={() => {
                set_modalNotificationsIsOpened(true);
              }}
            />
          </View>
        </View>

        {ProfileDataDetails.map((data, key) => {
          return (
            <View
              key={`user-profile-details-item-${key}`}
              style={{
                marginBottom: BasePaddingsMargins.m20,
              }}
            >
              <Text
                style={{
                  color: BaseColors.othertexts,
                  fontSize: TextsSizes.small,
                  marginBottom:
                    key < ProfileDataDetails.length - 1
                      ? BasePaddingsMargins.m5
                      : 0,
                }}
              >
                {data.label}
              </Text>
              <Text
                style={{
                  color: BaseColors.light,
                  fontSize: TextsSizes.p,
                  fontWeight: 'bold',
                }}
              >
                {data.data}
              </Text>
            </View>
          );
        })}
      </UIPanel>
      <ModalProfileEditor
        isOpened={modalProfileIsOpened}
        F_isOpened={set_modalProfileIsOpened}
      />
      <ModalEnableNotifications
        visible={modalNotificationsIsOpened}
        setVisible={set_modalNotificationsIsOpened}
      />
    </>
  );
}
