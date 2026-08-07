import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

import type { StoreMapProps } from '@/components/store-map.types';
import { colors, spacing } from '@/constants/theme';

const OKC_METRO_REGION = {
  latitude: 35.552,
  longitude: -97.505,
  latitudeDelta: 0.36,
  longitudeDelta: 0.24,
};

export default function StoreMapNative({
  stores,
  homeStoreId,
  selectedStoreId,
  showsUserLocation,
  userCoordinate,
  onSelectStore,
}: StoreMapProps) {
  const mapRef = useRef<MapView>(null);

  // Recenter once when location arrives, then leave the map under user control.
  useEffect(() => {
    if (!userCoordinate) return;
    mapRef.current?.animateToRegion(
      { ...userCoordinate, latitudeDelta: 0.12, longitudeDelta: 0.08 },
      600
    );
  }, [userCoordinate]);

  return (
    // Each platform can use the map provider already available in Expo Go.
    <MapView
      initialRegion={OKC_METRO_REGION}
      ref={mapRef}
      showsCompass
      showsUserLocation={showsUserLocation}
      style={styles.map}
    >
      {stores.map((store) => {
        const isHome = store.id === homeStoreId;
        const isSelected = store.id === selectedStoreId;
        return (
          <Marker
            coordinate={{ latitude: store.lat, longitude: store.lng }}
            key={store.id}
            onPress={() => onSelectStore(store)}
            pinColor={isHome ? colors.accent : isSelected ? colors.accentSoft : colors.danger}
            title={store.name}
          >
            <Callout onPress={() => onSelectStore(store)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{store.name}</Text>
                <Text style={styles.calloutAddress}>{store.address}</Text>
                <Text style={styles.calloutHint}>Tap for trade and home-store actions</Text>
              </View>
            </Callout>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  callout: {
    gap: spacing.xs,
    maxWidth: 240,
    padding: spacing.xs,
  },
  // Native callouts use a light background outside the app theme.
  calloutAddress: {
    color: '#3B4048',
    fontSize: 12,
    lineHeight: 17,
  },
  calloutHint: {
    color: '#1F5FBF',
    fontSize: 11,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  calloutTitle: {
    color: '#111318',
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
});
