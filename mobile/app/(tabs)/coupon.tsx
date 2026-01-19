import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNotification } from "@/context/NotificationContext";

type CouponTab = "available" | "myCoupons" | "expired";

interface Coupon {
    id: string;
    code: string;
    title: string;
    description: string;
    discount: string;
    minPurchase: number;
    expiryDate: string;
    isUsed?: boolean;
}

// Mock data - in real app this would come from API
const MOCK_COUPONS: { available: Coupon[]; myCoupons: Coupon[]; expired: Coupon[] } = {
    available: [
        {
            id: "1",
            code: "SEGAR50",
            title: "Diskon Sayuran Segar",
            description: "Potongan untuk pembelian sayuran",
            discount: "50%",
            minPurchase: 100000,
            expiryDate: "2026-02-28",
        },
        {
            id: "2",
            code: "BUAH25K",
            title: "Cashback Buah-buahan",
            description: "Cashback untuk semua jenis buah",
            discount: "Rp 25.000",
            minPurchase: 75000,
            expiryDate: "2026-02-15",
        },
    ],
    myCoupons: [
        {
            id: "3",
            code: "HERBAL20",
            title: "Diskon Tanaman Herbal",
            description: "Untuk pembelian herbal pilihan",
            discount: "20%",
            minPurchase: 50000,
            expiryDate: "2026-01-31",
        },
    ],
    expired: [
        {
            id: "4",
            code: "NEWYEAR",
            title: "Promo Tahun Baru",
            description: "Diskon awal tahun",
            discount: "30%",
            minPurchase: 150000,
            expiryDate: "2026-01-05",
            isUsed: true,
        },
    ],
};

const TABS: { key: CouponTab; label: string; icon: string }[] = [
    { key: "available", label: "Tersedia", icon: "ticket" },
    { key: "myCoupons", label: "Kupon Saya", icon: "bookmark" },
    { key: "expired", label: "Kadaluarsa", icon: "time" },
];

const CouponCard = ({ coupon, isExpired, onClaim }: { coupon: Coupon; isExpired?: boolean; onClaim?: () => void }) => {
    const daysLeft = Math.ceil(
        (new Date(coupon.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
        <View
            className={`mb-4 rounded-2xl overflow-hidden shadow-sm ${isExpired ? "opacity-60" : ""
                }`}
            style={{
                borderWidth: 2,
                borderColor: isExpired ? "#D1D5DB" : "#22C55E",
                borderStyle: "dashed",
            }}
        >
            <View className="flex-row">
                {/* Left section - Discount */}
                <LinearGradient
                    colors={isExpired ? ["#9CA3AF", "#6B7280"] : ["#22C55E", "#16A34A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="w-28 items-center justify-center py-6"
                >
                    <View className="items-center">
                        <Text className="text-white font-bold text-2xl">{coupon.discount}</Text>
                        <Text className="text-white/80 text-xs mt-1">OFF</Text>
                    </View>
                    {/* Decorative circles for ticket look */}
                    <View className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
                </LinearGradient>

                {/* Right section - Details */}
                <View className="flex-1 bg-white p-4">
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                            <Text className="text-gray-800 font-bold text-base">{coupon.title}</Text>
                            <Text className="text-gray-500 text-sm mt-1">{coupon.description}</Text>
                        </View>
                        {!isExpired && (
                            <View className="bg-green-100 px-2 py-1 rounded-full">
                                <Text className="text-green-700 text-xs font-medium">
                                    {daysLeft > 0 ? `${daysLeft} hari` : "Hari ini"}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-dashed border-gray-200">
                        <View className="flex-row items-center">
                            <Ionicons name="receipt-outline" size={14} color="#6B7280" />
                            <Text className="text-gray-500 text-xs ml-1">
                                Min. Rp {coupon.minPurchase.toLocaleString("id-ID")}
                            </Text>
                        </View>
                        <View className="bg-gray-100 px-3 py-1 rounded-lg">
                            <Text className="text-gray-600 font-mono font-bold text-sm">
                                {coupon.code}
                            </Text>
                        </View>
                    </View>

                    {!isExpired && onClaim && (
                        <TouchableOpacity
                            className="bg-green-500 mt-3 py-2 rounded-xl items-center"
                            activeOpacity={0.8}
                            onPress={onClaim}
                        >
                            <Text className="text-white font-bold">Klaim Kupon</Text>
                        </TouchableOpacity>
                    )}

                    {coupon.isUsed && (
                        <View className="absolute top-2 right-2 bg-gray-200 px-2 py-1 rounded-full">
                            <Text className="text-gray-500 text-xs font-medium">Sudah dipakai</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const EmptyState = ({ tab }: { tab: CouponTab }) => {
    const config = {
        available: {
            icon: "ticket-outline" as const,
            title: "Belum Ada Kupon",
            message: "Kupon promosi akan muncul di sini. Pantau terus untuk diskon menarik!",
        },
        myCoupons: {
            icon: "bookmark-outline" as const,
            title: "Kupon Kosong",
            message: "Klaim kupon dari tab 'Tersedia' untuk mulai mengumpulkan!",
        },
        expired: {
            icon: "time-outline" as const,
            title: "Tidak Ada Kupon Kadaluarsa",
            message: "Semua kupon Anda masih berlaku. Gunakan sebelum habis masa berlakunya!",
        },
    };

    const { icon, title, message } = config[tab];

    return (
        <View className="flex-1 items-center justify-center px-8 py-16">
            {/* Decorative gardening illustration */}
            <View className="relative mb-6">
                <View className="w-32 h-32 bg-green-50 rounded-full items-center justify-center">
                    <Ionicons name={icon} size={48} color="#22C55E" />
                </View>
                {/* Floating leaf decorations */}
                <View className="absolute -top-2 -right-2">
                    <Ionicons name="leaf" size={24} color="#86EFAC" />
                </View>
                <View className="absolute -bottom-1 -left-3">
                    <Ionicons name="leaf-outline" size={20} color="#4ADE80" />
                </View>
            </View>
            <Text className="text-gray-800 font-bold text-xl text-center mb-2">{title}</Text>
            <Text className="text-gray-500 text-center text-base leading-6">{message}</Text>
        </View>
    );
};

const CouponScreen = () => {
    const [activeTab, setActiveTab] = useState<CouponTab>("available");
    const [couponsData, setCouponsData] = useState(MOCK_COUPONS);
    const { showToast } = useNotification();

    const handleClaimCoupon = (coupon: Coupon) => {
        // Move from available to myCoupons
        setCouponsData(prev => ({
            ...prev,
            available: prev.available.filter(c => c.id !== coupon.id),
            myCoupons: [...prev.myCoupons, coupon],
        }));
        showToast('success', 'Kupon Diklaim! 🎉', `${coupon.code} berhasil ditambahkan`);
    };

    const getCoupons = () => {
        switch (activeTab) {
            case "available":
                return couponsData.available;
            case "myCoupons":
                return couponsData.myCoupons;
            case "expired":
                return couponsData.expired;
        }
    };

    const coupons = getCoupons();

    return (
        <View className="flex-1 bg-gray-50">
            {/* Green Header */}
            <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    paddingTop: 50,
                    paddingBottom: 20,
                    paddingHorizontal: 24,
                }}
            >
                <View className="flex-row items-center mb-4">
                    <View className="bg-white/20 p-2 rounded-xl mr-3">
                        <Ionicons name="pricetag" size={24} color="#FFFFFF" />
                    </View>
                    <View>
                        <Text className="text-white text-2xl font-bold">Kupon & Promo</Text>
                        <Text className="text-white/70 text-sm">Hemat lebih banyak!</Text>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View className="flex-row bg-white/20 rounded-xl p-1">
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${activeTab === tab.key ? "bg-white" : ""
                                }`}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={16}
                                color={activeTab === tab.key ? "#16A34A" : "#FFFFFF"}
                            />
                            <Text
                                className={`ml-1 font-semibold text-sm ${activeTab === tab.key ? "text-green-600" : "text-white"
                                    }`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {coupons.length === 0 ? (
                    <EmptyState tab={activeTab} />
                ) : (
                    <View className="px-5 py-4">
                        {/* Results count */}
                        <View className="flex-row items-center mb-4">
                            <Text className="text-gray-600">
                                <Text className="font-bold text-gray-800">{coupons.length}</Text>{" "}
                                kupon {activeTab === "available" ? "tersedia" : ""}
                            </Text>
                        </View>

                        {coupons.map((coupon) => (
                            <CouponCard
                                key={coupon.id}
                                coupon={coupon}
                                isExpired={activeTab === "expired"}
                                onClaim={activeTab === "available" ? () => handleClaimCoupon(coupon) : undefined}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default CouponScreen;
