import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import UIPanel from '../../components/UI/UIPanel';
import { StyleZ } from '../../assets/css/styles';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import ScreenFAQsContact from './ScreenFAQsContact';
import SupportMessagesTab from './SupportMessagesTab';

export default function ScreenFAQsContact_Updated() {
  const [activeTab, setActiveTab] = useState<'contact' | 'messages'>('contact');

  return (
    <UIPanel>
      <Text style={[StyleZ.h2, { marginBottom: BasePaddingsMargins.m20 }]}>
        Contact Support
      </Text>
      <View
        style={{ flexDirection: 'row', marginBottom: BasePaddingsMargins.m20 }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor:
              activeTab === 'contact'
                ? BaseColors.primary
                : BaseColors.secondary,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setActiveTab('contact')}
        >
          <Text style={{ color: BaseColors.light, fontWeight: 'bold' }}>
            Contact
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor:
              activeTab === 'messages'
                ? BaseColors.primary
                : BaseColors.secondary,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={{ color: BaseColors.light, fontWeight: 'bold' }}>
            Messages
          </Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'contact' ? <ScreenFAQsContact /> : <SupportMessagesTab />}
    </UIPanel>
  );
}
