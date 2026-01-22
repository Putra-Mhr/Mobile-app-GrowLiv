import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export const PageBackground = () => {
    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {/* Base Background */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#F9FAFB" }]} />

            {/* Top Left - Green/Teal Tint */}
            <View
                style={{
                    position: "absolute",
                    top: -100,
                    left: -100,
                    width: width * 0.8,
                    height: width * 0.8,
                    borderRadius: width * 0.4,
                    backgroundColor: "#DCFCE7", 
                    opacity: 0.6,
                    transform: [{ scale: 1.2 }],
                }}
            />
            <View
                style={{
                    position: "absolute",
                    top: -50,
                    left: -50,
                    width: width * 0.6,
                    height: width * 0.6,
                    borderRadius: width * 0.3,
                    backgroundColor: "#CCFBF1", 
                    opacity: 0.5,
                    transform: [{ scale: 1.5 }],
                }}
            />

            <View
                style={{
                    position: "absolute",
                    top: height * 0.2,
                    right: -100,
                    width: width * 0.8,
                    height: width * 0.8,
                    borderRadius: width * 0.4,
                    backgroundColor: "#FEF3C7", 
                    opacity: 0.4,
                }}
            />

            <View
                style={{
                    position: "absolute",
                    bottom: -100,
                    left: -50,
                    width: width * 0.9,
                    height: width * 0.9,
                    borderRadius: width * 0.45,
                    backgroundColor: "#DBEAFE", 
                    opacity: 0.4,
                }}
            />

            {/* Overlay Mesh Pattern (Optional, using simple repeating dots or lines if needed, keeping it clean for now) */}

            {/* Soft White Gradient Overlay to blend everything */}
            <LinearGradient
                colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.7)"]}
                style={StyleSheet.absoluteFillObject}
            />
        </View>
    );
};