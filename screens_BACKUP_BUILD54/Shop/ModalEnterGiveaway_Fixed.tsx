import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { StyleModal } from '../../assets/css/styles';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LFInputDateCalendar from '../../components/LoginForms/LFInputDateCalendar';

interface IGiveaway {
  id: string;
  title: string;
  image_url: string | null;
  prize_value: number | string | null;
  entries_count: number;
  description?: string | null;
  end_at: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
  created_at?: string | null;
  maximum_entries?: number;
}

interface ModalEnterGiveawayProps {
  visible: boolean;
  onClose: () => void;
  giveaway: IGiveaway | null;
  onAgree: (
    id: string,
    agreements: {
      agree18: boolean;
      agreeRules: boolean;
      agreePrivacy: boolean;
      agreeOneEntry: boolean;
      marketingOptIn: boolean;
      fullName: string;
      birthday: string;
    },
  ) => void;
}

const ModalEnterGiveaway: React.FC<ModalEnterGiveawayProps> = ({
  visible,
  onClose,
  giveaway,
  onAgree,
}) => {
  const [agree18, setAgree18] = useState(false);
  const [agreeRules, setAgreeRules] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeOneEntry, setAgreeOneEntry] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Reset agreements when modal is closed
  useEffect(() => {
    if (!visible) {
      setAgree18(false);
      setAgreeRules(false);
      setAgreePrivacy(false);
      setAgreeOneEntry(false);
      setMarketingOptIn(false);
      setFullName('');
      setBirthday('');
      setShowValidationErrors(false);
    }
  }, [visible]);

  if (!giveaway) return null;

  const prize = Number(giveaway.prize_value || 0);
  const startDate = giveaway.created_at
    ? new Date(giveaway.created_at).toLocaleString()
    : 'TBD';
  const endDate = giveaway.end_at
    ? new Date(giveaway.end_at).toLocaleString()
    : 'TBD';
  const entryCap = giveaway.maximum_entries || 500;

  const handleClose = () => {
    setAgree18(false);
    setAgreeRules(false);
    setAgreePrivacy(false);
    setAgreeOneEntry(false);
    setMarketingOptIn(false);
    onClose();
  };

  const handleBirthdayChange = (date: string) => {
    setBirthday(date);
  };

  const handleAgree = () => {
    if (!agree18 || !agreeRules || !agreePrivacy || !agreeOneEntry) {
      Alert.alert(
        'Required',
        'Please agree to all required agreements to continue.',
      );
      return;
    }
    if (fullName.trim() === '' || birthday.trim() === '') {
      setShowValidationErrors(true);
      return;
    }
    onAgree(giveaway.id, {
      agree18,
      agreeRules,
      agreePrivacy,
      agreeOneEntry,
      marketingOptIn,
      fullName,
      birthday,
    });
    handleClose();
  };

  const Checkbox = ({
    checked,
    onPress,
    label,
  }: {
    checked: boolean;
    onPress: () => void;
    label: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: 1,
          borderColor: BaseColors.secondary,
          borderRadius: 4,
          backgroundColor: checked ? BaseColors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {checked && <Icon name="check" size={16} color="#fff" />}
      </View>
      <Text style={{ color: '#fff', fontSize: 14, flex: 1 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
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
            onPress={handleClose}
          />

          <View style={StyleModal.containerForFixedLayout}>
            {/* Fixed Header */}
            <View style={StyleModal.fixedHeader}>
              <Text
                style={[
                  StyleModal.heading,
                  { textAlign: 'center', fontSize: 24, fontWeight: 'bold' },
                ]}
              >
                Official Rules
              </Text>
            </View>

            {/* Fixed Close Button */}
            <TouchableOpacity
              style={StyleModal.closeButtonFixed}
              onPress={handleClose}
            >
              <Text style={{ color: BaseColors.light, fontSize: 24 }}>×</Text>
            </TouchableOpacity>

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
              <Text
                style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}
              >
                Sponsor: AzTechGuys LLC, 4028 W Campo Bello Dr Glendale AZ 85308
                {'\n'}
                Eligibility: Open to legal residents of the United States who
                are 18 years of age or older. Void where prohibited.
                Employees/contractors/household/immediate family of Sponsor are
                not eligible.{'\n'}
                No Purchase Necessary: Free to enter; a purchase will not
                increase chances of winning.{'\n'}
                Entry Period: Begins {startDate}, Arizona time and ends{' '}
                {endDate}, Arizona time, or when {entryCap} eligible entries are
                received, whichever occurs first.{'\n'}
                Entry Limit: One (1) entry per person. Duplicate or automated
                entries are void and may lead to disqualification.{'\n'}
                Prize/ARV:{' '}
                {giveaway.description
                  ? giveaway.description
                  : giveaway.title}{' '}
                (Approximate Retail Value ${prize}). No cash alternative.
                Sponsor may substitute a prize of equal or greater value if
                unavailable.{'\n'}
                Odds: Depend on number of eligible entries received.{'\n'}
                Selection/Notification: Random drawing within 7 days after the
                Entry Period ends. Potential winner will be notified by
                email/SMS and must respond within 48 hours, or an alternate may
                be selected.{'\n'}
                Verification: Sponsor may require a government-issued photo ID
                and a valid U.S. mailing address to confirm age and eligibility.
                {'\n'}
                Taxes: If required by law, winner must complete IRS Form W-9;
                Sponsor will issue Form 1099-MISC for prizes $600+. Winner is
                responsible for all taxes.{'\n'}
                Publicity: Where permitted, Sponsor may use winner's first name
                and city/state.{'\n'}
                General: Sponsor may disqualify any entry for fraud, tampering,
                or abuse; not sponsored or endorsed by Apple, Google, Meta, or
                any prize manufacturer. Subject to Official Rules and Privacy
                Policy.
              </Text>

              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 16,
                }}
              >
                Name (As it appears on license) *
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
                placeholderTextColor="#999"
                style={{
                  backgroundColor: '#222',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  borderWidth:
                    showValidationErrors && fullName.trim() === '' ? 1 : 0,
                  borderColor: '#ff6b6b',
                }}
              />
              {showValidationErrors && fullName.trim() === '' && (
                <Text
                  style={{
                    color: '#ff6b6b',
                    fontSize: 12,
                    marginTop: -12,
                    marginBottom: 16,
                  }}
                >
                  Full name is required
                </Text>
              )}

              {/* Birthday Input using our new calendar-based component */}
              <LFInputDateCalendar
                label="Birthday *"
                value={birthday}
                onDateChange={handleBirthdayChange}
                placeholder="Select Birthday"
                maximumDate={new Date()} // Can't be in the future
                minimumDate={new Date(1900, 0, 1)} // Reasonable minimum
                marginBottomInit={16}
              />

              {showValidationErrors && birthday.trim() === '' && (
                <Text
                  style={{
                    color: '#ff6b6b',
                    fontSize: 12,
                    marginTop: -12,
                    marginBottom: 16,
                  }}
                >
                  Birthday is required
                </Text>
              )}

              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 16,
                }}
              >
                Links:
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Official Rules',
                    'Full rules would be displayed here.',
                  )
                }
                style={{ marginBottom: 8 }}
              >
                <Text
                  style={{
                    color: BaseColors.primary,
                    textDecorationLine: 'underline',
                  }}
                >
                  Official Rules (opens full rules)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Privacy Policy',
                    'Privacy policy would be displayed here.',
                  )
                }
                style={{ marginBottom: 16 }}
              >
                <Text
                  style={{
                    color: BaseColors.primary,
                    textDecorationLine: 'underline',
                  }}
                >
                  Privacy Policy
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 16,
                }}
              >
                Required (must be checked to proceed):
              </Text>

              <Checkbox
                checked={agree18}
                onPress={() => setAgree18(!agree18)}
                label="I am 18 or older and meet the eligibility requirements."
              />
              <Checkbox
                checked={agreeRules}
                onPress={() => setAgreeRules(!agreeRules)}
                label="I have read and agree to the Official Rules."
              />
              <Checkbox
                checked={agreePrivacy}
                onPress={() => setAgreePrivacy(!agreePrivacy)}
                label="I have read and agree to the Privacy Policy."
              />
              <Checkbox
                checked={agreeOneEntry}
                onPress={() => setAgreeOneEntry(!agreeOneEntry)}
                label="I understand it's one entry per person and duplicate entries will be void."
              />

              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 16,
                  marginTop: 16,
                }}
              >
                Optional (unchecked by default):
              </Text>

              <Checkbox
                checked={marketingOptIn}
                onPress={() => setMarketingOptIn(!marketingOptIn)}
                label="Send me marketing updates and promotions from billiards-app-2."
              />
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
                    onPress={handleAgree}
                    style={{
                      backgroundColor: BaseColors.primary,
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}
                    >
                      I Agree & Continue
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={{
                      backgroundColor: BaseColors.secondary,
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}
                    >
                      Cancel
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
};

export default ModalEnterGiveaway;
