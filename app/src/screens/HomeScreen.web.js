import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { parkingEvents } from "../data/parkingEvents";

import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFonts, Inter_600SemiBold, Inter_400Regular } from '@expo-google-fonts/inter';
import lots from '../data/mockParking';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../app/context/ThemeContext';

const { width, height } = Dimensions.get('window');

function convertTo12Hour(time24) {
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${ampm}`;
}


function getLatestAvailability(lot) {
  const latest = lot.dataPoints[lot.dataPoints.length - 1];
  const available = lot.total - latest.occupied;
  return {
    available,
    lastUpdated: convertTo12Hour(latest.time),
    occupied: latest.occupied,
  };
}

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [LeafletReady, setLeafletReady] = useState(false);
  const [LeafletModules, setLeafletModules] = useState(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [specialEventMessage, setSpecialEventMessage] = useState('');

  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_600SemiBold,
    Inter_400Regular,
  });

  const region = {
    latitude: 38.9543,
    longitude: -95.2558,
  };

  const filteredLots = lots.filter((lot) =>
    lot.name.toLowerCase().startsWith(search.trim().toLowerCase())
  );

  const onSelectLot = (lot) => {
    setSearch(lot.name);
    router.push(`/StatsPage?lot=${encodeURIComponent(lot.name)}`);
  };

  const saveFeedback = () => {
    if (!feedbackText.trim() && rating === 0) {
      Alert.alert('Please provide a rating or feedback');
      return;
    }
    const feedback = {
      message: feedbackText,
      rating: rating,
      timestamp: new Date().toISOString(),
    };
    console.log('Feedback submitted:', feedback);
    Alert.alert('Thank you!', 'Your feedback has been submitted.');
    setFeedbackVisible(false);
    setFeedbackText('');
    setRating(0);
  };

  // SEARCH BAR COLORS
  const searchBackground = theme === 'dark' ? '#f5f5f5' : '#111111';
  const searchBorderColor = theme === 'dark' ? '#dddddd' : '#444444';
  const searchTextColor = theme === 'dark' ? '#111111' : '#f5f5f5';
  const searchPlaceholderColor = theme === 'dark' ? '#666666' : '#bbbbbb';

  const renderSuggestions = () => {
    if (!search.trim()) return null;

    if (filteredLots.length === 0) {
      return (
        <View style={[styles.suggestions, { backgroundColor: searchBackground }]}>
          <Text style={[styles.noResults, { color: searchTextColor }]}>
            No lots found
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.suggestions, { backgroundColor: searchBackground }]}>
        {filteredLots.slice(0, 6).map((lot) => {
          const { available } = getLatestAvailability(lot);
          return (
            <TouchableOpacity
              key={lot.id}
              style={styles.suggestionItem}
              onPress={() => onSelectLot(lot)}
            >
              <Text style={[styles.suggestionText, { color: searchTextColor }]}>
                {lot.name} — {available}/{lot.total}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // SPECIAL EVENT BANNER
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA");
    const todayEvents = parkingEvents.filter(e => e.date === today);

    if (todayEvents.length === 0) {
      setSpecialEventMessage("");
      return;
    }

    const builtMessage = todayEvents
      .map(event => {
        const emoji =
          event.impactLevel === "High" ? "🚨" :
          event.impactLevel === "Medium" ? "⚠️" : "ℹ️";

        return `${emoji} ${event.title} — ${event.time}`;
      })
      .join("\n");

    setSpecialEventMessage(builtMessage);
  }, []);

  // Load Leaflet dynamically
  useEffect(() => {
    (async () => {
      const leaflet = await import('leaflet');
      const reactLeaflet = await import('react-leaflet');
      setLeafletModules({ ...reactLeaflet, L: leaflet });
      setLeafletReady(true);
    })();
  }, []);

  if (!LeafletReady || !LeafletModules || !fontsLoaded) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading map...</Text>
      </View>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = LeafletModules;

  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const popupMainColor = '#333333';
  const popupSubColor = '#777777';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* SPECIAL EVENT BANNER */}
      {specialEventMessage !== "" && (
        <View style={[styles.banner, { backgroundColor: colors.bannerBackground }]}>
          <Text style={[styles.bannerText, { color: colors.bannerText }]}>
            {specialEventMessage}
          </Text>
        </View>
      )}

      {/* MAP SECTION */}
      <View style={{ flex: 1 }}>
        <MapContainer
          center={[region.latitude, region.longitude]}
          zoom={15}
          style={{ height: height, width: width }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url={tileUrl}
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
                  <div style={{ fontFamily: 'Arial', textAlign: 'center' }}>
                    <div
                      onClick={() =>
                        router.push(`/StatsPage?lot=${encodeURIComponent(lot.name)}`)}
                      style={{
                        color: '#4ea1ff',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: 16,
                        marginBottom: 4,
                      }}
                    >
                      {lot.name}
                    </div>
                    <div style={{ fontSize: 14, color: popupMainColor }}>
                      {available}/{lot.total} spots available
                    </div>
                    <div style={{ fontSize: 12, color: popupSubColor, marginTop: 2 }}>
                      Last updated: {lastUpdated}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </View>

      {/* THEME TOGGLE BUTTON */}
      <TouchableOpacity
        style={[
          styles.themeToggleButton,
          { backgroundColor: colors.buttonBackground },
        ]}
        onPress={toggleTheme}
      >
        <Feather
          name={theme === 'light' ? 'moon' : 'sun'}
          size={22}
          color={colors.buttonText}
        />
      </TouchableOpacity>

      {/* Calendar Button */}
      <TouchableOpacity
        style={[styles.calendarButton, { backgroundColor: colors.buttonBackground }]}
        onPress={() => router.push('/calendar')}
      >
        <Feather name="calendar" size={24} color={colors.buttonText} />
      </TouchableOpacity>

      {/* Feedback Button */}
      <TouchableOpacity
        style={[
          styles.feedbackButton,
          { backgroundColor: theme === 'dark' ? '#f5f5f5' : '#222222' },
        ]}
        onPress={() => setFeedbackVisible(true)}
      >
        <Feather
          name="message-circle"
          size={22}
          color={theme === 'dark' ? '#050816' : '#ffffff'}
        />
      </TouchableOpacity>

      {/* SEARCH */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: searchBackground,
            borderColor: searchBorderColor,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <Feather
            name="search"
            size={20}
            color={searchPlaceholderColor}
            style={{ marginHorizontal: 10 }}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: searchTextColor },
            ]}
            placeholder="Find Lot"
            placeholderTextColor={searchPlaceholderColor}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {renderSuggestions()}
      </View>

      {/* FEEDBACK MODAL */}
      <Modal
        visible={feedbackVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFeedbackVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.modalBackground },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colors.modalText },
              ]}
            >
              Send Feedback
            </Text>

            <View style={styles.ratingContainer}>
              <Text
                style={[
                  styles.ratingLabel,
                  { color: colors.modalText },
                ]}
              >
                Rate your experience:
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Text
                      style={[
                        styles.star,
                        { color: colors.starEmpty },
                        rating >= star && { color: colors.starFilled },
                      ]}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={[
                styles.feedbackInput,
                {
                  borderColor: colors.inputBorder,
                  color: colors.modalText,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Tell us what you think..."
              placeholderTextColor={theme === 'dark' ? '#aaaaaa' : '#777777'}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: theme === 'dark' ? '#222222' : '#f0f0f0',
                    borderColor: colors.inputBorder,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  setFeedbackVisible(false);
                  setRating(0);
                }}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: colors.modalText },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!feedbackText.trim() && rating === 0) && styles.submitButtonDisabled,
                  (!feedbackText.trim() && rating === 0) && { backgroundColor: '#ccc' },
                  (feedbackText.trim() || rating !== 0) && { backgroundColor: colors.buttonBackground },
                ]}
                onPress={(!feedbackText.trim() && rating === 0) ? null : saveFeedback}
                disabled={!feedbackText.trim() && rating === 0}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    (!feedbackText.trim() && rating === 0) && styles.submitButtonTextDisabled,
                    (feedbackText.trim() || rating !== 0) && { color: colors.buttonText },
                  ]}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  calendarButton: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 20,
  },

  themeToggleButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 20,
  },

  feedbackButton: {
    position: 'absolute',
    top: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 21,
  },

  searchContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: '90%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 12,
    fontSize: 16,
    outlineWidth: 0,
    outlineColor: 'transparent',
    outlineStyle: 'none',
    boxShadow: 'none',
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
  },
  noResults: {
    padding: 8,
  },

  banner: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  bannerText: {
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },

  feedbackButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginBottom: 15,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
    marginBottom: 15,
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  ratingContainer: {
    marginBottom: 15,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: 5,
  },
  star: {
    fontSize: 30,
  },
  starFilled: {},
  submitButtonDisabled: {},
  submitButtonTextDisabled: {
    color: '#999',
  },
});
