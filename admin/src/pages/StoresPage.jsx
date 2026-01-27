import { useState } from "react";
import { CheckCircleIcon, XCircleIcon, StoreIcon, SearchIcon, RefreshCwIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "../lib/api";
import { Link } from "react-router";

function StoresPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStore, setSelectedStore] = useState(null);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["admin-stores"],
        queryFn: storeApi.getAll,
    });

    const verifyMutation = useMutation({
        mutationFn: storeApi.verify,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
            setSelectedStore(null);
        },
    });

    const stores = data?.stores || [];

    const filteredStores = stores.filter((store) => {
        const matchesFilter =
            filter === "all" ||
            (filter === "pending" && !store.isVerified) ||
            (filter === "verified" && store.isVerified);

        const matchesSearch =
            store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            store.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const pendingCount = stores.filter((s) => !s.isVerified).length;
    const verifiedCount = stores.filter((s) => s.isVerified).length;

    const handleVerify = (storeId, isVerified) => {
        verifyMutation.mutate({ storeId, isVerified });
    };

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <span>Error: {error.message}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Manajemen Toko</h1>
                    <p className="text-sm text-gray-500">Verifikasi dan kelola toko seller</p>
                </div>
                <button className="btn btn-ghost btn-sm gap-2" onClick={() => refetch()}>
                    <RefreshCwIcon className="size-4" />
                    Refresh
                </button>
            </div>

            {/* Treasury Link Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">💰</span>
                        <div>
                            <h3 className="font-semibold text-green-800">Pencairan Dana Seller</h3>
                            <p className="text-sm text-green-600">Kelola payout ke seller melalui halaman Treasury</p>
                        </div>
                    </div>
                    <Link
                        to="/treasury"
                        className="btn btn-success btn-sm gap-2"
                    >
                        Buka Treasury →
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat bg-base-100 rounded-xl shadow">
                    <div className="stat-figure text-primary">
                        <StoreIcon className="size-8" />
                    </div>
                    <div className="stat-title">Total Toko</div>
                    <div className="stat-value text-primary">{stores.length}</div>
                </div>
                <div className="stat bg-base-100 rounded-xl shadow">
                    <div className="stat-figure text-warning">
                        <XCircleIcon className="size-8" />
                    </div>
                    <div className="stat-title">Menunggu Verifikasi</div>
                    <div className="stat-value text-warning">{pendingCount}</div>
                </div>
                <div className="stat bg-base-100 rounded-xl shadow">
                    <div className="stat-figure text-success">
                        <CheckCircleIcon className="size-8" />
                    </div>
                    <div className="stat-title">Terverifikasi</div>
                    <div className="stat-value text-success">{verifiedCount}</div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="join">
                    <button
                        className={`btn join-item ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setFilter("all")}
                    >
                        Semua ({stores.length})
                    </button>
                    <button
                        className={`btn join-item ${filter === "pending" ? "btn-warning" : "btn-ghost"}`}
                        onClick={() => setFilter("pending")}
                    >
                        Pending ({pendingCount})
                    </button>
                    <button
                        className={`btn join-item ${filter === "verified" ? "btn-success" : "btn-ghost"}`}
                        onClick={() => setFilter("verified")}
                    >
                        Verified ({verifiedCount})
                    </button>
                </div>
                <div className="flex-1">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama toko atau email..."
                            className="input input-bordered w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stores Table */}
            <div className="overflow-x-auto bg-base-100 rounded-xl shadow">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Toko</th>
                            <th>Pemilik</th>
                            <th>Status</th>
                            <th>Saldo Dicairkan</th>
                            <th>Total Penjualan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStores.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                    Tidak ada toko yang ditemukan
                                </td>
                            </tr>
                        ) : (
                            filteredStores.map((store) => (
                                <tr key={store._id} className="hover">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {store.imageUrl ? (
                                                <img
                                                    src={store.imageUrl}
                                                    alt={store.name}
                                                    className="size-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="size-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                                                    {store.name[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold">{store.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {store.address || "Alamat belum diisi"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {store.user?.imageUrl && (
                                                <img
                                                    src={store.user.imageUrl}
                                                    alt={store.user.name}
                                                    className="size-6 rounded-full"
                                                />
                                            )}
                                            <div>
                                                <div className="text-sm">{store.user?.name || "Unknown"}</div>
                                                <div className="text-xs text-gray-500">{store.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {store.isVerified ? (
                                            <span className="badge badge-success gap-1">
                                                <CheckCircleIcon className="size-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="badge badge-warning gap-1">
                                                <XCircleIcon className="size-3" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="font-mono text-sm text-green-600">
                                            {formatRupiah(store.balance || 0)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="font-mono text-sm">
                                            {store.totalSales || 0} items
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => setSelectedStore(store)}
                                        >
                                            Detail
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Store Detail Modal */}
            {selectedStore && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <StoreIcon className="size-5" />
                            Detail Toko
                        </h3>

                        <div className="mt-4 space-y-4">
                            {/* Store Info */}
                            <div className="flex items-center gap-4">
                                {selectedStore.imageUrl ? (
                                    <img
                                        src={selectedStore.imageUrl}
                                        alt={selectedStore.name}
                                        className="size-20 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="size-20 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-3xl">
                                        {selectedStore.name[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-xl font-bold">{selectedStore.name}</h4>
                                    <p className="text-sm text-gray-500">{selectedStore.description || "Tidak ada deskripsi"}</p>
                                </div>
                            </div>

                            <div className="divider"></div>

                            {/* Owner Info */}
                            <div className="bg-base-200 p-4 rounded-lg">
                                <h5 className="font-semibold mb-2">Informasi Pemilik</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Nama:</div>
                                    <div className="font-medium">{selectedStore.user?.name}</div>
                                    <div>Email:</div>
                                    <div className="font-medium">{selectedStore.user?.email}</div>
                                </div>
                            </div>

                            {/* Store Stats */}
                            <div className="bg-base-200 p-4 rounded-lg">
                                <h5 className="font-semibold mb-2">Statistik Toko</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Total Penjualan:</div>
                                    <div className="font-medium">{selectedStore.totalSales || 0} items</div>
                                    <div>Saldo Dicairkan:</div>
                                    <div className="font-medium text-green-600">{formatRupiah(selectedStore.balance || 0)}</div>
                                    <div>Total Revenue:</div>
                                    <div className="font-medium">{formatRupiah(selectedStore.totalRevenue || 0)}</div>
                                </div>
                            </div>

                            {/* Payout Info */}
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">💡</span>
                                    <div>
                                        <h5 className="font-semibold text-green-800">Pencairan Dana</h5>
                                        <p className="text-sm text-green-700 mt-1">
                                            Untuk mencairkan dana ke seller, gunakan halaman <strong>Treasury</strong>.
                                            Di sana Anda bisa melihat pending payout dari order yang sudah dibayar.
                                        </p>
                                        <Link
                                            to="/treasury"
                                            className="btn btn-success btn-sm mt-2"
                                        >
                                            Buka Treasury
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Status */}
                            <div className="bg-base-200 p-4 rounded-lg">
                                <h5 className="font-semibold mb-2">Status Verifikasi</h5>
                                <div className="flex items-center justify-between">
                                    <div>
                                        {selectedStore.isVerified ? (
                                            <span className="badge badge-success badge-lg gap-2">
                                                <CheckCircleIcon className="size-4" /> Terverifikasi
                                            </span>
                                        ) : (
                                            <span className="badge badge-warning badge-lg gap-2">
                                                <XCircleIcon className="size-4" /> Menunggu Verifikasi
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className={`btn btn-sm ${selectedStore.isVerified ? "btn-error" : "btn-success"}`}
                                        onClick={() => handleVerify(selectedStore._id, !selectedStore.isVerified)}
                                        disabled={verifyMutation.isPending}
                                    >
                                        {verifyMutation.isPending
                                            ? "Loading..."
                                            : selectedStore.isVerified
                                                ? "Cabut Verifikasi"
                                                : "Verifikasi Toko"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button className="btn" onClick={() => setSelectedStore(null)}>
                                Tutup
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setSelectedStore(null)}></div>
                </div>
            )}
        </div>
    );
}

export default StoresPage;
