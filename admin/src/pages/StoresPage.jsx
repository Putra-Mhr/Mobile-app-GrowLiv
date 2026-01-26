import { useState } from "react";
import { CheckCircleIcon, XCircleIcon, StoreIcon, SearchIcon, RefreshCwIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "../lib/api";

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <span>Error loading stores: {error.message}</span>
                <button className="btn btn-sm" onClick={() => refetch()}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="stats shadow w-full">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <StoreIcon className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Total Toko</div>
                    <div className="stat-value text-primary">{stores.length}</div>
                </div>
                <div className="stat">
                    <div className="stat-figure text-warning">
                        <XCircleIcon className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Menunggu Verifikasi</div>
                    <div className="stat-value text-warning">{pendingCount}</div>
                </div>
                <div className="stat">
                    <div className="stat-figure text-success">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <div className="stat-title">Terverifikasi</div>
                    <div className="stat-value text-success">{verifiedCount}</div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="join">
                    <button
                        className={`join-item btn ${filter === "all" ? "btn-active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        Semua ({stores.length})
                    </button>
                    <button
                        className={`join-item btn ${filter === "pending" ? "btn-active btn-warning" : ""}`}
                        onClick={() => setFilter("pending")}
                    >
                        Pending ({pendingCount})
                    </button>
                    <button
                        className={`join-item btn ${filter === "verified" ? "btn-active btn-success" : ""}`}
                        onClick={() => setFilter("verified")}
                    >
                        Verified ({verifiedCount})
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="form-control">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Cari toko..."
                                className="input input-bordered"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button className="btn btn-ghost" onClick={() => refetch()}>
                        <RefreshCwIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stores Table */}
            <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                <table className="table table-zebra">
                    <thead>
                        <tr>
                            <th>Toko</th>
                            <th>Pemilik</th>
                            <th>Lokasi</th>
                            <th>Produk</th>
                            <th>Saldo</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStores.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500">
                                    Tidak ada toko ditemukan
                                </td>
                            </tr>
                        ) : (
                            filteredStores.map((store) => (
                                <tr key={store._id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar">
                                                <div className="mask mask-squircle w-12 h-12 bg-gray-200 flex items-center justify-center">
                                                    {store.imageUrl ? (
                                                        <img src={store.imageUrl} alt={store.name} />
                                                    ) : (
                                                        <StoreIcon className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-bold">{store.name}</div>
                                                <div className="text-sm opacity-50">
                                                    {new Date(store.createdAt).toLocaleDateString("id-ID")}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-medium">{store.user?.name || "-"}</div>
                                        <div className="text-xs opacity-50">{store.user?.email || "-"}</div>
                                    </td>
                                    <td>{store.pickupAddress?.city || "-"}</td>
                                    <td>{store.totalProducts || 0}</td>
                                    <td>
                                        <span className="font-mono">
                                            Rp {(store.balance || 0).toLocaleString("id-ID")}
                                        </span>
                                    </td>
                                    <td>
                                        {store.isVerified ? (
                                            <div className="badge badge-success gap-1">
                                                <CheckCircleIcon className="w-3 h-3" />
                                                Verified
                                            </div>
                                        ) : (
                                            <div className="badge badge-warning gap-1">
                                                <XCircleIcon className="w-3 h-3" />
                                                Pending
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-ghost"
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
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Detail Toko</h3>

                        <div className="space-y-4">
                            {/* Store Info */}
                            <div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
                                <div className="avatar">
                                    <div className="w-20 rounded-full bg-gray-300 flex items-center justify-center">
                                        {selectedStore.imageUrl ? (
                                            <img src={selectedStore.imageUrl} alt={selectedStore.name} />
                                        ) : (
                                            <StoreIcon className="w-10 h-10 text-gray-500" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold">{selectedStore.name}</h4>
                                    <p className="text-sm opacity-70">{selectedStore.pickupAddress?.city}</p>
                                    <div className="mt-2">
                                        {selectedStore.isVerified ? (
                                            <div className="badge badge-success">Terverifikasi</div>
                                        ) : (
                                            <div className="badge badge-warning">Menunggu Verifikasi</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className="p-4 bg-base-200 rounded-lg">
                                <h5 className="font-semibold mb-2">Pemilik Toko</h5>
                                <div className="flex items-center gap-3">
                                    {selectedStore.user?.imageUrl && (
                                        <div className="avatar">
                                            <div className="w-10 rounded-full">
                                                <img src={selectedStore.user.imageUrl} alt={selectedStore.user.name} />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{selectedStore.user?.name || "-"}</p>
                                        <p className="text-sm opacity-70">{selectedStore.user?.email || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="stat bg-base-200 rounded-lg p-4">
                                    <div className="stat-title">Produk</div>
                                    <div className="stat-value text-lg">{selectedStore.totalProducts || 0}</div>
                                </div>
                                <div className="stat bg-base-200 rounded-lg p-4">
                                    <div className="stat-title">Terjual</div>
                                    <div className="stat-value text-lg">{selectedStore.totalSales || 0}</div>
                                </div>
                                <div className="stat bg-base-200 rounded-lg p-4">
                                    <div className="stat-title">Saldo</div>
                                    <div className="stat-value text-lg text-success">
                                        Rp {((selectedStore.balance || 0) / 1000).toFixed(0)}K
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedStore.description && (
                                <div className="p-4 bg-base-200 rounded-lg">
                                    <h5 className="font-semibold mb-2">Deskripsi</h5>
                                    <p className="text-sm">{selectedStore.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-action">
                            <button className="btn" onClick={() => setSelectedStore(null)}>
                                Tutup
                            </button>
                            {selectedStore.isVerified ? (
                                <button
                                    className="btn btn-error"
                                    onClick={() => handleVerify(selectedStore._id, false)}
                                    disabled={verifyMutation.isPending}
                                >
                                    {verifyMutation.isPending ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <>
                                            <XCircleIcon className="w-4 h-4" />
                                            Cabut Verifikasi
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    className="btn btn-success"
                                    onClick={() => handleVerify(selectedStore._id, true)}
                                    disabled={verifyMutation.isPending}
                                >
                                    {verifyMutation.isPending ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-4 h-4" />
                                            Verifikasi Toko
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => setSelectedStore(null)}>close</button>
                    </form>
                </dialog>
            )}
        </div>
    );
}

export default StoresPage;
