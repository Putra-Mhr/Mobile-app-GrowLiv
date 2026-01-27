import { useState, useEffect } from "react";
import { treasuryApi } from "../lib/api";
import { useToast } from "../components/Toast";

const formatRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function TreasuryPage() {
    const toast = useToast();

    const [treasury, setTreasury] = useState(null);
    const [pendingPayouts, setPendingPayouts] = useState([]);
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [processingStore, setProcessingStore] = useState(null);
    const [payoutModal, setPayoutModal] = useState({ open: false, store: null, available: 0 });
    const [payoutAmount, setPayoutAmount] = useState("");
    const [payoutNotes, setPayoutNotes] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [treasuryRes, pendingRes, historyRes] = await Promise.all([
                treasuryApi.get(),
                treasuryApi.getPendingPayouts(),
                treasuryApi.getPayoutHistory(),
            ]);
            setTreasury(treasuryRes.treasury);
            setPendingPayouts(pendingRes.groupedByStore || []);
            setPayoutHistory(historyRes.payouts || []);
        } catch (error) {
            console.error("Error fetching treasury data:", error);
            toast.error("Gagal memuat data treasury");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleProcessPayout = async () => {
        if (!payoutModal.store) return;

        const amount = parseFloat(payoutAmount) || payoutModal.available;
        if (amount <= 0 || amount > payoutModal.available) {
            toast.warning("Jumlah tidak valid. Masukkan jumlah yang benar.");
            return;
        }

        // No need for confirm() - the payout modal itself serves as confirmation UI
        setProcessingStore(payoutModal.store._id);
        try {
            await treasuryApi.processPayout({
                storeId: payoutModal.store._id,
                amount,
                notes: payoutNotes,
            });
            toast.success(`Pencairan ${formatRupiah(amount)} ke ${payoutModal.store.name} berhasil!`);
            setPayoutModal({ open: false, store: null, available: 0 });
            setPayoutAmount("");
            setPayoutNotes("");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal memproses pencairan");
        } finally {
            setProcessingStore(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">💰 Platform Treasury</h1>
                <p className="text-gray-500">Kelola keuangan platform dan pencairan dana seller</p>
            </div>

            {/* Treasury Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="text-green-100 text-sm">Pendapatan Admin</div>
                    <div className="text-2xl font-bold mt-1">{formatRupiah(treasury?.adminFeeBalance)}</div>
                    <div className="text-green-200 text-xs mt-2">
                        Total: {formatRupiah(treasury?.totalAdminFeeEarned)}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="text-blue-100 text-sm">Saldo Ongkir</div>
                    <div className="text-2xl font-bold mt-1">{formatRupiah(treasury?.shippingBalance)}</div>
                    <div className="text-blue-200 text-xs mt-2">
                        Total: {formatRupiah(treasury?.totalShippingCollected)}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="text-orange-100 text-sm">Pending Seller Payout</div>
                    <div className="text-2xl font-bold mt-1">{formatRupiah(treasury?.sellerPendingBalance)}</div>
                    <div className="text-orange-200 text-xs mt-2">
                        Menunggu dicairkan ke seller
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="text-purple-100 text-sm">Total Dicairkan</div>
                    <div className="text-2xl font-bold mt-1">{formatRupiah(treasury?.totalSellerPayouts)}</div>
                    <div className="text-purple-200 text-xs mt-2">
                        {treasury?.totalOrdersProcessed || 0} order diproses
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                        <h3 className="font-semibold text-blue-900">Cara Kerja Treasury</h3>
                        <ul className="text-blue-700 text-sm mt-1 space-y-1">
                            <li>• Customer bayar → <strong>Semua uang masuk ke Treasury</strong></li>
                            <li>• <span className="text-green-600 font-medium">Pendapatan Admin</span> = Biaya admin (permanen, milik platform)</li>
                            <li>• <span className="text-blue-600 font-medium">Saldo Ongkir</span> = Untuk kurir (belum diimplementasi)</li>
                            <li>• <span className="text-orange-600 font-medium">Pending Seller</span> = Harga produk, siap dicairkan ke seller</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {[
                        { id: "overview", label: "📊 Pending Payout" },
                        { id: "history", label: "📜 Riwayat" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Pending Payout per Toko</h2>

                    {pendingPayouts.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <span className="text-4xl">✅</span>
                            <p className="text-gray-500 mt-2">Tidak ada pending payout</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pendingPayouts.map((item) => (
                                <div
                                    key={item.store._id}
                                    className="bg-white border rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                            {item.store.name?.charAt(0)?.toUpperCase() || "S"}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{item.store.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {item.payouts?.length || 0} order pending
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-orange-600">
                                                {formatRupiah(item.totalPending)}
                                            </div>
                                            <div className="text-xs text-gray-400">Siap dicairkan</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setPayoutModal({
                                                    open: true,
                                                    store: item.store,
                                                    available: item.totalPending,
                                                });
                                                setPayoutAmount(item.totalPending.toString());
                                            }}
                                            disabled={processingStore === item.store._id}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                                        >
                                            {processingStore === item.store._id ? "..." : "💸 Cairkan"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "history" && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Riwayat Pencairan</h2>

                    {payoutHistory.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <span className="text-4xl">📭</span>
                            <p className="text-gray-500 mt-2">Belum ada riwayat pencairan</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Toko</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Jumlah</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tanggal</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {payoutHistory.map((payout) => (
                                        <tr key={payout._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{payout.store?.name || "-"}</div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-green-600">
                                                {formatRupiah(payout.amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${payout.status === "completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : payout.status === "pending"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {payout.status === "completed" ? "✅ Selesai" : payout.status === "pending" ? "⏳ Pending" : "❌ Gagal"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {formatDate(payout.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {payout.notes || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Payout Modal */}
            {payoutModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">💸 Cairkan Dana</h3>

                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-500">Toko</div>
                                <div className="font-semibold text-lg">{payoutModal.store?.name}</div>
                            </div>

                            <div className="bg-orange-50 rounded-lg p-4">
                                <div className="text-sm text-orange-600">Tersedia untuk dicairkan</div>
                                <div className="font-bold text-2xl text-orange-700">
                                    {formatRupiah(payoutModal.available)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jumlah Pencairan
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        placeholder="Masukkan jumlah"
                                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                    <button
                                        onClick={() => setPayoutAmount(payoutModal.available.toString())}
                                        className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                                    >
                                        Semua
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catatan (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={payoutNotes}
                                    onChange={(e) => setPayoutNotes(e.target.value)}
                                    placeholder="No. Rekening, keterangan, dll"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <span>⚠️</span>
                                    <div className="text-sm text-yellow-700">
                                        Pastikan Anda sudah mentransfer dana secara manual ke rekening seller sebelum konfirmasi.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setPayoutModal({ open: false, store: null, available: 0 });
                                    setPayoutAmount("");
                                    setPayoutNotes("");
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleProcessPayout}
                                disabled={processingStore}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                            >
                                {processingStore ? "Memproses..." : "Konfirmasi Pencairan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
