import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import useNotifications, { Notification } from "@/hooks/useNotifications";
import { useNotification } from "@/context/NotificationContext";

const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
        case "order_status":
            return { name: "cube-outline", color: "#3B82F6", bg: "#DBEAFE" };
        case "promo":
            return { name: "pricetag-outline", color: "#F59E0B", bg: "#FEF3C7" };
        case "reminder":
            return { name: "alarm-outline", color: "#8B5CF6", bg: "#EDE9FE" };
        case "system":
            return { name: "settings-outline", color: "#6B7280", bg: "#F3F4F6" };
        case "info":
        default:
            return { name: "information-circle-outline", color: "#22C55E", bg: "#DCFCE7" };
    }
};

const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return notifDate.toLocaleDateString("id-ID");
};

function NotificationsScreen() {
    const {
        notifications,
        unreadCount,
        isLoading,
        refetch,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAll,
        isMarkingAllRead,
    } = useNotifications();
    const { showToast, showConfirmation } = useNotification();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleNotificationPress = (notification: Notification) => {
        // Mark as read if not already
        if (!notification.isRead) {
            markAsRead(notification._id);
        }

        // Navigate based on notification type and data
        if (notification.type === "order_status" && notification.data?.orderId) {
            router.push(`/(profile)/orders`);
        }
    };

    const handleMarkAllAsRead = () => {
        if (unreadCount === 0) {
            showToast("info", "Info", "Semua notifikasi sudah dibaca");
            return;
        }
        markAllAsRead();
        showToast("success", "Berhasil", "Semua notifikasi ditandai sudah dibaca");
    };

    const handleDeleteAll = () => {
        if (notifications.length === 0) {
            showToast("info", "Info", "Tidak ada notifikasi untuk dihapus");
            return;
        }
        showConfirmation({
            title: "Hapus Semua Notifikasi",
            message: "Apakah Anda yakin ingin menghapus semua notifikasi?",
            type: "warning",
            confirmText: "Hapus",
            cancelText: "Batal",
            onConfirm: () => {
                deleteAll();
                showToast("success", "Berhasil", "Semua notifikasi dihapus");
            },
        });
    };

    const handleDeleteSingle = (id: string) => {
        deleteNotification(id);
        showToast("success", "Dihapus", "Notifikasi dihapus");
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50">
                <LinearGradient
                    colors={["#22C55E", "#16A34A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
                >
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/20 p-2 rounded-xl mr-3"
                        >
                            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text className="text-white text-2xl font-bold">Notifikasi</Text>
                    </View>
                </LinearGradient>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22C55E" />
                    <Text className="text-gray-500 mt-4">Memuat notifikasi...</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 }}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/20 p-2 rounded-xl mr-3"
                        >
                            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-white text-2xl font-bold">Notifikasi</Text>
                            {unreadCount > 0 && (
                                <Text className="text-white/70 text-sm">{unreadCount} belum dibaca</Text>
                            )}
                        </View>
                    </View>

                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={handleMarkAllAsRead}
                            className="bg-white/20 p-2 rounded-xl"
                            disabled={isMarkingAllRead}
                        >
                            <Ionicons name="checkmark-done-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleDeleteAll}
                            className="bg-white/20 p-2 rounded-xl"
                        >
                            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22C55E"]} />
                }
            >
                {notifications.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <View className="bg-gray-100 p-6 rounded-full mb-4">
                            <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                        </View>
                        <Text className="text-gray-800 text-lg font-bold mb-2">Tidak Ada Notifikasi</Text>
                        <Text className="text-gray-500 text-center px-10">
                            Anda akan menerima notifikasi tentang pesanan, promo, dan update lainnya di sini
                        </Text>
                    </View>
                ) : (
                    <View className="px-5 pt-4">
                        {notifications.map((notification) => {
                            const icon = getNotificationIcon(notification.type);
                            return (
                                <TouchableOpacity
                                    key={notification._id}
                                    className={`bg-white rounded-2xl p-4 mb-3 shadow-sm ${!notification.isRead ? "border-l-4 border-green-500" : ""
                                        }`}
                                    activeOpacity={0.7}
                                    onPress={() => handleNotificationPress(notification)}
                                    onLongPress={() => handleDeleteSingle(notification._id)}
                                >
                                    <View className="flex-row">
                                        <View
                                            style={{ backgroundColor: icon.bg }}
                                            className="w-12 h-12 rounded-full items-center justify-center mr-3"
                                        >
                                            <Ionicons name={icon.name as any} size={24} color={icon.color} />
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center justify-between mb-1">
                                                <Text
                                                    className={`text-gray-800 font-bold text-base flex-1 ${!notification.isRead ? "text-gray-900" : "text-gray-700"
                                                        }`}
                                                    numberOfLines={1}
                                                >
                                                    {notification.title}
                                                </Text>
                                                {!notification.isRead && (
                                                    <View className="bg-green-500 w-2 h-2 rounded-full ml-2" />
                                                )}
                                            </View>
                                            <Text className="text-gray-600 text-sm mb-2" numberOfLines={2}>
                                                {notification.message}
                                            </Text>
                                            <Text className="text-gray-400 text-xs">
                                                {formatTimeAgo(notification.createdAt)}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Info tip */}
                        <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2 flex-row items-start">
                            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
                            <Text className="text-gray-600 text-xs ml-2 flex-1">
                                Tekan lama pada notifikasi untuk menghapus
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

export default NotificationsScreen;
