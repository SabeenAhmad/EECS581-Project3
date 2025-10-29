import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';
import lots from '../src/data/mockParking';

export default function StatsPage() {
  const { lot } = useLocalSearchParams();
  const lotData = lots.find((l) => l.name === lot);

  if (!lotData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Lot not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{lotData.name}</Text>
      <Text>Total spaces: {lotData.total}</Text>
      <Text>
        Currently occupied: {lotData.dataPoints[lotData.dataPoints.length - 1].occupied}
      </Text>
    </View>
  );
}
