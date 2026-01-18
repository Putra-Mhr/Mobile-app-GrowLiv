import { useSSO } from "@clerk/clerk-expo";
import { useState } from "react";
import { useNotification } from "@/context/NotificationContext";

function useSocialAuth() {
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const { startSSOFlow } = useSSO();
  const { showToast } = useNotification();

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setLoadingStrategy(strategy);

    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (error) {
      console.log("💥 Error in social auth:", error);
      const provider = strategy === "oauth_google" ? "Google" : "Apple";
      showToast('error', 'Sign In Failed', `Failed to sign in with ${provider}. Please try again.`);
    } finally {
      setLoadingStrategy(null);
    }
  };

  return { loadingStrategy, handleSocialAuth };
}

export default useSocialAuth;
