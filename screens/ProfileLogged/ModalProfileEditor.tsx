import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import LFButton from '../../components/LoginForms/Button/LFButton';
import LFInput from '../../components/LoginForms/LFInput';
import { EInputValidation } from '../../components/LoginForms/Interface';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useContextAuth } from '../../context/ContextAuth';
import { ICAUserData } from '../../hooks/InterfacesGlobal';
import { FetchProfileData, UpdateProfile } from '../../ApiSupabase/CrudUser';
import { TheFormIsValid } from '../../hooks/Validations';
import UIModalCloseButton from '../../components/UI/UIModal/UIModalCloseButton';
import { GameTypes } from '../../hooks/InterfacesGlobal';
import LBButtonsGroup from '../../components/LoginForms/Button/LBButtonsGroup';
import { CapitalizeWords } from '../../hooks/hooks';
import AttachImage from '../../components/UI/Attach/AttachImage';
import VenuesEditor from '../../components/google/VenuesEditor/VenuesEditor';
import FormUserEditor from './FormUserEditor';

export default function ModalProfileEditor({
  isOpened,
  F_isOpened,
}: {
  isOpened: boolean;
  F_isOpened: (v: boolean) => void;
}) {
  const { user, set_user } = useContextAuth();
  const [isFormLoading, setIsFormLoading] = useState(false);
  const formSaveFunctionRef = useRef<(() => Promise<void>) | null>(null);

  const handleSave = useCallback(async () => {
    console.log('=== ModalProfileEditor: handleSave PRESSED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('formSaveFunction exists:', !!formSaveFunctionRef.current);
    console.log('isFormLoading:', isFormLoading);

    if (formSaveFunctionRef.current) {
      console.log('Calling formSaveFunction...');
      try {
        await formSaveFunctionRef.current();
        console.log('formSaveFunction completed successfully');
      } catch (error) {
        console.error('Error in formSaveFunction:', error);
        Alert.alert('Error', `Exception in save: ${error}`);
      }
    } else {
      console.log('ERROR: formSaveFunction is null or undefined!');
      Alert.alert('Error', 'Save function not available. Please try again.');
    }
  }, [isFormLoading]);

  const handleCancel = useCallback(() => {
    console.log('=== ModalProfileEditor: handleCancel PRESSED ===');
    console.log('Timestamp:', new Date().toISOString());
    F_isOpened(false);
  }, [F_isOpened]);

  const handleClose = useCallback(() => {
    console.log('=== ModalProfileEditor: handleClose (X button) PRESSED ===');
    console.log('Timestamp:', new Date().toISOString());
    F_isOpened(false);
  }, [F_isOpened]);

  const handleSaveFunctionFromForm = useCallback(
    (saveFunc: () => Promise<void>, isLoading: boolean) => {
      console.log(
        '=== ModalProfileEditor: handleSaveFunctionFromForm called ===',
      );
      console.log('saveFunc exists:', !!saveFunc);
      console.log('isLoading:', isLoading);
      formSaveFunctionRef.current = saveFunc;
      setIsFormLoading(isLoading);
    },
    [],
  );

  return (
    <Modal
      visible={isOpened}
      animationType="fade"
      transparent={true}
      onRequestClose={() => F_isOpened(false)}
    >
      <View style={[StyleModal.container]}>
        <TouchableOpacity
          style={[StyleModal.backgroundTouchableForClosing]}
          onPress={handleClose}
        />

        <View style={[StyleModal.containerForScrollingView, { flex: 1 }]}>
          {/* Scrollable Content Area */}
          <ScrollView
            style={[StyleModal.scrollView, { flex: 1 }]}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
          >
            <View style={[StyleModal.contentView]}>
              <UIModalCloseButton F_isOpened={F_isOpened} />

              <Text style={[StyleZ.h2]}>Update Profile</Text>

              <FormUserEditor
                userThatNeedToBeEdited={user as ICAUserData}
                EventAfterUpdatingTheUser={async (updatedUser: ICAUserData) => {
                  // CRITICAL FIX: Close modal first, THEN update context
                  // This prevents the form from re-rendering while still open
                  F_isOpened(false);

                  // Wait a moment for modal to close, then fetch fresh data and update context
                  setTimeout(async () => {
                    const freshData = await FetchProfileData(
                      user?.id as string,
                    );
                    if (freshData.user) {
                      set_user(freshData.user as ICAUserData);
                    }
                  }, 300);
                }}
                EventAfterCancelUpdating={() => {
                  F_isOpened(false);
                }}
                onSaveFunction={handleSaveFunctionFromForm}
              />
            </View>
          </ScrollView>

          {/* Fixed Action Buttons at Bottom */}
          <View
            style={{
              backgroundColor: BaseColors.dark,
              borderTopWidth: 1,
              borderTopColor: BaseColors.secondary,
              paddingHorizontal: BasePaddingsMargins.m20,
              paddingVertical: BasePaddingsMargins.m15,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ width: '48%' }}>
              <LFButton
                type="danger"
                label="Cancel"
                onPress={handleCancel}
                disabled={isFormLoading}
              />
            </View>
            <View style={{ width: '48%' }}>
              <LFButton
                type="primary"
                label={isFormLoading ? 'Saving...' : 'Save Changes'}
                icon="save"
                onPress={handleSave}
                disabled={isFormLoading}
                loading={isFormLoading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
