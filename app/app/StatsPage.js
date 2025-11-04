import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import lots from '../src/data/mockParking';
import { useRouter } from 'expo-router';
//added imports
import { BarChart } from 'react-native-chart-kit';
export default function StatsPage() {
  const { lot } = useLocalSearchParams();
  const lotData = lots.find((l) => l.name === lot);
  const router = useRouter();
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

  // Generate hourly usage data from 6AM to 11PM
  // Generate hourly usage data from 7AM to 6PM
  const generateHourlyData = () => {
    const hours = [];
    const usage = [];
    
    for (let hour = 7; hour <= 18; hour++) {
      hours.push(hour <= 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour-12}PM`);
      
      // Find closest data point or estimate
      const closest = lotData.dataPoints.reduce((prev, curr) => {
        const prevHour = parseInt(prev.time.split(':')[0]);
        const currHour = parseInt(curr.time.split(':')[0]);
        return Math.abs(currHour - hour) < Math.abs(prevHour - hour) ? curr : prev;
      });
      
      const percentage = (closest.occupied / lotData.total) * 100;
      usage.push(percentage);
    }
    
    return { hours, usage };
  };

  const { hours, usage } = generateHourlyData();

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1, index) => {
      const value = usage[index];
      if (value >= 70) return `rgba(255, 156, 156, ${opacity})`; // red
      if (value >= 40) return `rgba(255, 229, 126, ${opacity})`; // yellow
      return `rgba(154, 226, 155, ${opacity})`; // green
    },
    labelColor: () => '#333',
    style: { borderRadius: 16 },
    propsForLabels: { 
      fontSize: 10,
      fontFamily: 'Inter_400Regular'
    },
    barPercentage: 0.8,
    categoryPercentage: 0.9,
  };

  const colors = {
    Green: { bg: '#C8FACC', border: '#8DD493', text: '#2E7D32' },
    Yellow: { bg: '#FFF7A3', border: '#E8D87A', text: '#A68B00' },
    Red: { bg: '#FBC7C7', border: '#E89898', text: '#B11E1E' },
    Garage: { bg: '#DDE1E7', border: '#B0B8C2', text: '#2E3A59' },
  };

  const color = colors[permitType];

  return (
    <ScrollView style={styles.container}>
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
        <Text style={styles.infoText}>Last updated: {lastUpdated}</Text>
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
      {/* Busy Hours Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Busy Hours</Text>
        <BarChart
          data={{
            labels: hours,
            datasets: [{ 
              data: usage,
              colors: usage.map(value => {
                if (value >= 70) return () => '#FF9C9C'; // red
                if (value >= 40) return () => '#FFE57E'; // yellow
                return () => '#9AE29B'; // green
              })
            }]
          }}
          width={Dimensions.get('window').width - 80}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars={false}
          fromZero={true}
          withCustomBarColorFromData={true}
        />
        {/*
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#9AE29B' }]} />
            <Text style={styles.legendText}>Light</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFE57E' }]} />
            <Text style={styles.legendText}>Moderate</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF9C9C' }]} />
            <Text style={styles.legendText}>Heavy</Text>
          </View>
        </View>
        */}
      </View>
      </ScrollView>
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
  top: 30,
  right: 20,
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
  chartContainer: {
    marginTop: 30,
    marginBottom: 40,
  },
  chartTitle: {
    fontSize: 32,
    fontFamily: 'Poppins_600SemiBold',
    color: '#222',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },



});
