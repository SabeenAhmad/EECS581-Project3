import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

import { parkingEvents, ParkingEvent } from '../src/data/parkingEvents';

// ---------- helpers ----------

const impactStyles: Record<
  ParkingEvent['impactLevel'],
  { bg: string; text: string }
> = {
  Low: { bg: '#C8FACC', text: '#2E7D32' },
  Medium: { bg: '#FFF7A3', text: '#A68B00' },
  High: { bg: '#FBC7C7', text: '#B11E1E' },
};

const typeColors: Record<ParkingEvent['type'], string> = {
  Football: '#FF9C9C',
  Basketball: '#9BB9FF',
  'Campus Event': '#B9E5FF',
};

const weekdayShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const toISO = (d: Date) =>
  d.toISOString().slice(0, 10); // YYYY-MM-DD

function buildMonthMatrix(year: number, month: number) {
  // month is 0-based
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // 0-6
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (Date | null)[][] = [];
  let currentDay = 1;
  let done = false;

  while (!done) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (weeks.length === 0 && i < firstWeekday) {
        week.push(null);
      } else if (currentDay > daysInMonth) {
        week.push(null);
        done = true;
      } else {
        week.push(new Date(year, month, currentDay));
        currentDay++;
      }
    }
    weeks.push(week);
  }
  return weeks;
}

const formatMonthYear = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

// ---------- screen ----------

export default function ParkingCalendarScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const today = new Date();
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth()); // 0-based
  const [selectedDate, setSelectedDate] = useState<string>(toISO(today));

  // events indexed by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, ParkingEvent[]> = {};
    parkingEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, []);

  const monthMatrix = useMemo(
    () => buildMonthMatrix(visibleYear, visibleMonth),
    [visibleYear, visibleMonth]
  );

  const selectedEvents = eventsByDate[selectedDate] ?? [];

  const handleMonthChange = (delta: number) => {
    let m = visibleMonth + delta;
    let y = visibleYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setVisibleMonth(m);
    setVisibleYear(y);
  };

  if (!fontsLoaded) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Back button like other screens */}
      <View style={styles.homeButtonContainer}>
        <Text style={styles.homeButton} onPress={() => router.push('/')}>
          ← Back to Home
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Parking Impact Calendar</Text>
      <Text style={styles.subtitle}>
        See KU events that may affect parking availability
      </Text>

      {/* Month selector */}
      <View style={styles.monthRow}>
        <Pressable onPress={() => handleMonthChange(-1)}>
          <Text style={styles.monthNav}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {formatMonthYear(visibleYear, visibleMonth)}
        </Text>
        <Pressable onPress={() => handleMonthChange(1)}>
          <Text style={styles.monthNav}>{'›'}</Text>
        </Pressable>
      </View>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        {/* Weekday header – similar to PopularTimes weekday row */}
        <View style={styles.weekdayHeader}>
          {weekdayShort.map((d) => (
            <Text key={d} style={styles.weekdayLabel}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {monthMatrix.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((date, di) => {
                if (!date) {
                  return <View key={di} style={styles.dayCell} />;
                }

                const iso = toISO(date);
                const isToday = iso === toISO(today);
                const isSelected = iso === selectedDate;
                const dayEvents = eventsByDate[iso] ?? [];
                const hasEvents = dayEvents.length > 0;

                // strongest impact for that day (if multiple events)
                let dotColor = '#C8FACC';
                if (dayEvents.some((e) => e.impactLevel === 'High')) {
                  dotColor = '#FF9C9C';
                } else if (
                  dayEvents.some((e) => e.impactLevel === 'Medium')
                ) {
                  dotColor = '#FFE57E';
                }

                return (
                  <Pressable
                    key={di}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => setSelectedDate(iso)}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isToday && styles.dayToday,
                        isSelected && styles.daySelectedText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {hasEvents && (
                      <View
                        style={[
                          styles.eventDot,
                          { backgroundColor: dotColor },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Selected date events */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>
          {selectedEvents.length > 0
            ? 'Events affecting parking'
            : 'No major events on this day'}
        </Text>

        {selectedEvents.map((event) => {
          const impact = impactStyles[event.impactLevel];
          const typeColor = typeColors[event.type];

          return (
            <View key={event.id} style={styles.eventCard}>
              <View
                style={[styles.typeStrip, { backgroundColor: typeColor }]}
              />
              <View style={styles.eventContent}>
                <View style={styles.eventHeaderRow}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View
                    style={[
                      styles.impactBadge,
                      { backgroundColor: impact.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.impactText,
                        { color: impact.text },
                      ]}
                    >
                      {event.impactLevel} Impact
                    </Text>
                  </View>
                </View>
                <Text style={styles.eventDetail}>
                  {event.time} · {event.venue}
                </Text>
                <Text style={styles.eventDetail}>
                  Affects{' '}
                  <Text style={styles.eventLots}>
                    {event.lotsAffected.join(', ')}
                  </Text>
                </Text>
                {event.notes && (
                  <Text style={styles.eventNotes}>{event.notes}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ---------- styles ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F4',
    paddingTop: 100,
    paddingHorizontal: 40,
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
  title: {
    fontSize: 34,
    fontFamily: 'Poppins_600SemiBold',
    color: '#222',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#555',
    marginBottom: 18,
  },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 20,
  },
  monthLabel: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#222',
  },
  monthNav: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#555',
  },

  calendarCard: {
    backgroundColor: '#FDFCF7',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekdayLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#8A8A8A',
  },
  grid: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dayCellSelected: {
    backgroundColor: '#EEEADD',
    borderRadius: 10,
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  dayToday: {
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
  daySelectedText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
  },
  eventDot: {
    marginTop: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  eventsSection: {
    marginTop: 8,
  },
  eventsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  typeStrip: {
    width: 6,
  },
  eventContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#222',
  },
  impactBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  impactText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  eventDetail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#555',
    marginTop: 2,
  },
  eventLots: {
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  eventNotes: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#777',
    marginTop: 6,
  },
});
