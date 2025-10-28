import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>404</Text>
          <Text style={styles.subtitle}>This screen doesn&apos;t exist</Text>
          <Link href="/(tabs)" style={styles.link}>
            <Text style={styles.linkText}>Go back home</Text>
          </Link>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: '#ffffff99',
    marginBottom: 32,
    textAlign: 'center' as const,
  },
  link: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
