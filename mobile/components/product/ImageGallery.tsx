import { View, Image, ScrollView, Dimensions } from "react-native";
import { useState } from "react";

const { width } = Dimensions.get("window");

interface ImageGalleryProps {
    images: string[];
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    return (
        <View className="relative">
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setSelectedImageIndex(index);
                }}
                scrollEventThrottle={16}
            >
                {images.map((image, index) => (
                    <View key={index} style={{ width }}>
                        <Image
                            source={{ uri: image }}
                            style={{ width, height: 380 }}
                            resizeMode="cover"
                        />
                    </View>
                ))}
            </ScrollView>

            {/* Image Indicators */}
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                {images.map((_, index) => (
                    <View
                        key={index}
                        className={`h-2 rounded-full ${index === selectedImageIndex ? "bg-green-500 w-6" : "bg-gray-300 w-2"
                            }`}
                    />
                ))}
            </View>
        </View>
    );
};

export default ImageGallery;
