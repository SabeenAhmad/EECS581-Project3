import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PopularTimesProps {
  data: number[];
  currentHour?: number;
}

const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const PopularTimes: React.FC<PopularTimesProps> = ({ data, currentHour = new Date().getHours() }) => {
  const maxValue = Math.max(...data);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Popular times</Text>
        <Text style={styles.info}>?</Text>
      </View>
      
      <View style={styles.daysContainer}>
        {days.map((day, index) => (
          <Text 
            key={day} 
            style={[
              styles.dayText,
              index === new Date().getDay() && styles.currentDay
            ]}
          >
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.graphContainer}>
        {data.map((value, hour) => {
          const height = (value / maxValue) * 100;
          return (
            <View key={hour} style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar,
                  { height: `${height}%` },
                  hour === currentHour && styles.currentHourBar
                ]} 
              />
            </View>
          );
        })}
      </View>

      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>6a</Text>
        <Text style={styles.timeLabel}>12p</Text>
        <Text style={styles.timeLabel}>6p</Text>
        <Text style={styles.timeLabel}>12a</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: '#3F3F3F',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayText: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  currentDay: {
    color: '#4285F4',
  },
  graphContainer: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  bar: {
    width: '100%',
    backgroundColor: '#AAAAAA',
    borderRadius: 1,
  },
  currentHourBar: {
    backgroundColor: '#4285F4',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeLabel: {
    color: '#AAAAAA',
    fontSize: 12,
  },
});

export default PopularTimes;