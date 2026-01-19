import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Coupon {
    id: string;
    code: string;
    title: string;
    description: string;
    discount: string;
    discountValue: number; // actual value for calculation
    discountType: 'percentage' | 'fixed';
    minPurchase: number;
    expiryDate: string;
    isUsed?: boolean;
}

interface CouponContextType {
    appliedCoupon: Coupon | null;
    applyCoupon: (coupon: Coupon) => void;
    removeCoupon: () => void;
    calculateDiscount: (subtotal: number) => number;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export function CouponProvider({ children }: { children: ReactNode }) {
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

    const applyCoupon = useCallback((coupon: Coupon) => {
        setAppliedCoupon(coupon);
    }, []);

    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null);
    }, []);

    const calculateDiscount = useCallback((subtotal: number): number => {
        if (!appliedCoupon) return 0;

        // Check minimum purchase requirement
        if (subtotal < appliedCoupon.minPurchase) return 0;

        if (appliedCoupon.discountType === 'percentage') {
            return (subtotal * appliedCoupon.discountValue) / 100;
        } else {
            return appliedCoupon.discountValue;
        }
    }, [appliedCoupon]);

    return (
        <CouponContext.Provider value={{ appliedCoupon, applyCoupon, removeCoupon, calculateDiscount }}>
            {children}
        </CouponContext.Provider>
    );
}

// Default values when used outside of CouponProvider
const defaultCouponContext: CouponContextType = {
    appliedCoupon: null,
    applyCoupon: () => { },
    removeCoupon: () => { },
    calculateDiscount: () => 0,
};

export function useCoupon() {
    const context = useContext(CouponContext);
    // Return default context if not within provider (safer, doesn't crash)
    return context ?? defaultCouponContext;
}

