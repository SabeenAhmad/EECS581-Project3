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

// 🧠 Helper for saving filters on web
const storage = {
  async getItem(key) {
    return Promise.resolve(localStorage.getItem(key));
  },
  async setItem(key, value) {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
};


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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('Any');

// ✅ Load saved filters from localStorage
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedPermit = await storage.getItem('selectedPermit');
        const savedAvailability = await storage.getItem('selectedAvailability');
        const savedSearch = await storage.getItem('searchText');

        if (savedPermit) setSelectedPermit(savedPermit);
        if (savedAvailability) setSelectedAvailability(savedAvailability);
        if (savedSearch) setSearch(savedSearch);
      } catch (err) {
        console.log('Error loading filters:', err);
      }
    };

    loadFilters();
  }, []);

  // 💾 Save filters whenever they change
  useEffect(() => {
    storage.setItem('selectedPermit', selectedPermit);
  }, [selectedPermit]);

  useEffect(() => {
    storage.setItem('selectedAvailability', selectedAvailability);
  }, [selectedAvailability]);

  useEffect(() => {
    storage.setItem('searchText', search);
  }, [search]);

  //end of what I added to save search

  
  const router = useRouter();
  const region = {
    latitude: 38.9543,
    longitude: -95.2558,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const filteredLots = lots.filter((lot) => {
    const nameMatch = lot.name.toLowerCase().includes(search.toLowerCase());
    const permitMatch = selectedPermit === 'All' || lot.permit === selectedPermit;

    const { available } = getLatestAvailability(lot);
    let availMatch = true;
    if (selectedAvailability === '> 20') availMatch = available > 20;
    if (selectedAvailability === '> 40') availMatch = available > 40;
    if (selectedAvailability === '> 60') availMatch = available > 60;

    return nameMatch && permitMatch && availMatch;
  });

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
              const { occupied, available, lastUpdated } = getLatestAvailability(lot);
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
                        {available}/{lot.total} spots available
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

        {/* 🔍 Search Bar + Filter Button */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, { flex: 1 }]}
              placeholder="🔍 Find Lot"
              value={search}
              onChangeText={setSearch}
            />
            <Text
              style={styles.filterButton}
              onPress={() => setShowFilters((prev) => !prev)}
            >
              ⚙️
            </Text>
          </View>

          {showFilters && (
            <View style={styles.filterMenu}>
              <Text style={styles.filterLabel}>Permit Type:</Text>
              <View style={styles.filterOptions}>
                {['All', 'Red', 'Yellow', 'Garage'].map((permit) => (
                  <Text
                    key={permit}
                    style={[
                      styles.filterOption,
                      selectedPermit === permit && styles.filterOptionSelected,
                    ]}
                    onPress={() => setSelectedPermit(permit)}
                  >
                    {permit}
                  </Text>
                ))}
              </View>

              <Text style={[styles.filterLabel, { marginTop: 6 }]}>Availability:</Text>
              <View style={styles.filterOptions}>
                {['Any', '> 20', '> 40', '> 60'].map((label) => (
                  <Text
                    key={label}
                    style={[
                      styles.filterOption,
                      selectedAvailability === label && styles.filterOptionSelected,
                    ]}
                    onPress={() => setSelectedAvailability(label)}
                  >
                    {label}
                  </Text>
                ))}
              </View>
            </View>
          )}
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
  searchRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
filterButton: {
  fontSize: 22,
  marginHorizontal: 8,
  color: '#007AFF',
},
filterMenu: {
  backgroundColor: '#f8f8f8',
  borderTopWidth: 1,
  borderColor: '#ddd',
  padding: 10,
  borderBottomLeftRadius: 10,
  borderBottomRightRadius: 10,
},
filterLabel: {
  fontWeight: '600',
  marginBottom: 4,
},
filterOptions: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},
filterOption: {
  paddingVertical: 4,
  paddingHorizontal: 10,
  backgroundColor: '#eee',
  borderRadius: 10,
  fontSize: 14,
},
filterOptionSelected: {
  backgroundColor: '#007AFF',
  color: 'white',
},

});
