import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from 'react-native';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';

interface IGiveawayEdit {
  id: string;
  title: string;
  prizeValue?: number;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
  endAt?: string;
  description?: string;
}

interface ModalEditGiveawayProps {
  visible: boolean;
  onClose: () => void;
  giveaway: IGiveawayEdit | null;
  onSave: (updatedGiveaway: IGiveawayEdit) => Promise<void>;
}

const ModalEditGiveaway: React.FC<ModalEditGiveawayProps> = ({
  visible,
  onClose,
  giveaway,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [endAt, setEndAt] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<IGiveawayEdit['status']>('draft');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (giveaway) {
      setTitle(giveaway.title);
      setPrize(giveaway.prizeValue?.toString() || '');
      setEndAt(giveaway.endAt ? giveaway.endAt.split('T')[0] : '');
      setDesc(giveaway.description || '');
      setStatus(giveaway.status);
    }
  }, [giveaway]);

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        id: giveaway!.id,
        title: title.trim(),
        prizeValue: Number(prize) || 0,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        status,
        description: desc.trim(),
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save giveaway. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
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
          Edit Giveaway
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#0c0c0c' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Giveaway title"
          placeholderTextColor="#6b7280"
          style={{
            color: 'white',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        />

        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
          Prize Value (USD)
        </Text>
        <TextInput
          value={prize}
          onChangeText={setPrize}
          keyboardType="numeric"
          placeholder="500"
          placeholderTextColor="#6b7280"
          style={{
            color: 'white',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        />

        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
          End Date (YYYY-MM-DD)
        </Text>
        <TextInput
          value={endAt}
          onChangeText={setEndAt}
          placeholder="2025-09-15"
          placeholderTextColor="#6b7280"
          style={{
            color: 'white',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        />

        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>Status</Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        >
          {['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'].map(
            (s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s as IGiveawayEdit['status'])}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor:
                    status === s ? BaseColors.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: status === s ? 'white' : '#9ca3af',
                    fontWeight: status === s ? '700' : '400',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>Description</Text>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="What will the winner receive?"
          placeholderTextColor="#6b7280"
          multiline
          style={{
            color: 'white',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            minHeight: 80,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        />
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
          <LFButton type="danger" label="Cancel" onPress={onClose} />
        </View>
        <View style={{ flex: 1 }}>
          <LFButton
            type="primary"
            label={loading ? 'Saving...' : 'Save Changes'}
            onPress={submit}
            disabled={loading}
          />
        </View>
      </View>
    </Modal>
  );
};

export default ModalEditGiveaway;
