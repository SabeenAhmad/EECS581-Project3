import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import lots from '../src/data/mockParking';
import PopularTimes from '../components/popular-times';
import { useTheme } from './context/ThemeContext'; 

export default function StatsPage() {
  const { lot } = useLocalSearchParams();
  const lotData = lots.find((l) => l.name === lot);
  const router = useRouter();

  const { theme, colors } = useTheme(); 

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());

  if (!fontsLoaded) return null;
  if (!lotData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: 100 }]}>
        <Text style={{ color: colors.text, textAlign: 'center' }}>Lot not found</Text>
      </View>
    );
  }

  const latest = lotData.dataPoints[lotData.dataPoints.length - 1];
  const occupied = latest.occupied;
  const percentFull = (occupied / lotData.total) * 100;
  const permitType = lotData.permit;

  const getHourlyData = () => {
    const data = new Array(24).fill(0);
    lotData.dataPoints.forEach((point) => {
      const hour = parseInt(point.time.split(':')[0], 10);
      const occupancyRate = (point.occupied / lotData.total) * 100;
      data[hour] = occupancyRate;
    });
    return data;
  };

  const hourlyData = getHourlyData();

  // Dynamic bar color for occupancy
  let barColor = '#9AE29B'; 
  if (percentFull >= 70) barColor = '#FF9C9C';
  else if (percentFull >= 40) barColor = '#FFE57E'; 

  const colorsByPermit = {
    Green: { bg: '#C8FACC', border: '#8DD493' },
    Yellow: { bg: '#FFF7A3', border: '#E8D87A' },
    Red: { bg: '#FBC7C7', border: '#E89898' },
    Garage: { bg: '#DDE1E7', border: '#B0B8C2' },
  };

  const permitColors = colorsByPermit[permitType] || colorsByPermit.Garage;

  // Progress bar background depends a bit on theme
  const progressBg = theme === 'dark' ? '#222430' : '#F2F1E9';
  const progressBorder = theme === 'dark' ? '#343846' : '#E0DECE';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 40, paddingBottom: 40 }}
    >
      {/* Back Button */}
      <View style={styles.homeButtonContainer}>
        <Text
          style={[
            styles.homeButton,
            { backgroundColor: colors.buttonBackground, color: colors.buttonText },
          ]}
          onPress={() => router.push('/')}
        >
          ← Back to Home
        </Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>{lotData.name}</Text>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressContainer,
          { backgroundColor: progressBg, borderColor: progressBorder },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${percentFull}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Top row */}
      <View style={styles.topRowContainer}>
        {/* LEFT SIDE */}
        <View style={styles.leftColumn}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            {occupied}/{lotData.total} spots taken
          </Text>

          <View
            style={[
              styles.permitTag,
              { backgroundColor: permitColors.bg, borderColor: permitColors.border },
            ]}
          >
            <Text style={styles.permitText}>{permitType} Permit</Text>
          </View>
        </View>

        {/* RIGHT SIDE */}
        <View style={styles.rightColumn}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Last updated: {lastUpdatedTime.toLocaleTimeString()}
          </Text>

          <Text
            style={[
              styles.refreshButton,
              {
                backgroundColor: theme === 'dark' ? '#4EA1FF' : '#0073e6',
              },
            ]}
            onPress={() => setLastUpdatedTime(new Date())}
          >
            ↻ Refresh
          </Text>
        </View>
      </View>

      {/* Busy Hours Chart */}
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Busy Hours</Text>
        <PopularTimes data={hourlyData} maxCapacity={lotData.total} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'left',
    marginBottom: 25,
  },
  progressContainer: {
    width: '100%',
    height: 20,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  permitTag: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  permitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#000', // keep permit pill text black so the traffic-light colors pop
  },
  homeButtonContainer: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 10,
  },
  topRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 12,
  },
  leftColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  rightColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 10,
  },
  homeButton: {
    fontFamily: 'Inter_600SemiBold',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    fontSize: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButton: {
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    fontSize: 15,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    textAlign: 'center',
    minWidth: 100,
  },
  chartContainer: {
    marginTop: 30,
    marginBottom: 40,
  },
  chartTitle: {
    fontSize: 32,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 15,
  },
});
