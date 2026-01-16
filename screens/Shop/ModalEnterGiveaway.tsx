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
import LFInputDateDropdown from '../../components/LoginForms/LFInputDateDropdown';

interface IGiveaway {
  id: string;
  title: string;
  prize_image_url: string | null;
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
      email: string;
      phoneNumber: string;
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
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isUnder18, setIsUnder18] = useState(false);

  // Calculate age from birthday
  const calculateAge = (birthdayStr: string): number => {
    if (!birthdayStr || birthdayStr.trim() === '') return 0;

    const parts = birthdayStr.split('-');
    if (parts.length !== 3) return 0;

    const birthDate = new Date(birthdayStr);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year yet
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

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
      setEmail('');
      setPhoneNumber('');
      setShowValidationErrors(false);
    }
  }, [visible]);

  // Validation functions
  const isValidName = (name: string): boolean => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    return nameRegex.test(name.trim()) && name.trim().length > 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const isValidPhone = (phone: string): boolean => {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    // US phone numbers should have 10 digits
    return digitsOnly.length === 10;
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(
        3,
        6,
      )}-${digitsOnly.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleNameChange = (text: string) => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const filtered = text.replace(/[^a-zA-Z\s'-]/g, '');
    setFullName(filtered);
  };

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

    // Validate age immediately when birthday changes
    if (date && date.trim() !== '') {
      const age = calculateAge(date);
      setIsUnder18(age < 18);
    } else {
      setIsUnder18(false);
    }
  };

  const handleAgree = () => {
    // Check required checkboxes
    if (!agree18 || !agreeRules || !agreePrivacy || !agreeOneEntry) {
      Alert.alert(
        'Required',
        'Please agree to all required agreements to continue.',
      );
      return;
    }

    // Validate all required fields
    const errors: string[] = [];

    if (fullName.trim() === '') {
      errors.push('Full name is required');
    } else if (!isValidName(fullName)) {
      errors.push(
        'Name can only contain letters, spaces, hyphens, and apostrophes',
      );
    }

    if (birthday.trim() === '') {
      errors.push('Birthday is required');
    }

    if (email.trim() === '') {
      errors.push('Email is required');
    } else if (!isValidEmail(email)) {
      errors.push('Please enter a valid email address');
    }

    if (phoneNumber.trim() === '') {
      errors.push('Phone number is required');
    } else if (!isValidPhone(phoneNumber)) {
      errors.push('Please enter a valid 10-digit US phone number');
    }

    if (errors.length > 0) {
      setShowValidationErrors(true);
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    onAgree(giveaway.id, {
      agree18,
      agreeRules,
      agreePrivacy,
      agreeOneEntry,
      marketingOptIn,
      fullName: fullName.trim(),
      birthday,
      email: email.trim(),
      phoneNumber: phoneNumber.replace(/\D/g, ''), // Store digits only
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
                Sponsor: AzTechGuys LLC, Glendale, AZ 85308
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
                onChangeText={handleNameChange}
                placeholder="Full Name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                style={{
                  backgroundColor: '#222',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  borderWidth:
                    showValidationErrors &&
                    (!fullName.trim() || !isValidName(fullName))
                      ? 1
                      : 0,
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
              {showValidationErrors &&
                fullName.trim() !== '' &&
                !isValidName(fullName) && (
                  <Text
                    style={{
                      color: '#ff6b6b',
                      fontSize: 12,
                      marginTop: -12,
                      marginBottom: 16,
                    }}
                  >
                    Name can only contain letters, spaces, hyphens, and
                    apostrophes
                  </Text>
                )}

              {/* Birthday Input using dropdown selectors */}
              <LFInputDateDropdown
                label="Birthday *"
                value={birthday}
                onDateChange={handleBirthdayChange}
                placeholder="Select Birthday"
                maximumDate={new Date()} // Can't be in the future
                minimumDate={new Date(1900, 0, 1)} // Reasonable minimum
                marginBottomInit={16}
                hasError={isUnder18}
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
              {isUnder18 && birthday.trim() !== '' && (
                <Text
                  style={{
                    color: '#ff6b6b',
                    fontSize: 12,
                    marginTop: -12,
                    marginBottom: 16,
                  }}
                >
                  You must be 18 years or older to enter
                </Text>
              )}

              {/* Email Field */}
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 16,
                }}
              >
                Email *
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: '#222',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  borderWidth:
                    showValidationErrors &&
                    (!email.trim() || !isValidEmail(email))
                      ? 1
                      : 0,
                  borderColor: '#ff6b6b',
                }}
              />
              {showValidationErrors && email.trim() === '' && (
                <Text
                  style={{
                    color: '#ff6b6b',
                    fontSize: 12,
                    marginTop: -12,
                    marginBottom: 16,
                  }}
                >
                  Email is required
                </Text>
              )}
              {showValidationErrors &&
                email.trim() !== '' &&
                !isValidEmail(email) && (
                  <Text
                    style={{
                      color: '#ff6b6b',
                      fontSize: 12,
                      marginTop: -12,
                      marginBottom: 16,
                    }}
                  >
                    Please enter a valid email address
                  </Text>
                )}

              {/* Phone Number Field */}
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 16,
                }}
              >
                Phone Number *
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="(555) 123-4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={14} // (XXX) XXX-XXXX format
                style={{
                  backgroundColor: '#222',
                  color: '#fff',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  fontSize: 16,
                  borderWidth:
                    showValidationErrors &&
                    (!phoneNumber.trim() || !isValidPhone(phoneNumber))
                      ? 1
                      : 0,
                  borderColor: '#ff6b6b',
                }}
              />
              {showValidationErrors && phoneNumber.trim() === '' && (
                <Text
                  style={{
                    color: '#ff6b6b',
                    fontSize: 12,
                    marginTop: -12,
                    marginBottom: 16,
                  }}
                >
                  Phone number is required
                </Text>
              )}
              {showValidationErrors &&
                phoneNumber.trim() !== '' &&
                !isValidPhone(phoneNumber) && (
                  <Text
                    style={{
                      color: '#ff6b6b',
                      fontSize: 12,
                      marginTop: -12,
                      marginBottom: 16,
                    }}
                  >
                    Please enter a valid 10-digit US phone number
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
                    'Sponsor: AzTechGuys LLC, Glendale, AZ 85308\n\nEligibility: Open to legal residents of the United States who are 18 years of age or older. Void where prohibited. Employees/contractors/household/immediate family of Sponsor are not eligible.\n\nNo Purchase Necessary: Free to enter; a purchase will not increase chances of winning.\n\nEntry Period: Begins ' +
                      startDate +
                      ', Arizona time and ends ' +
                      endDate +
                      ', Arizona time, or when ' +
                      entryCap +
                      ' eligible entries are received, whichever occurs first.\n\nEntry Limit: One (1) entry per person. Duplicate or automated entries are void and may lead to disqualification.\n\nPrize/ARV: ' +
                      (giveaway.description
                        ? giveaway.description
                        : giveaway.title) +
                      ' (Approximate Retail Value $' +
                      prize +
                      "). No cash alternative. Sponsor may substitute a prize of equal or greater value if unavailable.\n\nOdds: Depend on number of eligible entries received.\n\nSelection/Notification: Random drawing within 7 days after the Entry Period ends. Potential winner will be notified by email/SMS and must respond within 48 hours, or an alternate may be selected.\n\nVerification: Sponsor may require a government-issued photo ID and a valid U.S. mailing address to confirm age and eligibility.\n\nTaxes: If required by law, winner must complete IRS Form W-9; Sponsor will issue Form 1099-MISC for prizes $600+. Winner is responsible for all taxes.\n\nPublicity: Where permitted, Sponsor may use winner's first name and city/state.\n\nGeneral: Sponsor may disqualify any entry for fraud, tampering, or abuse; not sponsored or endorsed by Apple, Google, Meta, or any prize manufacturer. Subject to Official Rules and Privacy Policy.",
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
                  Official Rules
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Privacy Policy',
                    'Privacy Policy\n\nEffective Date: [DATE]\n\nAzTechGuys LLC ("Company," "we," "us," or "our") operates the Compete mobile application and related services (the "App"). This Privacy Policy describes how we collect, use, and protect your information.\n\n1. Information We Collect\n\nWe may collect the following categories of information:\n\na. Information You Provide\n• Name\n• Email address\n• Account profile information\n• Giveaway entry information\n• Optional marketing preferences\n\nb. Winner Verification Information\nIf you win a giveaway, we may request additional information such as:\n• Age verification\n• Mailing address\n• Other information required to deliver prizes or verify eligibility\n\nc. Usage & Security Information\n• App usage activity\n• Device and log information used for security and fraud prevention\n\nWe do not collect unnecessary personal information.\n\n2. How We Use Your Information\n\nWe use information to:\n• Operate and improve the App\n• Manage user accounts\n• Administer giveaways and select winners\n• Verify eligibility and prevent abuse or duplicate entries\n• Communicate with users about entries, winners, and important updates\n• Send optional marketing communications only if you opt in\n• Comply with legal obligations\n\n3. Marketing Communications (Opt-In Only)\n\nUsers may choose to receive optional updates, announcements, or promotions from Compete.\n• Marketing communications are opt-in only\n• You may unsubscribe at any time using the link in our emails or by adjusting your app settings\n• Unsubscribing does not affect your ability to use the App or enter giveaways\n\n4. How We Share Information\n\nWe do not sell personal information.\n\nWe may share information only:\n• With service providers that help operate the App (hosting, email delivery, notifications)\n• With prize fulfillment partners solely to deliver prizes\n• When required by law or legal process\n\n5. Data Retention\n\nWe retain personal information only as long as necessary to:\n• Operate the App\n• Complete giveaways\n• Maintain security and compliance\n\nInformation related to completed giveaways may be archived or deleted once no longer required.\n\n6. Data Security\n\nWe use reasonable administrative and technical safeguards to protect your information. While we take security seriously, no system is completely secure.\n\n7. Your Rights & Choices\n\nYou may:\n• Update or delete certain account information\n• Opt out of marketing communications at any time\n• Request account deletion, subject to legal or operational requirements\n\n8. Children\'s Privacy\n\nCompete is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors.\n\n9. Changes to This Policy\n\nWe may update this Privacy Policy from time to time. Updates will be posted within the App, and continued use constitutes acceptance of the revised policy.\n\n10. Contact Us\n\nIf you have questions or concerns about this Privacy Policy, contact:\n\nAzTechGuys LLC',
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
                Required:
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
                Optional:
              </Text>

              <Checkbox
                checked={marketingOptIn}
                onPress={() => setMarketingOptIn(!marketingOptIn)}
                label="Receive optional updates, announcements, and promotions from Compete."
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
