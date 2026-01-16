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
import { useEffect, useState } from 'react';
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
import FormUserEditor from './FormUserEditor_NoCityField';

export default function ModalProfileEditor({
  isOpened,
  F_isOpened,
}: {
  isOpened: boolean;
  F_isOpened: (v: boolean) => void;
}) {
  const { user, set_user } = useContextAuth();
  const [formSaveFunction, setFormSaveFunction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [isFormLoading, setIsFormLoading] = useState(false);

  const handleSave = async () => {
    console.log('=== ModalProfileEditor: handleSave called ===');
    console.log('formSaveFunction exists:', !!formSaveFunction);
    // Trigger save from the FormUserEditor component
    if (formSaveFunction) {
      console.log('Calling formSaveFunction...');
      await formSaveFunction();
    } else {
      console.log('ERROR: formSaveFunction is null or undefined!');
    }
  };

  const handleCancel = () => {
    F_isOpened(false);
  };

  const handleSaveFunctionFromForm = (
    saveFunc: () => Promise<void>,
    isLoading: boolean,
  ) => {
    console.log(
      '=== ModalProfileEditor: handleSaveFunctionFromForm called ===',
    );
    console.log('saveFunc exists:', !!saveFunc);
    console.log('isLoading:', isLoading);
    setFormSaveFunction(() => saveFunc);
    setIsFormLoading(isLoading);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpened}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      {/*KeyboardAvoidingView is to see the inputs when they are focused*/}
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={StyleModal.container}>
          <TouchableOpacity
            style={[StyleModal.backgroundTouchableForClosing]}
            onPress={() => {
              F_isOpened(false);
            }}
          />

          <View style={[StyleModal.containerForFixedLayout]}>
            {/* Fixed Header with Close Button and Title */}
            <View style={StyleModal.fixedHeader}>
              <Text style={StyleModal.heading}>Update Profile</Text>
            </View>
            {/* Absolutely positioned close button */}
            <View style={StyleModal.closeButtonFixed}>
              <LFButton
                type="danger"
                label=""
                icon="close"
                size="small"
                onPress={() => {
                  F_isOpened(false);
                }}
              />
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={StyleModal.scrollableContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingTop: 20,
                paddingBottom: 30,
              }}
            >
              <FormUserEditor
                userThatNeedToBeEdited={user as ICAUserData}
                EventAfterUpdatingTheUser={(updatedUser: ICAUserData) => {
                  set_user(updatedUser);
                  F_isOpened(false);
                }}
                EventAfterCancelUpdating={() => {
                  F_isOpened(false);
                }}
                onSaveFunction={handleSaveFunctionFromForm}
              />
            </ScrollView>

            {/* Fixed Footer with Action Buttons */}
            <View style={StyleModal.fixedFooter}>
              <LBButtonsGroup
                buttons={[
                  <LFButton
                    loading={isFormLoading}
                    label="Save Changes"
                    type="primary"
                    icon="save"
                    onPress={handleSave}
                  />,
                  <LFButton
                    label="Cancel"
                    type="danger"
                    onPress={handleCancel}
                  />,
                ]}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
