import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";

const { width } = Dimensions.get("window");

interface Banner {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    colors: [string, string];
    category: string;
}

interface BannerCarouselProps {
    banners: Banner[];
    onSelectCategory: (category: string) => void;
}

const BannerCarousel = ({ banners, onSelectCategory }: BannerCarouselProps) => {
    const [currentBanner, setCurrentBanner] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    // Auto-scroll carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBanner((prev) => {
                const next = (prev + 1) % banners.length;
                scrollRef.current?.scrollTo({ x: next * width, animated: true });
                return next;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [banners.length]);

    return (
        <View style={{ marginTop: 16, paddingBottom: 8 }}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentBanner(index);
                }}
                scrollEventThrottle={16}
                decelerationRate="fast"
            >
                {banners.map((banner) => (
                    <TouchableOpacity
                        key={banner.id}
                        activeOpacity={0.95}
                        onPress={() => onSelectCategory(banner.category)}
                        style={{ width: width, paddingHorizontal: 20 }}
                    >
                        <View style={{ height: 180, borderRadius: 20, overflow: "hidden" }}>
                            {/* Background Image */}
                            <Image
                                source={{ uri: banner.image }}
                                style={{ position: "absolute", width: "100%", height: "100%" }}
                                resizeMode="cover"
                            />
                            {/* Gradient Overlay */}
                            <LinearGradient
                                colors={banner.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ flex: 1, padding: 20, justifyContent: "flex-end" }}
                            >
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name="leaf" size={14} color="rgba(255,255,255,0.9)" />
                                    <Text className="text-white/90 text-xs ml-1 uppercase tracking-wider font-medium">
                                        Promo Spesial
                                    </Text>
                                </View>
                                <Text className="text-white text-2xl font-bold mb-1">
                                    {banner.title}
                                </Text>
                                <Text className="text-white/90 text-sm mb-3">
                                    {banner.subtitle}
                                </Text>
                                <View className="flex-row items-center">
                                    <View className="bg-white/25 px-4 py-2 rounded-full flex-row items-center">
                                        <Text className="text-white font-semibold">Belanja Sekarang</Text>
                                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Carousel Indicators */}
            <View className="flex-row justify-center mt-3 gap-2">
                {banners.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => {
                            scrollRef.current?.scrollTo({ x: index * width, animated: true });
                            setCurrentBanner(index);
                        }}
                    >
                        <View
                            className={`h-2 rounded-full ${index === currentBanner ? "bg-green-500 w-6" : "bg-gray-300 w-2"
                                }`}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default BannerCarousel;
