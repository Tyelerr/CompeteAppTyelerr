import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../ApiSupabase/supabase';

interface ModalChooseAvatarProps {
  visible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatarUri: string) => void;
}

interface AvatarOption {
  id: number;
  url: string;
  label: string;
}

// Fallback to default image if storage images fail
const defaultImage = require('../../assets/images/default-profile-image.jpg');

export default function ModalChooseAvatar({
  visible,
  onClose,
  onSelectAvatar,
}: ModalChooseAvatarProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [avatarImages, setAvatarImages] = useState<AvatarOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {},
  );

  useEffect(() => {
    if (visible) {
      loadAvatarImages();
    }
  }, [visible]);

  const loadAvatarImages = async () => {
    try {
      setLoading(true);
      console.log('Loading avatar images from Supabase Storage...');

      // Use the working Supabase Storage URLs
      const baseUrl =
        'https://ofcroxehpuiylonrakrf.supabase.co/storage/v1/object/public/images';
      const avatarOptions: AvatarOption[] = [];

      for (let i = 1; i <= 7; i++) {
        const avatarUrl = `${baseUrl}/avatar${i}.png`;
        avatarOptions.push({
          id: i,
          url: avatarUrl,
          label: `Avatar ${i}`,
        });
        console.log(`Avatar ${i} URL:`, avatarUrl);
      }

      setAvatarImages(avatarOptions);
      console.log(`Successfully loaded ${avatarOptions.length} avatar URLs`);
    } catch (error) {
      console.error('Error loading avatar images:', error);
      // Create fallback options on error
      const fallbackOptions: AvatarOption[] = [];
      for (let i = 1; i <= 7; i++) {
        fallbackOptions.push({
          id: i,
          url: '',
          label: `Avatar ${i} (fallback)`,
        });
      }
      setAvatarImages(fallbackOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (avatarId: number, avatarUrl: string) => {
    console.log('Avatar selected:', avatarId, 'URL:', avatarUrl);
    setSelectedAvatar(avatarId);
    // Pass the full URL or avatar ID based on what's available
    onSelectAvatar(avatarUrl || `avatar${avatarId}`);
    onClose();
  };

  const handleImageError = (avatarId: number) => {
    console.log(`Error loading avatar ${avatarId}, using fallback`);
    setImageErrors((prev) => ({ ...prev, [avatarId]: true }));
  };

  const getImageSource = (avatar: AvatarOption) => {
    if (imageErrors[avatar.id] || !avatar.url) {
      return defaultImage;
    }
    return { uri: avatar.url };
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Choose avatar</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Loading avatars...' : 'Select your avatar'}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.loadingText}>
                Loading avatars from storage...
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.avatarList}>
              {avatarImages.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarWrapper,
                    selectedAvatar === avatar.id && styles.selectedAvatar,
                  ]}
                  onPress={() => handleSelect(avatar.id, avatar.url)}
                >
                  <Image
                    source={getImageSource(avatar)}
                    style={styles.avatarImage}
                    onError={() => handleImageError(avatar.id)}
                    onLoad={() =>
                      console.log(`Successfully loaded avatar ${avatar.id}`)
                    }
                  />
                  <Text style={styles.avatarLabel}>
                    {avatar.label}
                    {(imageErrors[avatar.id] || !avatar.url) && ' (fallback)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  avatarList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  avatarWrapper: {
    margin: 10,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  selectedAvatar: {
    borderColor: '#0ea5e9',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarLabel: {
    color: 'white',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
