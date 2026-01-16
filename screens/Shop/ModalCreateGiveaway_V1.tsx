// /screens/Shop/ModalCreateGiveaway_V1.tsx
// Simplified Giveaway v1 Modal - Entries Only, No Dates
import React, { useState, useCallback } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';
import { supabase } from '../../ApiSupabase/supabase';
import { UploadImage } from '../../ApiSupabase/UploadFiles';
import { BaseColors } from '../../hooks/Template';
import { StyleModal } from '../../assets/css/styles';

export default function ModalCreateGiveaway_V1({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated?: (row: any) => void;
}) {
  // -------- Core Fields Only --------
  const [title, setTitle] = useState('');
  const [prizeName, setPrizeName] = useState('');
  const [prizeArv, setPrizeArv] = useState('');
  const [description, setDescription] = useState('');
  const [maxEntries, setMaxEntries] = useState('500');
  const [claimPeriodDays, setClaimPeriodDays] = useState('7');
  const [eligibilityText, setEligibilityText] = useState('');

  // Image upload
  const [prizeImageUrl, setPrizeImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState('');

  // Handle image upload
  const handleImageUpload = async () => {
    setUploadingImage(true);

    try {
      if (Platform.OS !== 'web') {
        const { granted } = await requestMediaLibraryPermissionsAsync();
        if (!granted) {
          Alert.alert(
            'Permission denied',
            'Sorry, we need camera roll permissions to upload images!',
          );
          setUploadingImage(false);
          return;
        }
      }

      const result = await launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        setUploadingImage(false);
        return;
      }

      const asset = result.assets[0];
      setUploadedImagePreview(asset.uri);

      if (asset.base64) {
        const uploadResult = await UploadImage(
          asset.uri.split('.').pop() || 'jpeg',
          asset.mimeType as string,
          asset.base64 as string,
        );

        if (uploadResult.error) {
          Alert.alert('Upload failed', uploadResult.error.message);
          setUploadedImagePreview('');
          setUploadingImage(false);
          return;
        }

        const { data } = await supabase.storage
          .from('images')
          .getPublicUrl(uploadResult.data?.path as string);

        setPrizeImageUrl(data.publicUrl);
        setUploadedImagePreview(data.publicUrl);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
      setUploadedImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  const closeAndReset = useCallback(() => {
    setTitle('');
    setPrizeName('');
    setPrizeArv('');
    setDescription('');
    setMaxEntries('500');
    setClaimPeriodDays('7');
    setEligibilityText('');
    setPrizeImageUrl('');
    setUploadedImagePreview('');
    onClose();
  }, [onClose]);

  const onSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a giveaway title.');
      return;
    }
    if (!prizeName.trim()) {
      Alert.alert('Missing prize name', 'Please enter the prize name.');
      return;
    }
    if (!prizeArv || Number(prizeArv) <= 0) {
      Alert.alert('Invalid prize value', 'Please enter a valid prize ARV.');
      return;
    }
    if (!maxEntries || Number(maxEntries) <= 0) {
      Alert.alert(
        'Invalid max entries',
        'Please enter a valid number of maximum entries.',
      );
      return;
    }

    const payload = {
      title: title.trim(),
      prize_name: prizeName.trim(),
      prize_arv: Number(prizeArv),
      description: description.trim() || null,
      prize_image_url: prizeImageUrl || null,
      max_entries: Number(maxEntries),
      entry_count_cached: 0,
      min_age: 18, // Hard-coded, not optional
      claim_period_days: Number(claimPeriodDays) || 7,
      eligibility_text: eligibilityText.trim() || null,
      status: 'active', // Always start as active
    };

    Alert.alert(
      'Confirm Giveaway Creation',
      `Create giveaway "${title}" with ${maxEntries} max entries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            const { data, error } = await supabase
              .from('giveaways')
              .insert(payload)
              .select('*')
              .single();

            if (error) {
              Alert.alert('Create failed', error.message);
              return;
            }

            Alert.alert('Success', 'Giveaway created and is now active!');
            onCreated?.(data);
            closeAndReset();
          },
        },
      ],
    );
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <Text style={{ color: '#bfbfbf', marginBottom: 6, fontWeight: '600' }}>
      {children}
    </Text>
  );

  const Input = ({
    value,
    onChangeText,
    placeholder,
    multiline,
    keyboardType,
  }: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric';
  }) => (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={'#7a7a7a'}
      multiline={!!multiline}
      keyboardType={keyboardType || 'default'}
      returnKeyType="done"
      onSubmitEditing={() => Keyboard.dismiss()}
      blurOnSubmit={true}
      style={{
        borderWidth: 1,
        borderColor: BaseColors.secondary,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: multiline ? 12 : Platform.OS === 'ios' ? 12 : 10,
        color: '#fff',
        backgroundColor: BaseColors.dark,
        minHeight: multiline ? 90 : undefined,
      }}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={closeAndReset}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={StyleModal.container}>
        <TouchableOpacity
          style={StyleModal.backgroundTouchableForClosing}
          onPress={closeAndReset}
          activeOpacity={1}
        />

        <KeyboardAvoidingView
          style={StyleModal.containerForFixedLayout}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Fixed Header */}
          <View style={StyleModal.fixedHeader}>
            <Text
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: '800',
              }}
            >
              + Create New Giveaway
            </Text>
            <Text style={{ color: '#7a7a7a', fontSize: 13, marginTop: 4 }}>
              Ends by entries only • Min age 18 • One entry per user
            </Text>
          </View>

          {/* Fixed Close Button */}
          <TouchableOpacity
            style={StyleModal.closeButtonFixed}
            onPress={closeAndReset}
          >
            <Text style={{ color: BaseColors.light, fontSize: 24 }}>×</Text>
          </TouchableOpacity>

          {/* Scrollable Content */}
          <ScrollView
            style={StyleModal.scrollableContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom: 30,
            }}
          >
            {/* Giveaway Title */}
            <View style={{ marginBottom: 16 }}>
              <Label>Giveaway Title *</Label>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Enter giveaway title"
              />
            </View>

            {/* Prize Name */}
            <View style={{ marginBottom: 16 }}>
              <Label>Prize Name *</Label>
              <Input
                value={prizeName}
                onChangeText={setPrizeName}
                placeholder="e.g., $500 Cash Prize"
              />
            </View>

            {/* Prize ARV */}
            <View style={{ marginBottom: 16 }}>
              <Label>Prize ARV (Approximate Retail Value) *</Label>
              <Input
                value={prizeArv}
                onChangeText={setPrizeArv}
                placeholder="500"
                keyboardType="numeric"
              />
              <Text style={{ color: '#7a7a7a', fontSize: 12, marginTop: 4 }}>
                Enter numeric value only (e.g., 500 for $500)
              </Text>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 16 }}>
              <Label>Description</Label>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your giveaway..."
                multiline
              />
            </View>

            {/* Max Entries */}
            <View style={{ marginBottom: 16 }}>
              <Label>Maximum Entries *</Label>
              <Input
                value={maxEntries}
                onChangeText={setMaxEntries}
                keyboardType="numeric"
                placeholder="500"
              />
              <Text style={{ color: '#7a7a7a', fontSize: 12, marginTop: 4 }}>
                Giveaway will automatically close when this many entries are
                received
              </Text>
            </View>

            {/* Claim Period */}
            <View style={{ marginBottom: 16 }}>
              <Label>Claim Period (days)</Label>
              <Input
                value={claimPeriodDays}
                onChangeText={setClaimPeriodDays}
                keyboardType="numeric"
                placeholder="7"
              />
              <Text style={{ color: '#7a7a7a', fontSize: 12, marginTop: 4 }}>
                Days winner has to claim prize (default: 7)
              </Text>
            </View>

            {/* Eligibility Text */}
            <View style={{ marginBottom: 16 }}>
              <Label>Additional Eligibility Requirements</Label>
              <Input
                value={eligibilityText}
                onChangeText={setEligibilityText}
                placeholder="e.g., Must be a US resident, etc."
                multiline
              />
            </View>

            {/* Prize Image */}
            <View style={{ marginBottom: 16 }}>
              <Label>Prize Image</Label>

              <TouchableOpacity
                onPress={handleImageUpload}
                disabled={uploadingImage}
                style={{
                  borderWidth: 1,
                  borderColor: BaseColors.secondary,
                  borderRadius: 10,
                  padding: 16,
                  backgroundColor: BaseColors.dark,
                  marginBottom: 12,
                  opacity: uploadingImage ? 0.6 : 1,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={24}
                    color={BaseColors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}
                  >
                    {uploadingImage
                      ? 'Uploading...'
                      : uploadedImagePreview
                      ? 'Change Image'
                      : 'Upload Prize Image'}
                  </Text>
                </View>

                {uploadedImagePreview && !uploadingImage ? (
                  <View
                    style={{
                      marginTop: 12,
                      borderRadius: 8,
                      overflow: 'hidden',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      source={{ uri: uploadedImagePreview }}
                      style={{
                        width: '100%',
                        height: 150,
                        resizeMode: 'cover',
                      }}
                    />
                  </View>
                ) : null}
              </TouchableOpacity>

              <View>
                <Text
                  style={{
                    color: '#7a7a7a',
                    fontSize: 13,
                    marginBottom: 6,
                    fontWeight: '600',
                  }}
                >
                  Or paste image URL
                </Text>
                <Input
                  value={prizeImageUrl}
                  onChangeText={(text) => {
                    setPrizeImageUrl(text);
                    if (text) {
                      setUploadedImagePreview(text);
                    }
                  }}
                  placeholder="https://..."
                />
              </View>
            </View>

            {/* Info Box */}
            <View
              style={{
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(33, 150, 243, 0.3)',
                borderRadius: 10,
                padding: 16,
                marginTop: 8,
              }}
            >
              <Text
                style={{ color: '#2196F3', fontWeight: '700', marginBottom: 8 }}
              >
                ℹ️ Giveaway v1 Rules
              </Text>
              <Text style={{ color: '#bfbfbf', fontSize: 13, lineHeight: 20 }}>
                • Minimum age: 18 (enforced automatically){'\n'}• Ends by
                entries only (no end dates){'\n'}• One entry per user (database
                enforced){'\n'}• Admin-only winner selection{'\n'}• 1-minute
                lock during winner draw
              </Text>
            </View>
          </ScrollView>

          {/* Fixed Footer */}
          <View style={StyleModal.fixedFooter}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={closeAndReset}
                  style={{
                    borderWidth: 1,
                    borderColor: BaseColors.secondary,
                    borderRadius: 10,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={onSubmit}
                  style={{
                    backgroundColor: BaseColors.primary,
                    borderRadius: 10,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    Create Giveaway
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
