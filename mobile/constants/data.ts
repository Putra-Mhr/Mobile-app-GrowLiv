export const CATEGORIES = [
    { name: "All", label: "Semua", icon: "grid", color: "#22C55E", bgColor: "#DCFCE7" },
    { name: "Sayuran", label: "Sayuran", icon: "leaf", color: "#16A34A", bgColor: "#DCFCE7" },
    { name: "Buah", label: "Buah", icon: "nutrition", color: "#EF4444", bgColor: "#FEE2E2" },
    { name: "Herbal", label: "Herbal", icon: "flower", color: "#06B6D4", bgColor: "#CFFAFE" },
    { name: "Rempah", label: "Rempah", icon: "flask", color: "#D97706", bgColor: "#FEF3C7" },
    { name: "Produk Hewani", label: "Hewani", icon: "egg", color: "#F59E0B", bgColor: "#FFF7ED" },
    { name: "Perikanan", label: "Perikanan", icon: "fish", color: "#3B82F6", bgColor: "#DBEAFE" },
    { name: "Produk Olahan", label: "Olahan", icon: "basket", color: "#8B5CF6", bgColor: "#EDE9FE" },
];

export const BANNERS = [
    {
        id: 1,
        title: "Panen Hari Ini",
        subtitle: "Segar langsung dari kebun petani lokal!",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
        colors: ["rgba(34, 197, 94, 0.85)", "rgba(21, 128, 61, 0.9)"] as [string, string],
        category: "Sayuran",
    },
    {
        id: 2,
        title: "Buah Segar",
        subtitle: "Vitamin alami untuk kesehatan keluarga",
        image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80",
        colors: ["rgba(249, 115, 22, 0.85)", "rgba(234, 88, 12, 0.9)"] as [string, string],
        category: "Buah",
    },
    {
        id: 3,
        title: "Herbal Alami",
        subtitle: "Jaga kesehatan dengan tanaman herbal",
        image: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=800&q=80",
        colors: ["rgba(6, 182, 212, 0.85)", "rgba(8, 145, 178, 0.9)"] as [string, string],
        category: "Herbal",
    },
    {
        id: 4,
        title: "Rempah Pilihan",
        subtitle: "Bumbu dapur berkualitas tinggi",
        image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80",
        colors: ["rgba(217, 119, 6, 0.85)", "rgba(180, 83, 9, 0.9)"] as [string, string],
        category: "Rempah",
    },
];
