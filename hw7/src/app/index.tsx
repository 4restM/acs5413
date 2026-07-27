import { useRef } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker } from 'react-native-maps';
import { INITIAL_REGION, CAMPUS_REGION, MARKERS } from '@/constants/map';
import type { MapMarker } from '@/constants/map';

const IOS_BLUE = '#007AFF';

export default function CameraLocationScreen() {
  /* 
   A ref drives the map imperatively. Region is owned by the native
   map view once the user starts panning, so moving the camera is a method
   call on the instance rather than a state update.
  */
   const mapRef = useRef<MapView>(null);

  // Animate refocus on cordinates provided in constants/map.ts.
  const focusMap = () => {
    mapRef.current?.animateToRegion(CAMPUS_REGION, 1000);
  };

  // Fn to alert w/ marker details when pressed. 
  const onMarkerSelected = (marker: MapMarker) => {
    Alert.alert(marker.title, marker.description);
  };

  return (
    <View style={styles.container}>
      {/* headerLeft as requested puts "Focus" in the top-left corner.
          Declaring it here rather than in _layout.tsx lets the button close
          over focusMap, which needs the mapRef from this component. */}
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={focusMap}
              style={styles.focusButton}
              accessibilityRole="button"
              accessibilityLabel="Focus map on the University of Oklahoma campus"
            >
              <Text style={styles.focusLabel}>Focus</Text>
            </Pressable>
          ),
        }}
      />
      <StatusBar style="dark" />
      {/* AI notes that No `provider` prop: falls back to Apple Maps on iOS, which works
          in Expo Go with no API key. PROVIDER_GOOGLE would render blank here. */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {MARKERS.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerSelected(marker)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // Quick styles generated from AI
  focusButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  focusLabel: {
    fontSize: 17,
    color: IOS_BLUE,
  },
});
