import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "@/lib/utils";

interface TimelineEvent {
    status: string;
    title: string;
    description: string;
    timestamp: string;
}

interface OrderTimelineProps {
    events?: TimelineEvent[];
}

export default function OrderTimeline({ events = [] }: OrderTimelineProps) {
    if (!events || events.length === 0) return null;

    // Sort events by timestamp (newest first)
    const sortedEvents = [...events].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <View className="px-5 mt-6">
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <Text className="text-gray-800 text-lg font-bold mb-4">Lacak Pesanan</Text>

                <View className="ml-2">
                    {sortedEvents.map((event, index) => {
                        const isLatest = index === 0;
                        const isLast = index === sortedEvents.length - 1;

                        return (
                            <View key={index} className="flex-row">
                                {/* Timeline Line & Dot */}
                                <View className="items-center mr-4" style={{ width: 24 }}>
                                    <View
                                        className={`w-4 h-4 rounded-full border-2 ${isLatest ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                                            }`}
                                    />
                                    {!isLast && (
                                        <View className="w-0.5 flex-1 bg-gray-200 my-1" />
                                    )}
                                </View>

                                {/* Content */}
                                <View className="flex-1 pb-6">
                                    <Text className={`font-bold text-sm ${isLatest ? "text-green-600" : "text-gray-800"}`}>
                                        {event.title}
                                    </Text>
                                    <Text className="text-gray-500 text-xs mb-1">
                                        {formatDate(event.timestamp)}
                                    </Text>
                                    <Text className="text-gray-600 text-sm">
                                        {event.description}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
