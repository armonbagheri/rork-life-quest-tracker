import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, Stack } from 'expo-router';
import {
  Shield,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react-native';
import { useRecovery } from '@/context/RecoveryContext';
import { RecoveryLog } from '@/types';
import { CATEGORY_DATA } from '@/constants/categories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecoveryActivityScreen() {
  const insets = useSafeAreaInsets();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { recoveryItems } = useRecovery();

  const item = recoveryItems.find((i) => i.id === itemId);

  if (!item) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Activity',
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerBackTitle: 'Back',
            headerShown: true,
          }}
        />
        <View style={styles.container}>
          <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.background}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Recovery item not found</Text>
            </View>
          </LinearGradient>
        </View>
      </>
    );
  }

  const sortedLogs = [...item.logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const groupLogsByMonth = (logs: RecoveryLog[]) => {
    const grouped: Record<string, RecoveryLog[]> = {};
    
    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(log);
    });

    return grouped;
  };

  const groupedLogs = groupLogsByMonth(sortedLogs);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderLog = (log: RecoveryLog) => {
    const isSuccess = log.type === 'success';

    return (
      <View key={log.id} style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.logHeaderLeft}>
            <View
              style={[
                styles.logIconContainer,
                { backgroundColor: isSuccess ? '#4ECDC4' : '#ff4757' },
              ]}
            >
              {isSuccess ? (
                <Calendar size={18} color="#fff" />
              ) : (
                <AlertCircle size={18} color="#fff" />
              )}
            </View>
            <View style={styles.logInfo}>
              <Text style={styles.logType}>
                {isSuccess ? 'Day Logged' : 'Relapse'}
              </Text>
              <Text style={styles.logDate}>{formatDate(log.timestamp)}</Text>
            </View>
          </View>
        </View>
        {log.note && (
          <View style={styles.logNoteContainer}>
            <Text style={styles.logNote}>{log.note}</Text>
          </View>
        )}
      </View>
    );
  };

  const recoveryColor = CATEGORY_DATA.recovery.color;

  return (
    <>
      <Stack.Screen
        options={{
          title: item.name,
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitle: 'Back',
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.background}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={[styles.summaryIconContainer, { backgroundColor: recoveryColor }]}>
                  <Shield size={24} color="#fff" />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryTitle}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.summaryDescription}>{item.description}</Text>
                  )}
                </View>
              </View>

              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <TrendingUp size={16} color="#4ECDC4" />
                  <Text style={styles.summaryStatLabel}>Total Logs</Text>
                  <Text style={styles.summaryStatValue}>{item.logs.length}</Text>
                </View>
                <View style={styles.summaryStatItem}>
                  <Calendar size={16} color="#4ECDC4" />
                  <Text style={styles.summaryStatLabel}>Success Days</Text>
                  <Text style={styles.summaryStatValue}>
                    {item.logs.filter((l) => l.type === 'success').length}
                  </Text>
                </View>
                <View style={styles.summaryStatItem}>
                  <AlertCircle size={16} color="#ff4757" />
                  <Text style={styles.summaryStatLabel}>Relapses</Text>
                  <Text style={styles.summaryStatValue}>{item.relapseCount}</Text>
                </View>
              </View>
            </View>

            {sortedLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#ffffff40" />
                <Text style={styles.emptyStateTitle}>No Activity Yet</Text>
                <Text style={styles.emptyStateText}>
                  Start logging your recovery journey to track your progress
                </Text>
              </View>
            ) : (
              <>
                {Object.entries(groupedLogs).map(([month, logs]) => (
                  <View key={month} style={styles.monthSection}>
                    <Text style={styles.monthTitle}>{month}</Text>
                    {logs.map(renderLog)}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff99',
  },
  summaryCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  summaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 14,
    color: '#ffffff99',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryStatItem: {
    flex: 1,
    backgroundColor: '#ffffff08',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: '#ffffff99',
    textAlign: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  logCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logType: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 13,
    color: '#ffffff99',
  },
  logNoteContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
  },
  logNote: {
    fontSize: 14,
    color: '#ffffff99',
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#ffffff99',
    textAlign: 'center',
  },
});
