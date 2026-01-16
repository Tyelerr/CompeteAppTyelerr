import { Platform, Linking, Alert } from 'react-native';

export const openAddressInMaps = async (
  address: string,
  venueName?: string,
) => {
  if (!address || address.trim() === '') {
    Alert.alert('Error', 'No address available to open in maps.');
    return;
  }

  const encodedAddress = encodeURIComponent(address.trim());
  const encodedVenueName = venueName
    ? encodeURIComponent(venueName.trim())
    : '';

  let url: string;

  if (Platform.OS === 'ios') {
    // iOS - Try Apple Maps first, fallback to Google Maps
    const appleMapUrl = `maps://maps.apple.com/?q=${encodedAddress}`;
    const googleMapUrl = `comgooglemaps://?q=${encodedAddress}`;
    const webFallbackUrl = `https://maps.apple.com/?q=${encodedAddress}`;

    try {
      // Check if Apple Maps is available
      const canOpenAppleMaps = await Linking.canOpenURL(appleMapUrl);
      if (canOpenAppleMaps) {
        await Linking.openURL(appleMapUrl);
        return;
      }

      // Check if Google Maps app is available
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapUrl);
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapUrl);
        return;
      }

      // Fallback to web Apple Maps
      await Linking.openURL(webFallbackUrl);
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Unable to open maps application.');
    }
  } else {
    // Android - Try Google Maps first, fallback to web
    const googleMapUrl = `geo:0,0?q=${encodedAddress}`;
    const webFallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    try {
      // Check if Google Maps is available
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapUrl);
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapUrl);
        return;
      }

      // Fallback to web Google Maps
      await Linking.openURL(webFallbackUrl);
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Unable to open maps application.');
    }
  }
};

export const openCoordinatesInMaps = async (
  latitude: number,
  longitude: number,
  label?: string,
) => {
  const encodedLabel = label ? encodeURIComponent(label) : '';

  let url: string;

  if (Platform.OS === 'ios') {
    // iOS - Apple Maps with coordinates
    url = `maps://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web Apple Maps
        await Linking.openURL(
          `https://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`,
        );
      }
    } catch (error) {
      console.error('Error opening maps with coordinates:', error);
      Alert.alert('Error', 'Unable to open maps application.');
    }
  } else {
    // Android - Google Maps with coordinates
    url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web Google Maps
        await Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        );
      }
    } catch (error) {
      console.error('Error opening maps with coordinates:', error);
      Alert.alert('Error', 'Unable to open maps application.');
    }
  }
};
