import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import lots from '../src/data/mockParking';
import { useRouter } from 'expo-router';
export default function StatsPage() {
  const { lot } = useLocalSearchParams();
  const lotData = lots.find((l) => l.name === lot);
  const router = useRouter();

  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) return null;
  if (!lotData) return <Text>Lot not found</Text>;


  const latest = lotData.dataPoints[lotData.dataPoints.length - 1];
  const occupied = latest.occupied;
  const percentFull = (occupied / lotData.total) * 100;
  const lastUpdated = latest.time;
  const permitType = lotData.permit;


  // Dynamic bar color
  let barColor = '#9AE29B'; // green
  if (percentFull >= 70) barColor = '#FF9C9C'; // red
  else if (percentFull >= 40) barColor = '#FFE57E'; // yellow

  const colors = {
    Green: { bg: '#C8FACC', border: '#8DD493', text: '#2E7D32' },
    Yellow: { bg: '#FFF7A3', border: '#E8D87A', text: '#A68B00' },
    Red: { bg: '#FBC7C7', border: '#E89898', text: '#B11E1E' },
    Garage: { bg: '#DDE1E7', border: '#B0B8C2', text: '#2E3A59' },
  };

  const color = colors[permitType];

  return (
    <View style={styles.container}>
      {/* Home Button */}
      <View style={styles.homeButtonContainer}>
        <Text style={styles.homeButton} onPress={() => router.push('/')}>
          ← Back to Home
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{lotData.name}</Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${percentFull}%`, backgroundColor: barColor }]} />
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          {occupied}/{lotData.total} spots taken
        </Text>
        <Text style={styles.infoText}>Last updated: {lastUpdatedTime.toLocaleTimeString()}</Text>
      </View>
      
      {/* Refresh Button */}
      <View style={styles.refreshContainer}>
        <Text style={styles.refreshButton} onPress={() => setLastUpdatedTime(new Date())}>
          ↻ Refresh
        </Text>
      </View>

      {/* Permit Tag */}
      <View
        style={[
          styles.permitTag,
          { backgroundColor: color.bg, borderColor: color.border },
        ]}
      >
        <Text style={styles.permitText}>{permitType} Permit</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Poppins_600SemiBold',
    color: '#222',
    textAlign: 'left',
    marginBottom: 25,
  },
  progressContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#F2F1E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DECE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  infoText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  permitTag: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 25,
  },
  permitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  homeButtonContainer: {
  position: 'absolute',
  top: 50,
  right: 40,
  zIndex: 10,
  },
  homeButton: {
    fontFamily: 'Inter_600SemiBold',
    backgroundColor: '#222',
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    fontSize: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshContainer: {
  marginTop: 18,
  alignSelf: 'flex-start',
  },
  refreshButton: {
    fontFamily: 'Inter_600SemiBold',
    backgroundColor: '#4A90E2',
    color: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 15,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },



});
