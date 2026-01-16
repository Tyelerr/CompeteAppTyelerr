// /screens/Shop/ModalCreateGiveaway.tsx
import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { supabase } from '../../ApiSupabase/supabase';
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

  const closeAndReset = () => {
    setTab('general');
    onClose();
  };

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

    const payload: any = {
      title: title.trim(),
      description,
      prize_details: prizeDetails,
      image_url: imageUrl || null,
      prize_value: prizeValue ? Number(prizeValue) : null,
      start_at: startISO,
      end_at: endISO,
      timezone: timezone || 'UTC',
      tournament_id_unique_number: tournamentNumber
        ? Number(tournamentNumber)
        : null,

      single_entry: singleEntry,
      daily_entry_allowed: daily,
      min_age: minAge ? Number(minAge) : null,
      max_entries_per_person: maxEntriesPer ? Number(maxEntriesPer) : null,
      maximum_entries: maximumEntries ? Number(maximumEntries) : null,
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

    const computed = computeStatus(startISO, endISO);
    if (computed) payload.status = computed;

    const { data, error } = await supabase
      .from('giveaways')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      Alert.alert('Create failed', error.message);
      return;
    }

    Alert.alert('Giveaway created', 'Your giveaway has been created.');
    onCreated?.(data);
    closeAndReset();
  };

  // Close modal when tapping outside - do NOT dismiss keyboard
  const onBackgroundPress = () => {
    // Don't dismiss keyboard when closing modal
    closeAndReset();
  };

  // -------- UI atoms --------
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
      keyboardAppearance="dark"
      returnKeyType="done"
      blurOnSubmit={false}
      inputAccessoryViewID={undefined}
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

  const SwitchRow = ({
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
        marginBottom: 14,
      }}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ color: '#fff' }}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  const Row = ({ children }: { children: React.ReactNode }) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1 }}>
        {children instanceof Array ? children[0] : children}
      </View>
      {children instanceof Array && children[1] ? (
        <View style={{ flex: 1 }}>{children[1]}</View>
      ) : null}
    </View>
  );

  const TabButton = ({ k, label }: { k: TabKey; label: string }) => {
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
        <Text style={{ color: active ? '#fff' : '#cfcfcf', fontWeight: '700' }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // -------- panels --------
  const PanelGeneral = (
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

      <Row>
        <>
          <View>
            <Label>Time Zone</Label>
            <Input
              value={timezone}
              onChangeText={setTimezone}
              placeholder="UTC, America/Chicago, etc."
            />
          </View>
          <View>
            <Label>Image URL</Label>
            <Input
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://..."
            />
          </View>
        </>
      </Row>

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
  );

  const PanelRules = (
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
        <Label>Maximum Total Entries (Cap)</Label>
        <Input
          value={maximumEntries}
          onChangeText={setMaximumEntries}
          keyboardType="numeric"
          placeholder="500"
        />
        <Text style={{ color: '#7a7a7a', fontSize: 12, marginTop: 4 }}>
          Giveaway ends when this many entries are received (e.g., "ends when
          500 entries received")
        </Text>
      </View>

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

      <View style={{ height: 12 }} />

      <Text style={{ color: '#bfbfbf', fontWeight: '600', marginBottom: 6 }}>
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

      <View style={{ height: 12 }} />

      <Text style={{ color: '#bfbfbf', fontWeight: '600', marginBottom: 6 }}>
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
  );

  const PanelWinner = (
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
  );

  const PanelNotifications = (
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
  );

  const PanelSecurity = (
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
  );

  const PanelLegal = (
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={StyleModal.container}>
          <TouchableOpacity
            style={StyleModal.backgroundTouchableForClosing}
            onPress={onBackgroundPress}
            activeOpacity={1}
          />

          <View style={StyleModal.containerForFixedLayout}>
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
                    <TabButton
                      key={t.key}
                      k={t.key as TabKey}
                      label={t.label}
                    />
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
              keyboardShouldPersistTaps="handled"
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
