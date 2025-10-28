import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider, useUser } from "@/context/UserContext";
import { QuestProvider } from "@/context/QuestContext";
import { ActivityProvider } from "@/context/ActivityContext";
import { AICoachProvider } from "@/context/AICoachContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isOnboarded, isLoading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const onOnboardingScreen = segments[0] === 'onboarding';

    if (!isOnboarded && inAuthGroup) {
      router.replace('/onboarding');
    } else if (isOnboarded && onOnboardingScreen) {
      router.replace('/(tabs)');
    }
  }, [isOnboarded, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="quest-detail" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="quest-history" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="create-quest" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="ai-coach" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="community-challenges" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="joint-quests" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserProvider>
          <QuestProvider>
            <ActivityProvider>
              <AICoachProvider>
                <RootLayoutNav />
              </AICoachProvider>
            </ActivityProvider>
          </QuestProvider>
        </UserProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
