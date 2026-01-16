// /screens/Shop/ModalCreateGiveaway_V1_Clean.tsx
// ============================================================================
// GIVEAWAY V1 - CREATE MODAL (CLEAN BUILD FROM SCRATCH)
// ============================================================================
// Simplified modal with only essential fields for Giveaway v1
// No tabs, no complex state management, just clean form inputs
// ============================================================================

import React, { useState, useRef } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  InputAccessoryView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';
import { supabase } from '../../ApiSupabase/supabase';
import { UploadImage } from '../../ApiSupabase/UploadFiles';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';

interface ModalCreateGiveawayProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (giveaway: any) => void;
}

export default function ModalCreateGiveaway_V1_Clean({
  visible,
  onClose,
  onCreated,
}: ModalCreateGiveawayProps) {
  // Form state - only essential fields
  const [title, setTitle] = useState('');
  const [prizeName, setPrizeName] = useState('');
  const [prizeArv, setPrizeArv] = useState('');
  const [description, setDescription] = useState('');
  const [maxEntries, setMaxEntries] = useState('500');
  const [claimPeriodDays, setClaimPeriodDays] = useState('7');
  const [eligibilityText, setEligibilityText] = useState('');
  const [prizeImageUrl, setPrizeImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Refs for text inputs (for keyboard navigation)
  const titleInputRef = useRef<TextInput>(null);
  const prizeNameInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const eligibilityInputRef = useRef<TextInput>(null);

  // InputAccessoryView IDs for iOS keyboard toolbar
  const inputAccessoryViewID = {
    title: 'titleInputAccessory',
    prizeName: 'prizeNameInputAccessory',
    description: 'descriptionInputAccessory',
    eligibility: 'eligibilityInputAccessory',
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setPrizeName('');
    setPrizeArv('');
    setDescription('');
    setMaxEntries('500');
    setClaimPeriodDays('7');
    setEligibilityText('');
    setPrizeImageUrl('');
  };

  // Close and reset
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Image upload
  const handleImageUpload = async () => {
    try {
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const asset = result.assets[0];
        const fileExtension =
          asset.uri.split('.').pop()?.toLowerCase() || 'jpeg';

        // Determine MIME type based on file extension
        const mimeTypeMap: { [key: string]: string } = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
        };
        const mimeType = mimeTypeMap[fileExtension] || 'image/jpeg';

        // Upload to 'images' bucket (UploadImage function uploads to 'images' bucket)
        const uploadResult = await UploadImage(
          fileExtension,
          mimeType,
          asset.base64 || '',
        );

        if (uploadResult && uploadResult.data) {
          // Get public URL from 'images' bucket
          const publicUrl = supabase.storage
            .from('images')
            .getPublicUrl(uploadResult.data.path).data.publicUrl;
          setPrizeImageUrl(publicUrl);
        }
        setUploadingImage(false);
      }
    } catch (error) {
      setUploadingImage(false);
      Alert.alert('Upload failed', (error as Error).message);
    }
  };

  // Keyboard navigation helpers
  const focusNextField = (nextRef: React.RefObject<TextInput>) => {
    nextRef.current?.focus();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a giveaway title');
      return;
    }
    if (!prizeName.trim()) {
      Alert.alert('Required', 'Please enter a prize name');
      return;
    }
    if (!prizeArv.trim() || isNaN(Number(prizeArv))) {
      Alert.alert('Required', 'Please enter a valid prize ARV (number)');
      return;
    }

    const maxEntriesNum = parseInt(maxEntries);
    if (isNaN(maxEntriesNum) || maxEntriesNum < 1) {
      Alert.alert('Invalid', 'Maximum entries must be at least 1');
      return;
    }

    const claimPeriodNum = parseInt(claimPeriodDays);
    if (isNaN(claimPeriodNum) || claimPeriodNum < 1) {
      Alert.alert('Invalid', 'Claim period must be at least 1 day');
      return;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        Alert.alert('Error', 'You must be logged in to create a giveaway');
        return;
      }

      const { data, error } = await supabase
        .from('giveaways')
        .insert({
          created_by: userId,
          title: title.trim(),
          prize_name: prizeName.trim(),
          prize_arv: parseFloat(prizeArv),
          prize_value: parseFloat(prizeArv), // Also set prize_value for display
          description: description.trim() || null,
          maximum_entries: maxEntriesNum, // ✅ FIXED: Use maximum_entries instead of max_entries
          claim_period_days: claimPeriodNum,
          eligibility_text: eligibilityText.trim() || null,
          prize_image_url: prizeImageUrl || null,
          status: 'active',
          min_age: 18, // Hard-coded as per v1 spec
          entry_count_cached: 0,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Giveaway created successfully!');
      if (onCreated) onCreated(data);
      handleClose();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#0c0c0c' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: BasePaddingsMargins.m15,
            borderBottomWidth: 1,
            borderBottomColor: BaseColors.secondary,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
            Create Giveaway
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: BasePaddingsMargins.m15 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Box */}
          <View
            style={{
              backgroundColor: 'rgba(0, 128, 255, 0.1)',
              borderWidth: 1,
              borderColor: '#0080FF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: '#0080FF',
                fontWeight: '700',
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              Giveaway v1 Rules
            </Text>
            <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>
              • Minimum age: 18 (enforced automatically){'\n'}• Ends by entries
              only (no end dates){'\n'}• One entry per user (database enforced)
              {'\n'}• Admin-only winner selection{'\n'}• 1-minute lock during
              winner draw
            </Text>
          </View>

          {/* Title */}
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
            Giveaway Title *
          </Text>
          <TextInput
            ref={titleInputRef}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter giveaway title"
            placeholderTextColor="#666"
            returnKeyType="next"
            onSubmitEditing={() => focusNextField(prizeNameInputRef)}
            blurOnSubmit={false}
            inputAccessoryViewID={
              Platform.OS === 'ios' ? inputAccessoryViewID.title : undefined
            }
            style={{
              backgroundColor: BaseColors.dark,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              padding: 14,
              color: '#fff',
              marginBottom: 20,
            }}
          />

          {/* Prize Name */}
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
            Prize Name *
          </Text>
          <TextInput
            ref={prizeNameInputRef}
            value={prizeName}
            onChangeText={setPrizeName}
            placeholder="e.g., iPad Pro, $500 Cash, etc."
            placeholderTextColor="#666"
            returnKeyType="next"
            onSubmitEditing={() => focusNextField(descriptionInputRef)}
            blurOnSubmit={false}
            inputAccessoryViewID={
              Platform.OS === 'ios' ? inputAccessoryViewID.prizeName : undefined
            }
            style={{
              backgroundColor: BaseColors.dark,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              padding: 14,
              color: '#fff',
              marginBottom: 20,
            }}
          />

          {/* Prize ARV */}
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
            Prize ARV (Approximate Retail Value) *
          </Text>
          <TextInput
            value={prizeArv}
            onChangeText={setPrizeArv}
            placeholder="Enter dollar amount (e.g., 500)"
            placeholderTextColor="#666"
            keyboardType="numeric"
            style={{
              backgroundColor: BaseColors.dark,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              padding: 14,
              color: '#fff',
              marginBottom: 20,
            }}
          />

          {/* Description */}
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
            Description
          </Text>
          <TextInput
            ref={descriptionInputRef}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the giveaway and prize"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            returnKeyType="default"
            blurOnSubmit={false}
            inputAccessoryViewID={
              Platform.OS === 'ios'
                ? inputAccessoryViewID.description
                : undefined
            }
            style={{
              backgroundColor: BaseColors.dark,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              padding: 14,
              color: '#fff',
              marginBottom: 20,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />

          {/* Maximum Entries */}
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
            Maximum Entries *
          </Text>
          <TextInput
            value={maxEntries}
            onChangeText={setMaxEntries}
            placeholder="500"
            placeholderTextColor="#666"
            keyboardType="numeric"
            style={{
              backgroundColor: BaseColors.dark,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              padding: 14,
              color: '#fff',
              marginBottom: 20,
            }}
          />

          {/* Claim Period */}
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
            Claim Period (days)
          </Text>
          <TextInput
            value={claimPeriodDays}
            onChangeText={setClaimPeriodDays}
            placeholder="7"
            placeholderTextColor="#666"
            keyboardType="numeric"
            style={{
              backgroundColor: BaseColors.dark,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              padding: 14,
              color: '#fff',
              marginBottom: 20,
            }}
          />

          {/* Additional Eligibility */}
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
            Additional Eligibility Requirements
          </Text>
          <TextInput
            ref={eligibilityInputRef}
            value={eligibilityText}
            onChangeText={setEligibilityText}
            placeholder="e.g., Must be a US resident"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            returnKeyType="default"
            blurOnSubmit={false}
            inputAccessoryViewID={
              Platform.OS === 'ios'
                ? inputAccessoryViewID.eligibility
                : undefined
            }
            style={{
              backgroundColor: BaseColors.dark,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              padding: 14,
              color: '#fff',
              marginBottom: 20,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />

          {/* Prize Image */}
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
            Prize Image
          </Text>
          <TouchableOpacity
            onPress={handleImageUpload}
            disabled={uploadingImage}
            style={{
              backgroundColor: BaseColors.dark,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              padding: 14,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            {prizeImageUrl ? (
              <Image
                source={{ uri: prizeImageUrl }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
                resizeMode="cover"
              />
            ) : null}
            <Text style={{ color: BaseColors.primary, fontWeight: '700' }}>
              {uploadingImage
                ? 'Uploading...'
                : prizeImageUrl
                ? 'Change Image'
                : 'Upload Prize Image'}
            </Text>
          </TouchableOpacity>

          {/* Bottom spacing for keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed Footer Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            padding: BasePaddingsMargins.m15,
            borderTopWidth: 1,
            borderTopColor: BaseColors.secondary,
            backgroundColor: '#0c0c0c',
          }}
        >
          <TouchableOpacity
            onPress={handleClose}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              flex: 1,
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

        {/* iOS InputAccessoryView Toolbars */}
        {Platform.OS === 'ios' && (
          <>
            {/* Title Input Toolbar */}
            <InputAccessoryView nativeID={inputAccessoryViewID.title}>
              <View
                style={{
                  backgroundColor: '#2c2c2c',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#444',
                }}
              >
                <TouchableOpacity
                  onPress={() => focusNextField(prizeNameInputRef)}
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: BaseColors.primary,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={dismissKeyboard}
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: BaseColors.primary,
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>

            {/* Prize Name Input Toolbar */}
            <InputAccessoryView nativeID={inputAccessoryViewID.prizeName}>
              <View
                style={{
                  backgroundColor: '#2c2c2c',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#444',
                }}
              >
                <TouchableOpacity
                  onPress={() => focusNextField(descriptionInputRef)}
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: BaseColors.primary,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={dismissKeyboard}
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: BaseColors.primary,
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>

            {/* Description Input Toolbar */}
            <InputAccessoryView nativeID={inputAccessoryViewID.description}>
              <View
                style={{
                  backgroundColor: '#2c2c2c',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#444',
                }}
              >
                <TouchableOpacity
                  onPress={() => focusNextField(eligibilityInputRef)}
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: BaseColors.primary,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={dismissKeyboard}
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: BaseColors.primary,
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>

            {/* Eligibility Input Toolbar (Last field - only Done button) */}
            <InputAccessoryView nativeID={inputAccessoryViewID.eligibility}>
              <View
                style={{
                  backgroundColor: '#2c2c2c',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: '#444',
                }}
              >
                <TouchableOpacity
                  onPress={dismissKeyboard}
                  style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: BaseColors.primary,
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
