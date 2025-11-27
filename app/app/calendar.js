import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

import { parkingEvents } from '../src/data/parkingEvents';
import { useTheme } from './context/ThemeContext';

// ---------- helpers ----------

const impactStyles = {
  Low: { bg: '#C8FACC', text: '#2E7D32' },
  Medium: { bg: '#FFF7A3', text: '#A68B00' },
  High: { bg: '#FBC7C7', text: '#B11E1E' },
};

const typeColors = {
  Football: '#FF9C9C',
  Basketball: '#9BB9FF',
  'Campus Event': '#B9E5FF',
};

const weekdayShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const toISO = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD

function buildMonthMatrix(year, month) {
  // month is 0 based
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay(); // 0-6
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let currentDay = 1;
  let done = false;

  while (!done) {
    const week = [];
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

const formatMonthYear = (year, month) =>
  new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

// ---------- screen ----------

export default function ParkingCalendarScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const today = new Date();
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth()); // 0 based
  const [selectedDate, setSelectedDate] = useState(toISO(today));

  // events indexed by date
  const eventsByDate = useMemo(() => {
    const map = {};
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

  const handleMonthChange = (delta) => {
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

  const secondaryTextColor = theme === 'dark' ? '#aaaaaa' : '#555555';
  const mutedTextColor = theme === 'dark' ? '#888888' : '#8A8A8A';
  const calendarCardBg = theme === 'dark' ? '#111827' : '#FDFCF7';
  const selectedCellBg = theme === 'dark' ? '#222430' : '#EEEADD';
  const eventCardBg = theme === 'dark' ? '#020617' : '#FFFFFF';
  const eventDetailColor = theme === 'dark' ? '#cccccc' : '#555555';
  const eventNoteColor = theme === 'dark' ? '#aaaaaa' : '#777777';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 40, paddingBottom: 40 }}
    >
      {/* Back button */}
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
      <Text style={[styles.title, { color: colors.text }]}>Parking Impact Calendar</Text>
      <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
        See KU events that may affect parking availability
      </Text>

      {/* Month selector */}
      <View style={styles.monthRow}>
        <Pressable onPress={() => handleMonthChange(-1)}>
          <Text style={[styles.monthNav, { color: secondaryTextColor }]}>{'‹'}</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {formatMonthYear(visibleYear, visibleMonth)}
        </Text>
        <Pressable onPress={() => handleMonthChange(1)}>
          <Text style={[styles.monthNav, { color: secondaryTextColor }]}>{'›'}</Text>
        </Pressable>
      </View>

      {/* Calendar */}
      <View style={[styles.calendarCard, { backgroundColor: calendarCardBg }]}>
        {/* Weekday header */}
        <View style={styles.weekdayHeader}>
          {weekdayShort.map((d) => (
            <Text key={d} style={[styles.weekdayLabel, { color: mutedTextColor }]}>
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

                // strongest impact for that day
                let dotColor = '#C8FACC';
                if (dayEvents.some((e) => e.impactLevel === 'High')) {
                  dotColor = '#FF9C9C';
                } else if (dayEvents.some((e) => e.impactLevel === 'Medium')) {
                  dotColor = '#FFE57E';
                }

                return (
                  <Pressable
                    key={di}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: selectedCellBg, borderRadius: 10 },
                    ]}
                    onPress={() => setSelectedDate(iso)}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: colors.text },
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
        <Text style={[styles.eventsTitle, { color: colors.text }]}>
          {selectedEvents.length > 0
            ? 'Events affecting parking'
            : 'No major events on this day'}
        </Text>

        {selectedEvents.map((event) => {
          const impact = impactStyles[event.impactLevel];
          const typeColor = typeColors[event.type];

          return (
            <View
              key={event.id}
              style={[
                styles.eventCard,
                { backgroundColor: eventCardBg },
              ]}
            >
              <View
                style={[styles.typeStrip, { backgroundColor: typeColor }]}
              />
              <View style={styles.eventContent}>
                <View style={styles.eventHeaderRow}>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>
                    {event.title}
                  </Text>
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
                <Text style={[styles.eventDetail, { color: eventDetailColor }]}>
                  {event.time} · {event.venue}
                </Text>
                <Text style={[styles.eventDetail, { color: eventDetailColor }]}>
                  Affects{' '}
                  <Text style={[styles.eventLots, { color: colors.text }]}>
                    {event.lotsAffected.join(', ')}
                  </Text>
                </Text>
                {event.notes && (
                  <Text style={[styles.eventNotes, { color: eventNoteColor }]}>
                    {event.notes}
                  </Text>
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
    // backgroundColor is themed in render
  },
  homeButtonContainer: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 10,
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
  title: {
    fontSize: 34,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
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
  },
  monthNav: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },

  calendarCard: {
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
  dayNumber: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  dayToday: {
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
  daySelectedText: {
    fontFamily: 'Inter_600SemiBold',
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
    marginBottom: 10,
  },
  eventCard: {
    flexDirection: 'row',
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
    marginTop: 2,
  },
  eventLots: {
    fontFamily: 'Inter_600SemiBold',
  },
  eventNotes: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
});
