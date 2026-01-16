// /screens/Shop/ModalCreateGiveaway.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
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
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { StyleModal } from '../../assets/css/styles';

type TabKey =
  | 'general'
  | 'rules'
  | 'winner'
  | 'notifications'
  | 'security'
  | 'legal';

export default function ModalCreateGiveaway({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated?: (row: any) => void;
}) {
  // -------- form state --------
  const [tab, setTab] = useState<TabKey>('general');

  const [title, setTitle] = useState('');
  const [prizeValue, setPrizeValue] = useState('500');
  const [description, setDescription] = useState('');
  const [prizeDetails, setPrizeDetails] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState('');
  const [endByMode, setEndByMode] = useState<'entries' | 'dates'>('dates');
  const [targetEntries, setTargetEntries] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [tournamentNumber, setTournamentNumber] = useState('');

  const [minAge, setMinAge] = useState('18');
  const [maxEntriesPer, setMaxEntriesPer] = useState('1');
  const [maximumEntries, setMaximumEntries] = useState('500');
  const [eligibility, setEligibility] = useState('');
  const [singleEntry, setSingleEntry] = useState(false);
  const [daily, setDaily] = useState(false);
  const [bonusReferrals, setBonusReferrals] = useState(false);
  const [bonusSocial, setBonusSocial] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(false);
  const [verifyId, setVerifyId] = useState(false);
  const [verifyReceipt, setVerifyReceipt] = useState(false);

  const [selectionMethod, setSelectionMethod] = useState<
    'random' | 'judged' | 'point_based'
  >('random');
  const [numWinners, setNumWinners] = useState('1');
  const [claimDays, setClaimDays] = useState('30');
  const [drawMode, setDrawMode] = useState<'auto_on_end' | 'manual'>(
    'auto_on_end',
  );
  const [backupWinners, setBackupWinners] = useState('0');

  const [publicWinnerDisplay, setPublicWinnerDisplay] = useState(false);
  const [winnerEmailTemplate, setWinnerEmailTemplate] = useState(
    "Congratulations! You've won...",
  );
  const [entryEmailTemplate, setEntryEmailTemplate] = useState(
    'Thank you for entering...',
  );
  const [announcementText, setAnnouncementText] = useState(
    "We're excited to announce the winner...",
  );

  const [ipCheck, setIpCheck] = useState(false);
  const [captcha, setCaptcha] = useState(false);
  const [blockedText, setBlockedText] = useState('');
  const [fraudNotes, setFraudNotes] = useState('');

  const [terms, setTerms] = useState('');
  const [privacyNotes, setPrivacyNotes] = useState('');
  const [geoRestrictions, setGeoRestrictions] = useState('');
  const [ageVerificationDone, setAgeVerificationDone] = useState(false);
  const [legalReviewDone, setLegalReviewDone] = useState(false);
  const [taxComplianceDone, setTaxComplianceDone] = useState(false);

  const Tabs = useMemo(
    () =>
      [
        { key: 'general', label: 'General' },
        { key: 'rules', label: 'Entry Rules' },
        { key: 'winner', label: 'Winner' },
        { key: 'notifications', label: 'Notifications' },
        { key: 'security', label: 'Security' },
        { key: 'legal', label: 'Legal' },
      ] as { key: TabKey; label: string }[],
    [],
  );

  // -------- helpers --------
  const parseDateMaybe = (s: string) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const computeStatus = (startISO: string | null, endISO: string | null) => {
    const now = new Date();
    if (!startISO || !endISO) return null;
    const s = new Date(startISO);
    const e = new Date(endISO);
    if (s.getTime() > now.getTime()) return 'scheduled';
    if (now.getTime() < e.getTime()) return 'active';
    return 'ended';
  };

  const blockedList = useMemo(
    () =>
      blockedText
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
    [blockedText],
  );

  // Handle image upload
  const handleImageUpload = async () => {
    setUploadingImage(true);

    try {
      // Request permissions on mobile
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

      // Launch image picker
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

      // Set preview immediately
      setUploadedImagePreview(asset.uri);

      // Upload to Supabase - FIXED: Correct parameter order
      if (asset.base64) {
        const fileExtension = asset.uri.split('.').pop() || 'jpeg';
        const mimeType = asset.mimeType || 'image/jpeg';

        // UploadImage expects: (fileExtension, mimeType, base64)
        const uploadResult = await UploadImage(
          fileExtension,
          mimeType,
          asset.base64,
        );

        if (uploadResult.error) {
          Alert.alert('Upload failed', uploadResult.error.message);
          setUploadedImagePreview('');
          setUploadingImage(false);
          return;
        }

        // Get public URL from the 'images' bucket
        if (uploadResult.data?.path) {
          const { data } = supabase.storage
            .from('images')
            .getPublicUrl(uploadResult.data.path);

          // Update image URL state
          setImageUrl(data.publicUrl);
          setUploadedImagePreview(data.publicUrl);
        } else {
          throw new Error('Upload succeeded but no path returned');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
      setUploadedImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  const closeAndReset = useCallback(() => {
    setTab('general');
    onClose();
  }, [onClose]);

  const onSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a giveaway title.');
      return;
    }

    const startISO = parseDateMaybe(startAt);
    const endISO = parseDateMaybe(endAt);

    if (startISO && endISO && new Date(endISO) <= new Date(startISO)) {
      Alert.alert('Invalid dates', 'End date must be after the start date.');
      return;
    }

    const maxEntries =
      endByMode === 'entries'
        ? targetEntries
          ? Number(targetEntries)
          : null
        : maximumEntries
        ? Number(maximumEntries)
        : null;

    const payload: any = {
      title: title.trim(),
      description,
      prize_details: prizeDetails,
      prize_image_url: imageUrl || null,
      prize_value: prizeValue ? Number(prizeValue) : null,
      start_at: startISO,
      end_at: endByMode === 'entries' ? null : endISO,
      timezone: timezone || 'UTC',
      tournament_id_unique_number: tournamentNumber
        ? Number(tournamentNumber)
        : null,

      single_entry: singleEntry,
      daily_entry_allowed: daily,
      min_age: minAge ? Number(minAge) : null,
      max_entries_per_person: maxEntriesPer ? Number(maxEntriesPer) : null,
      maximum_entries: maxEntries,
      eligibility_requirements: eligibility,

      selection_method: selectionMethod,
      number_of_winners: numWinners ? Number(numWinners) : 1,
      draw_mode: drawMode,
      claim_period_days: claimDays ? Number(claimDays) : 7,

      public_winner_display: publicWinnerDisplay,
      winner_email_template: winnerEmailTemplate,
      entry_email_template: entryEmailTemplate,
      announcement_text: announcementText,

      ip_check_enabled: ipCheck,
      captcha_enabled: captcha,
      blocked_list: blockedList,
      fraud_notes: fraudNotes,

      terms,
      privacy_notes: privacyNotes,
      geo_restrictions: geoRestrictions,
      age_verification_done: ageVerificationDone,
      legal_review_done: legalReviewDone,
      tax_compliance_done: taxComplianceDone,
    };

    // Show confirmation dialog BEFORE creating
    Alert.alert(
      'Confirm Giveaway Creation',
      'Are you sure you want to add this giveaway? It will be immediately active and visible to users.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            // Always set status to 'active' when creating
            payload.status = 'active';

            const { data, error } = await supabase
              .from('giveaways')
              .insert(payload)
              .select('*')
              .single();

            if (error) {
              Alert.alert('Create failed', error.message);
              return;
            }

            Alert.alert(
              'Success',
              'Giveaway has been created and is now active!',
            );
            onCreated?.(data);
            closeAndReset();
          },
        },
      ],
    );
  };

  // Close modal when tapping outside - do NOT dismiss keyboard
  const onBackgroundPress = useCallback(() => {
    // Don't dismiss keyboard when closing modal
    closeAndReset();
  }, [closeAndReset]);

  // -------- UI atoms --------
  const Label = useCallback(
    ({ children }: { children: React.ReactNode }) => (
      <Text style={{ color: '#bfbfbf', marginBottom: 6, fontWeight: '600' }}>
        {children}
      </Text>
    ),
    [],
  );

  const Input = useCallback(
    ({
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
    ),
    [],
  );

  const SwitchRow = useCallback(
    ({
      label,
      value,
      onValueChange,
    }: {
      label: string;
      value: boolean;
      onValueChange: (v: boolean) => void;
    }) => (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingVertical: 4,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12, flexShrink: 1 }}>
          <Text style={{ color: '#fff', flexWrap: 'wrap', fontSize: 15 }}>
            {label}
          </Text>
        </View>
        <View style={{ flexShrink: 0, width: 51, alignItems: 'flex-end' }}>
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#3e3e3e', true: BaseColors.primary }}
            thumbColor={value ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>
    ),
    [],
  );

  const Row = useCallback(
    ({ children }: { children: React.ReactNode }) => (
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          {children instanceof Array ? children[0] : children}
        </View>
        {children instanceof Array && children[1] ? (
          <View style={{ flex: 1 }}>{children[1]}</View>
        ) : null}
      </View>
    ),
    [],
  );

  const TabButton = useCallback(
    ({ k, label }: { k: TabKey; label: string }) => {
      const active = tab === k;
      return (
        <TouchableOpacity
          onPress={() => setTab(k)}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            marginRight: 8,
            backgroundColor: active ? BaseColors.primary : 'transparent',
            borderWidth: 1,
            borderColor: BaseColors.secondary,
          }}
        >
          <Text
            style={{ color: active ? '#fff' : '#cfcfcf', fontWeight: '700' }}
          >
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [tab],
  );

  // -------- panels - MEMOIZED to prevent re-renders --------
  const PanelGeneral = useMemo(
    () => (
      <View>
        <Row>
          <>
            <View>
              <Label>Giveaway Title</Label>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Enter giveaway title"
              />
            </View>
            <View>
              <Label>Prize Value</Label>
              <Input
                value={prizeValue}
                onChangeText={setPrizeValue}
                placeholder="$500"
                keyboardType="numeric"
              />
            </View>
          </>
        </Row>

        <View style={{ height: 12 }} />

        <View>
          <Label>Description</Label>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your giveaway..."
            multiline
          />
        </View>

        <View style={{ height: 12 }} />

        <View>
          <Label>Prize Details</Label>
          <Input
            value={prizeDetails}
            onChangeText={setPrizeDetails}
            placeholder="Detailed prize description..."
            multiline
          />
        </View>

        <View style={{ height: 12 }} />

        <View>
          <Label>End Giveaway By</Label>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => setEndByMode('dates')}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor:
                  endByMode === 'dates' ? BaseColors.primary : 'transparent',
                borderWidth: 1,
                borderColor: BaseColors.secondary,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: endByMode === 'dates' ? '#fff' : '#cfcfcf',
                  fontWeight: '700',
                }}
              >
                End by Dates
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEndByMode('entries')}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor:
                  endByMode === 'entries' ? BaseColors.primary : 'transparent',
                borderWidth: 1,
                borderColor: BaseColors.secondary,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: endByMode === 'entries' ? '#fff' : '#cfcfcf',
                  fontWeight: '700',
                }}
              >
                End by Entries
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {endByMode === 'dates' ? (
          <>
            <Row>
              <>
                <View>
                  <Label>Start Date</Label>
                  <Input
                    value={startAt}
                    onChangeText={setStartAt}
                    placeholder="mm/dd/yyyy hh:mm"
                  />
                </View>
                <View>
                  <Label>End Date</Label>
                  <Input
                    value={endAt}
                    onChangeText={setEndAt}
                    placeholder="mm/dd/yyyy hh:mm"
                  />
                </View>
              </>
            </Row>

            <View style={{ height: 12 }} />

            <View>
              <Label>Time Zone</Label>
              <Input
                value={timezone}
                onChangeText={setTimezone}
                placeholder="UTC, America/Chicago, etc."
              />
            </View>
          </>
        ) : (
          <View>
            <Label>Target Entries</Label>
            <Input
              value={targetEntries}
              onChangeText={setTargetEntries}
              keyboardType="numeric"
              placeholder="500"
            />
            <Text style={{ color: '#7a7a7a', fontSize: 12, marginTop: 4 }}>
              Giveaway will automatically end when this many entries are
              received
            </Text>
          </View>
        )}

        <View style={{ height: 12 }} />

        <View>
          <Label>Giveaway Image</Label>

          {/* Image Upload Button */}
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
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
                {uploadingImage
                  ? 'Uploading...'
                  : uploadedImagePreview
                  ? 'Change Image'
                  : 'Upload Image'}
              </Text>
            </View>

            {/* Image Preview */}
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

          {/* Optional: Manual URL Input */}
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
              value={imageUrl}
              onChangeText={(text) => {
                setImageUrl(text);
                if (text) {
                  setUploadedImagePreview(text);
                }
              }}
              placeholder="https://..."
            />
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View>
          <Label>Tournament # (optional)</Label>
          <Input
            value={tournamentNumber}
            onChangeText={setTournamentNumber}
            placeholder="1234"
            keyboardType="numeric"
          />
        </View>
      </View>
    ),
    [
      title,
      prizeValue,
      description,
      prizeDetails,
      endByMode,
      startAt,
      endAt,
      timezone,
      targetEntries,
      imageUrl,
      uploadingImage,
      uploadedImagePreview,
      tournamentNumber,
      Label,
      Input,
      Row,
      handleImageUpload,
    ],
  );

  const PanelRules = useMemo(
    () => (
      <View>
        <Row>
          <>
            <View>
              <Label>Minimum Age</Label>
              <Input
                value={minAge}
                onChangeText={setMinAge}
                keyboardType="numeric"
                placeholder="18"
              />
            </View>
            <View>
              <Label>Maximum Entries per Person</Label>
              <Input
                value={maxEntriesPer}
                onChangeText={setMaxEntriesPer}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>
          </>
        </Row>

        <View style={{ height: 12 }} />

        <View>
          <Label>Eligibility Requirements</Label>
          <Input
            value={eligibility}
            onChangeText={setEligibility}
            placeholder="Age, location, membership restrictions…"
            multiline
          />
        </View>

        <View style={{ height: 24 }} />

        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: '#bfbfbf',
              fontWeight: '700',
              marginBottom: 12,
              fontSize: 16,
            }}
          >
            Entry Methods
          </Text>
          <SwitchRow
            label="Single Entry"
            value={singleEntry}
            onValueChange={setSingleEntry}
          />
          <SwitchRow
            label="Daily Entry Allowed"
            value={daily}
            onValueChange={setDaily}
          />
          <SwitchRow
            label="Bonus Entries for Referrals"
            value={bonusReferrals}
            onValueChange={setBonusReferrals}
          />
          <SwitchRow
            label="Bonus Entries for Social Media"
            value={bonusSocial}
            onValueChange={setBonusSocial}
          />
        </View>

        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <Text
            style={{
              color: '#bfbfbf',
              fontWeight: '700',
              marginBottom: 12,
              fontSize: 16,
            }}
          >
            Verification Requirements
          </Text>
          <SwitchRow
            label="Email Confirmation Required"
            value={verifyEmail}
            onValueChange={setVerifyEmail}
          />
          <SwitchRow
            label="ID Verification Required"
            value={verifyId}
            onValueChange={setVerifyId}
          />
          <SwitchRow
            label="Proof of Purchase Required"
            value={verifyReceipt}
            onValueChange={setVerifyReceipt}
          />
        </View>
      </View>
    ),
    [
      minAge,
      maxEntriesPer,
      eligibility,
      singleEntry,
      daily,
      bonusReferrals,
      bonusSocial,
      verifyEmail,
      verifyId,
      verifyReceipt,
      Label,
      Input,
      Row,
      SwitchRow,
    ],
  );

  const PanelWinner = useMemo(
    () => (
      <View>
        <Row>
          <>
            <View>
              <Label>Selection Method</Label>
              <Input
                value={selectionMethod}
                onChangeText={(t) =>
                  setSelectionMethod(
                    (['random', 'judged', 'point_based'].includes(t)
                      ? t
                      : 'random') as any,
                  )
                }
                placeholder="random | judged | point_based"
              />
            </View>
            <View>
              <Label>Number of Winners</Label>
              <Input
                value={numWinners}
                onChangeText={setNumWinners}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>
          </>
        </Row>

        <View style={{ height: 12 }} />

        <Row>
          <>
            <View>
              <Label>Backup Winners (UI only)</Label>
              <Input
                value={backupWinners}
                onChangeText={setBackupWinners}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View>
              <Label>Prize Claim Period (days)</Label>
              <Input
                value={claimDays}
                onChangeText={setClaimDays}
                keyboardType="numeric"
                placeholder="30"
              />
            </View>
          </>
        </Row>

        <View style={{ height: 12 }} />

        <Text style={{ color: '#bfbfbf', fontWeight: '600', marginBottom: 6 }}>
          Draw Settings
        </Text>
        <SwitchRow
          label="Automatic Draw at End Date"
          value={drawMode === 'auto_on_end'}
          onValueChange={(v) => setDrawMode(v ? 'auto_on_end' : 'manual')}
        />
        <SwitchRow
          label="Manual Draw by Admin"
          value={drawMode === 'manual'}
          onValueChange={(v) => setDrawMode(v ? 'manual' : 'auto_on_end')}
        />
      </View>
    ),
    [
      selectionMethod,
      numWinners,
      backupWinners,
      claimDays,
      drawMode,
      Label,
      Input,
      Row,
      SwitchRow,
    ],
  );

  const PanelNotifications = useMemo(
    () => (
      <View>
        <SwitchRow
          label="Public Winner Display (show name/photo)"
          value={publicWinnerDisplay}
          onValueChange={setPublicWinnerDisplay}
        />

        <View style={{ height: 12 }} />

        <Label>Winner Notification Email</Label>
        <Input
          value={winnerEmailTemplate}
          onChangeText={setWinnerEmailTemplate}
          multiline
        />

        <View style={{ height: 12 }} />

        <Label>Entry Confirmation Email</Label>
        <Input
          value={entryEmailTemplate}
          onChangeText={setEntryEmailTemplate}
          multiline
        />

        <View style={{ height: 12 }} />

        <Label>Public Announcement Text</Label>
        <Input
          value={announcementText}
          onChangeText={setAnnouncementText}
          multiline
        />
      </View>
    ),
    [
      publicWinnerDisplay,
      winnerEmailTemplate,
      entryEmailTemplate,
      announcementText,
      Label,
      Input,
      SwitchRow,
    ],
  );

  const PanelSecurity = useMemo(
    () => (
      <View>
        <SwitchRow
          label="IP Address Check"
          value={ipCheck}
          onValueChange={setIpCheck}
        />
        <SwitchRow
          label="CAPTCHA on Entry"
          value={captcha}
          onValueChange={setCaptcha}
        />

        <View style={{ height: 12 }} />

        <Label>Blocked Users/Emails (one per line)</Label>
        <Input value={blockedText} onChangeText={setBlockedText} multiline />

        <View style={{ height: 12 }} />

        <Label>Fraud Detection Notes</Label>
        <Input value={fraudNotes} onChangeText={setFraudNotes} multiline />
      </View>
    ),
    [ipCheck, captcha, blockedText, fraudNotes, Label, Input, SwitchRow],
  );

  const PanelLegal = useMemo(
    () => (
      <View>
        <Label>Terms & Conditions</Label>
        <Input value={terms} onChangeText={setTerms} multiline />

        <View style={{ height: 12 }} />

        <Label>Privacy Policy Notes</Label>
        <Input value={privacyNotes} onChangeText={setPrivacyNotes} multiline />

        <View style={{ height: 12 }} />

        <Label>Geographic Restrictions</Label>
        <Input
          value={geoRestrictions}
          onChangeText={setGeoRestrictions}
          multiline
        />

        <View style={{ height: 12 }} />

        <SwitchRow
          label="Age verification implemented"
          value={ageVerificationDone}
          onValueChange={setAgeVerificationDone}
        />
        <SwitchRow
          label="Legal review completed"
          value={legalReviewDone}
          onValueChange={setLegalReviewDone}
        />
        <SwitchRow
          label="Tax compliance considerations addressed"
          value={taxComplianceDone}
          onValueChange={setTaxComplianceDone}
        />
      </View>
    ),
    [
      terms,
      privacyNotes,
      geoRestrictions,
      ageVerificationDone,
      legalReviewDone,
      taxComplianceDone,
      Label,
      Input,
      SwitchRow,
    ],
  );

  const panel = {
    general: PanelGeneral,
    rules: PanelRules,
    winner: PanelWinner,
    notifications: PanelNotifications,
    security: PanelSecurity,
    legal: PanelLegal,
  }[tab];

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
          onPress={onBackgroundPress}
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
                marginBottom: 8,
              }}
            >
              + Create New Giveaway
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              style={{ marginTop: 8 }}
            >
              <View style={{ flexDirection: 'row' }}>
                {Tabs.map((t) => (
                  <TabButton key={t.key} k={t.key as TabKey} label={t.label} />
                ))}
              </View>
            </ScrollView>
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
            {panel}
          </ScrollView>

          {/* Fixed Footer */}
          <View style={StyleModal.fixedFooter}>
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
              }}
            >
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
