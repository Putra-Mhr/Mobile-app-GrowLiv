import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Review, ReviewUser } from "@/types";

interface ReviewListProps {
    reviews: Review[];
}

const RenderStars = ({ rating, size = 16 }: { rating: number; size?: number }) => {
    return (
        <View className="flex-row">
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={star <= rating ? "star" : star - 0.5 <= rating ? "star-half" : "star-outline"}
                    size={size}
                    color="#F59E0B"
                />
            ))}
        </View>
    );
};

const ReviewCard = ({ review }: { review: Review }) => {
    const user = typeof review.userId === "object" ? (review.userId as ReviewUser) : null;
    const date = new Date(review.createdAt).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return (
        <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
            <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3 overflow-hidden">
                    {user?.imageUrl ? (
                        <Image
                            source={{ uri: user.imageUrl }}
                            style={{ width: 40, height: 40 }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="person" size={20} color="#22C55E" />
                    )}
                </View>
                <View className="flex-1">
                    <Text className="text-gray-800 font-bold">{user?.name || "Pengguna"}</Text>
                    <Text className="text-gray-400 text-xs">{date}</Text>
                </View>
                <RenderStars rating={review.rating} size={14} />
            </View>
            {review.comment && <Text className="text-gray-600 leading-5">{review.comment}</Text>}
        </View>
    );
};

const ReviewList = ({ reviews }: ReviewListProps) => {
    return (
        <View className="bg-white px-6 pb-6">
            {reviews.length > 0 && (
                <View>
                    <Text className="text-gray-800 text-lg font-bold mb-4">
                        Review dari Pengguna ({reviews.length})
                    </Text>
                    {reviews.map((review) => (
                        <ReviewCard key={review._id} review={review} />
                    ))}
                </View>
            )}

            {reviews.length === 0 && (
                <View className="items-center py-8">
                    <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                    <Text className="text-gray-400 mt-2">Belum ada review</Text>
                    <Text className="text-gray-400 text-sm">Jadilah yang pertama memberikan review!</Text>
                </View>
            )}
        </View>
    );
};

export default ReviewList;
