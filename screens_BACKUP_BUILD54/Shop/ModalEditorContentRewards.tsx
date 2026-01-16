// screens/.../ModalEditorContentRewards.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import UIModalCloseButton from '../../components/UI/UIModal/UIModalCloseButton';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import LFInput from '../../components/LoginForms/LFInput';
import LFInputsGrid, {
  ILFInputGridInput,
} from '../../components/LoginForms/LFInputsGrid';
import LFButton from '../../components/LoginForms/Button/LFButton';
import {
  InsertContent,
  UpdateContent,
} from '../../ApiSupabase/CrudCustomContent';
import {
  ECustomContentType,
  ICustomContent,
} from '../../hooks/InterfacesGlobal';
import AttachImage from '../../components/UI/Attach/AttachImage';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getLocalTimestampWithoutTimezone } from '../../hooks/hooks';
import GlobalDoneBar from '../../components/UI/GlobalDoneBar'; // ⬅️ mount bar inside modal

export default function ModalEditorContentRewards({
  isOpened,
  F_isOpened,
  type,
  data_row,
  set_data_row,
  editOrCreate,
  afterCreatingNewGift,
  afterUpdatingTheGift,
}: {
  isOpened: boolean;
  F_isOpened: (b: boolean) => void;
  type: ECustomContentType;
  data_row: ICustomContent | null;
  set_data_row: (cc: ICustomContent) => void;
  editOrCreate?: 'edit' | 'create-new';
  afterCreatingNewGift?: () => void;
  afterUpdatingTheGift?: () => void;
}) {
  const [name, set_name] = useState<string>('');
  const [subtitle, set_subtitle] = useState<string>('');
  const [value, set_value] = useState<number>(0);
  const [label_about_the_person, set_label_about_the_person] =
    useState<string>('');
  const [address, set_address] = useState<string>('');
  const [description, set_description] = useState<string>('');
  const [features, set_features] = useState<string>('');
  const [giveawy_rules, set_giveawy_rules] = useState<string>('');
  const [date_ends, set_date_ends] = useState<Date>(new Date());

  const [list, set_list] = useState<ILFInputGridInput[][]>([]);
  const [labels, set_labels] = useState<ILFInputGridInput[][]>([]);

  const [phone_number, set_phone_number] = useState<string>('');

  const [reward_picture, set_reward_picture] = useState<string>('');
  const [reward_link, set_reward_link] = useState<string>('');
  const [entries, set_entries] = useState<number>(0);

  const [loading, set_loading] = useState<boolean>(false);

  const __dataForSupabase = (): ICustomContent => {
    return {
      type,
      name,
      label_about_the_person,
      address,
      description,
      list,
      labels,
      phone_number,
      value,
      features,
      giveawy_rules,
      subtitle,
      reward_link,
      reward_picture,
      entries,
      date_ends: getLocalTimestampWithoutTimezone(date_ends),
    } as ICustomContent;
  };

  const ___CreateTheReward = async () => {
    set_loading(true);
    const newContent: ICustomContent = __dataForSupabase();
    const { data, error } = await InsertContent(newContent);
    set_data_row(newContent);
    set_loading(false);
    F_isOpened(false);
    afterCreatingNewGift?.();
  };

  const ___UpdateTheReward = async () => {
    if (data_row === null) return;
    set_loading(true);
    const updatedContent: ICustomContent = __dataForSupabase();
    const { data, error } = await UpdateContent(updatedContent, data_row?.id);
    set_data_row(updatedContent);
    set_loading(false);
    F_isOpened(false);
    afterUpdatingTheGift?.();
  };

  useEffect(() => {
    if (data_row !== null) {
      const d = data_row as ICustomContent;
      set_name(d.name);
      set_label_about_the_person(d.label_about_the_person);
      set_address(d.address);
      set_description(d.description);
      set_list(d.list);
      set_labels(d.labels);
      set_phone_number(d.phone_number);
      set_reward_picture(d.reward_picture);
      set_reward_link(d.reward_link);
      set_entries(d.entries !== null ? d.entries : 0);
      set_subtitle(d.subtitle !== null ? d.subtitle : '');
      set_value(d.value !== null ? d.value : 0);
      set_features(d.features !== null ? d.features : '');
      set_giveawy_rules(d.giveawy_rules !== null ? d.giveawy_rules : '');
      set_date_ends(d.date_ends !== null ? new Date(d.date_ends) : new Date());
    }
  }, [isOpened]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isOpened}
      statusBarTranslucent
      presentationStyle="overFullScreen" // reduces flicker on iOS
    >
      {/* Global iOS Done bar inside the modal */}
      {/* {Platform.OS === "ios" && <GlobalDoneBar />} */}

      <View
        style={[StyleModal.container, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
      >
        {/* Tap outside to close */}
        <TouchableOpacity
          style={[StyleModal.backgroundTouchableForClosing]}
          activeOpacity={1}
          onPress={() => F_isOpened(false)}
        />

        {/* Keyboard avoiding to prevent jumps, with dark bg to avoid white flash */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, width: '100%' }}
        >
          <View
            style={[
              StyleModal.containerForScrollingView,
              { backgroundColor: 'transparent' },
            ]}
          >
            <ScrollView
              style={[StyleModal.scrollView]}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="always"
            >
              <View style={[StyleModal.contentView]}>
                <UIModalCloseButton F_isOpened={F_isOpened} />

                <View style={[StyleModal.headingContainer]}>
                  <Text style={[StyleModal.heading]}>Reward Editor</Text>
                </View>

                <LFInput
                  label="Title"
                  placeholder="Enter Title"
                  value={name}
                  onChangeText={set_name}
                />
                <LFInput
                  label="Subtitle"
                  placeholder="Enter Subtitle"
                  value={subtitle}
                  onChangeText={set_subtitle}
                />

                <View
                  style={{
                    marginBottom: BasePaddingsMargins.formInputMarginLess,
                  }}
                >
                  <Text
                    style={[StyleZ.p, { marginBottom: BasePaddingsMargins.m5 }]}
                  >
                    End Date
                  </Text>
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={date_ends}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) set_date_ends(selectedDate);
                    }}
                  />
                </View>

                <LFInput
                  label="Prize Value (USD)"
                  placeholder="Enter Value"
                  value={String(value ?? 0)}
                  onChangeText={(s: string) => set_value(Number(s))}
                  keyboardType="number-pad"
                />

                <LFInput
                  label="Entries"
                  placeholder="Enter Entries"
                  value={String(entries ?? 0)}
                  onChangeText={(s: string) => set_entries(Number(s))}
                  keyboardType="number-pad"
                />

                <LFInput
                  label="Description"
                  placeholder="Enter Description"
                  typeInput="textarea"
                  value={description}
                  onChangeText={set_description}
                />
                <LFInput
                  label="Features"
                  placeholder="Enter Features"
                  typeInput="textarea"
                  value={features}
                  onChangeText={set_features}
                  description="Each new line is another item"
                />
                <LFInput
                  label="Giveaway Rules"
                  placeholder="Enter Giveaway Rules"
                  typeInput="textarea"
                  value={giveawy_rules}
                  onChangeText={set_giveawy_rules}
                  description="Each new line is another item"
                />

                <LFInput
                  label="Reward Photo URL"
                  placeholder="Enter Reward Photo URL"
                  value={reward_picture}
                  onChangeText={set_reward_picture}
                  description="If you don't attach a photo, you can paste an image URL here."
                />

                <Text
                  style={{
                    color: BaseColors.othertexts,
                    fontSize: TextsSizes.p,
                    marginBottom: BasePaddingsMargins.m5,
                  }}
                >
                  Reward Picture
                </Text>
                <AttachImage
                  set_thumbnailType={() => {}}
                  set_thumbnail_url={(url: string) => set_reward_picture(url)}
                  onStartAttaching={() => set_loading(true)}
                  onEndAttaching={() => set_loading(false)}
                  defaultUrl={reward_picture}
                />

                <LFInput
                  iconFront="link"
                  label="Reward Link"
                  placeholder="Enter Reward Link"
                  value={reward_link}
                  onChangeText={set_reward_link}
                />

                {editOrCreate === 'create-new' ? (
                  <LFButton
                    loading={loading}
                    label="Create The Reward"
                    icon="add"
                    type="primary"
                    onPress={___CreateTheReward}
                  />
                ) : (
                  <LFButton
                    loading={loading}
                    label="Update The Reward"
                    type="primary"
                    onPress={___UpdateTheReward}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
