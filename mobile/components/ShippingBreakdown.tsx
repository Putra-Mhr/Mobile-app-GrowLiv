import { View, Text } from 'react-native';

interface ShippingBreakdownProps {
    breakdown: Array<{
        location: string;
        distance: number;
        cost: number;
        itemCount: number;
    }>;
    total: number;
}

export function ShippingBreakdown({ breakdown, total }: ShippingBreakdownProps) {
    if (!breakdown || breakdown.length === 0) {
        return null;
    }

    return (
        <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-lg font-bold mb-3">🚚 Rincian Ongkir</Text>

            {breakdown.map((item, index) => (
                <View
                    key={index}
                    className="mb-3 pb-3 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0"
                >
                    <Text className="font-semibold text-gray-800">{item.location}</Text>
                    <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-600 text-sm">
                            {item.distance} km • {item.itemCount} item{item.itemCount > 1 ? 's' : ''}
                        </Text>
                        <Text className="font-bold text-green-600">
                            Rp {item.cost.toLocaleString('id-ID')}
                        </Text>
                    </View>
                </View>
            ))}

            <View className="flex-row justify-between pt-3 border-t border-gray-300">
                <Text className="font-bold text-lg">Total Ongkir:</Text>
                <Text className="font-bold text-lg text-green-600">
                    Rp {total.toLocaleString('id-ID')}
                </Text>
            </View>
        </View>
    );
}
