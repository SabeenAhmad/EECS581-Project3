import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import lots from '../data/mockParking';
import 'leaflet/dist/leaflet.css';

const { width, height } = Dimensions.get('window');

// Helper: get most recent datapoint for each lot
function getLatestAvailability(lot) {
  const latest = lot.dataPoints[lot.dataPoints.length - 1];
  const available = lot.total - latest.occupied;
  const occupied = latest.occupied;
  return {
    available,
    lastUpdated: latest.time,
    occupied,
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
  };

  const filteredLots = lots.filter((lot) =>
    lot.name.toLowerCase().includes(search.toLowerCase())
  );

  const onSelectLot = (lot) => {
    setSearch(lot.name);
    router.push(`/StatsPage?lot=${encodeURIComponent(lot.name)}`);
  };

  const renderSuggestions = () => {
    if (!search.trim()) return null;
    if (filteredLots.length === 0) {
      return (
        <View style={styles.suggestions}>
          <Text style={styles.noResults}>No lots found</Text>
        </View>
      );
    }

    return (
      <View style={styles.suggestions}>
        {filteredLots.slice(0, 6).map((lot) => {
          const { available } = getLatestAvailability(lot);
          return (
            <TouchableOpacity
              key={lot.id}
              style={styles.suggestionItem}
              onPress={() => onSelectLot(lot)}
            >
              <Text style={styles.suggestionText}>
                {lot.name} — {available}/{lot.total}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // 🌐 Load Leaflet dynamically
  useEffect(() => {
    (async () => {
      const leaflet = await import('leaflet');
      const reactLeaflet = await import('react-leaflet');
      setLeafletModules({ ...reactLeaflet, L: leaflet });
      setLeafletReady(true);
    })();
  }, []);

  if (!LeafletReady || !LeafletModules) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
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
            const { available, lastUpdated } = getLatestAvailability(lot);
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
                      onClick={() =>
                        router.push(`/StatsPage?lot=${encodeURIComponent(lot.name)}`)
                      }
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Find Lot"
          value={search}
          onChangeText={setSearch}
        />
        {renderSuggestions()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  suggestions: {
    maxHeight: 220,
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  suggestionText: {
    fontSize: 15,
    color: '#111',
  },
  noResults: {
    padding: 8,
    color: '#666',
  },
});
