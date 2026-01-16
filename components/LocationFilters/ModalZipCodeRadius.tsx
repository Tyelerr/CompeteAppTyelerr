import React, { useState, useEffect } from 'react';
import { Modal, ScrollView, Text, View, Platform } from 'react-native';
import LFButton from '../LoginForms/Button/LFButton';
import LFInput from '../LoginForms/LFInput';
import ZSlider from '../UI/ZSlider/ZSlider';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';

interface ModalZipCodeRadiusProps {
  visible: boolean;
  onClose: () => void;
  initialZipCode?: string;
  initialRadius?: number;
  onSave: (zipCode: string, radius: number) => void;
}

const ModalZipCodeRadius: React.FC<ModalZipCodeRadiusProps> = ({
  visible,
  onClose,
  initialZipCode = '',
  initialRadius = 25,
  onSave,
}) => {
  const [zipCode, setZipCode] = useState(initialZipCode);
  const [radius, setRadius] = useState(initialRadius);

  useEffect(() => {
    if (visible) {
      setZipCode(initialZipCode);
      setRadius(initialRadius);
    }
  }, [visible, initialZipCode, initialRadius]);

  const handleSave = () => {
    if (zipCode.trim()) {
      onSave(zipCode.trim(), radius);
      onClose();
    }
  };

  const handleCancel = () => {
    // Reset to initial values
    setZipCode(initialZipCode);
    setRadius(initialRadius);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
      statusBarTranslucent={false}
    >
      <View
        style={{
          paddingTop: Platform.OS === 'ios' ? 54 : 24,
          paddingHorizontal: 16,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: BaseColors.PanelBorderColor,
          backgroundColor: '#0c0c0c',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
          Set Zip Code & Radius
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#0c0c0c' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets
      >
        <View style={{ marginBottom: BasePaddingsMargins.formInputMarginLess }}>
          <LFInput
            label="Zip Code"
            placeholder="Enter zip code"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="numeric"
            marginBottomInit={0}
          />
        </View>

        {zipCode.trim() !== '' && (
          <ZSlider
            type="single"
            label="Search Radius from Zip Code"
            min={0}
            max={100}
            initialValue={radius}
            valueTemplate="{v} miles"
            measurementTemplates={['{v} mile', '{v} miles']}
            onValueChange={(value: number) => setRadius(value)}
          />
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={{ color: '#9ca3af', fontSize: 14, lineHeight: 20 }}>
            Enter your zip code and select how far you're willing to travel to
            find tournaments in your area.
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: BaseColors.PanelBorderColor,
          flexDirection: 'row',
          gap: 12,
          backgroundColor: '#0c0c0c',
        }}
      >
        <View style={{ flex: 1 }}>
          <LFButton type="danger" label="Cancel" onPress={handleCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <LFButton
            type="primary"
            label="Apply"
            onPress={handleSave}
            disabled={!zipCode.trim()}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ModalZipCodeRadius;
