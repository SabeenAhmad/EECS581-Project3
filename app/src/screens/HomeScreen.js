import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
  Text,
} from 'react-native';
import lots from '../data/mockParking';
const { width, height } = Dimensions.get('window');

let MapView, Marker; // for native maps

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

// Helper: get most recent datapoint for each lot
function getLatestAvailability(lot) {
  const latest = lot.dataPoints[lot.dataPoints.length - 1];
  const available = lot.total - latest.occupied;
  const occupied = latest.occupied;
  return {
    available,
    lastUpdated: latest.time,
    occupied
  };
}

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [LeafletReady, setLeafletReady] = useState(false);
  const [LeafletModules, setLeafletModules] = useState(null);
  const router = useRouter();
  const region = {
    latitude: 38.9543,
    longitude: -95.2558,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const filteredLots = lots.filter((lot) =>
    lot.name.toLowerCase().includes(search.toLowerCase())
  );

  // 🌐 Load Leaflet dynamically for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      (async () => {
        const leaflet = await import('leaflet');
        const reactLeaflet = await import('react-leaflet');
        require('leaflet/dist/leaflet.css');
        setLeafletModules({ ...reactLeaflet, L: leaflet });
        setLeafletReady(true);
      })();
    }
  }, []);

  // ✅ WEB VERSION (Leaflet)
  if (Platform.OS === 'web') {
    if (!LeafletReady || !LeafletModules) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Loading map...</Text>
        </View>
      );
    }

    const { MapContainer, TileLayer, CircleMarker, Popup } = LeafletModules;

    return (
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <MapContainer
            center={[region.latitude, region.longitude]}
            zoom={15}
            style={{ height: height, width: width }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredLots.map((lot) => {
              const { occupied, lastUpdated } = getLatestAvailability(lot);
              return (
                <CircleMarker
                  key={lot.id}
                  center={[lot.latitude, lot.longitude]}
                  radius={10}
                  fillColor="#ff3333"
                  color="#fff"
                  weight={2}
                  opacity={1}
                  fillOpacity={0.9}
                >
                  <Popup>
  <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
    <div
      onClick={() => router.push(`/StatsPage?lot=${encodeURIComponent(lot.name)}`)}
      style={{
        color: '#1E90FF',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: 16,
        marginBottom: 4,
      }}
    >
      {lot.name}
    </div>
    <div style={{ fontSize: 14, color: '#333' }}>
      {occupied}/{lot.total} spots taken
    </div>
    <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
      Last updated: {lastUpdated}
    </div>
  </div>
</Popup>


                </CircleMarker>
              );
            })}
          </MapContainer>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Find Lot"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
    );
  }

  // 📱 NATIVE VERSION (React Native Maps)
  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        {filteredLots.map((lot) => {
          const { available, lastUpdated } = getLatestAvailability(lot);
          return (
            <Marker
              key={lot.id}
              coordinate={{
                latitude: lot.latitude,
                longitude: lot.longitude,
              }}
              title={lot.name}
              description={`${available}/${lot.total} spots available (updated ${lastUpdated})`}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Image
                source={require('../../assets/images/mark.png')}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </Marker>
          );
        })}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Find Lot"
          value={search}
          onChangeText={setSearch}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  searchContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    padding: 12,
    fontSize: 16,
    borderRadius: 20,
  },
});
