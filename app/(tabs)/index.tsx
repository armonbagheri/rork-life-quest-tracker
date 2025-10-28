import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Zap, TrendingUp, Heart, DollarSign, Users, Target, Brain, Shield, Sparkles, Trophy, Calendar, BookOpen, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/context/UserContext';
import { useQuests } from '@/context/QuestContext';
import { CATEGORY_DATA, calculateProgress, calculateXPForNextLevel } from '@/constants/categories';
import { Quest, CategoryType } from '@/types';

import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, enabledCategories } = useUser();
  const { quests: allQuests } = useQuests();
  
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [showXPCalendar, setShowXPCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  
  const activeQuests = useMemo(() => {
    return allQuests.filter((q: Quest) => q.status === 'active');
  }, [allQuests]);

  const getWeekDays = (weekOffset: number) => {
    const days = [];
    const today = new Date();
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - (weekOffset * 7));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayHistory = user.dayHistory?.[dateString];
      const dayOfWeek = date.getDay();
      const dayNumber = date.getDate();
      
      days.push({
        date: dateString,
        label: dayLabels[dayOfWeek],
        dayNumber,
        xp: dayHistory?.xpEarned || 0,
        dayHistory: dayHistory,
      });
    }
    
    return days;
  };

  const weekDays = useMemo(() => getWeekDays(selectedWeekOffset), [selectedWeekOffset, user.dayHistory]);
  
  const isCurrentWeek = selectedWeekOffset === 0;
  const canGoForward = selectedWeekOffset > 0;

  const getWeekLabel = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - (weekOffset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  };

  const availableWeeks = useMemo(() => {
    const weeks = [];
    const maxWeeks = 12;
    for (let i = 0; i < maxWeeks; i++) {
      weeks.push({
        offset: i,
        label: getWeekLabel(i),
        isCurrentWeek: i === 0,
      });
    }
    return weeks;
  }, []);
  
  console.log('[HomeScreen] Active quests count:', activeQuests.length);
  console.log('[HomeScreen] Active quests:', activeQuests.map(q => ({ id: q.id, title: q.title, status: q.status, type: q.type })));
  
  const todayXP = user.todayXP || 0;

  const progress = calculateProgress(user.totalXP);
  const xpForNext = calculateXPForNextLevel(user.totalXP);

  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        day,
        dateString,
        history: user.dayHistory?.[dateString] || null,
      });
    }
    
    return days;
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const calendarWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.username}>{user.username}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LVL {user.level}</Text>
            </View>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <View style={styles.xpInfo}>
                <Zap size={24} color="#FFD700" fill="#FFD700" />
                <Text style={styles.xpTitle}>Total XP</Text>
              </View>
              <Text style={styles.xpValue}>{user.totalXP.toLocaleString()}</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {xpForNext} XP to level {user.level + 1}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.streakCard}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowStreakCalendar(true);
              }}
            >
              <Flame size={20} color="#FF6B6B" />
              <Text style={styles.statValue}>{user.streakCount}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.xpChartCard}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowXPCalendar(true);
              }}
              activeOpacity={0.9}
            >
              <View style={styles.xpChartTitleRow}>
                <TrendingUp size={20} color="#4ECDC4" />
                <Text style={styles.xpChartTitle}>Today&apos;s XP</Text>
              </View>
              <Text style={styles.xpChartValue}>{todayXP} XP</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/weekly-summary');
              }}
            >
              <Calendar size={20} color="#4ECDC4" />
              <Text style={styles.actionButtonText}>Weekly Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/growth-journal');
              }}
            >
              <BookOpen size={20} color="#FF6B6B" />
              <Text style={styles.actionButtonText}>Journal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/ai-coach');
              }}
            >
              <Sparkles size={20} color="#FFD700" />
              <Text style={styles.actionButtonText}>AI Coach</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/community-challenges');
              }}
            >
              <Trophy size={20} color="#667eea" />
              <Text style={styles.actionButtonText}>Challenges</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {enabledCategories.map(categoryId => {
                const category = CATEGORY_DATA[categoryId];
                const categoryData = user.categories[categoryId];
                const categoryProgress = calculateProgress(categoryData.xp);

                const IconComponent = 
                  categoryId === 'health' ? Heart :
                  categoryId === 'wealth' ? DollarSign :
                  categoryId === 'social' ? Users :
                  categoryId === 'discipline' ? Target :
                  categoryId === 'mental' ? Brain :
                  Shield;

                return (
                  <TouchableOpacity
                    key={categoryId}
                    style={styles.categoryCard}
                    onPress={() => router.push(`/quest-history?categoryId=${categoryId}`)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.categoryIconLarge,
                        { backgroundColor: category.color },
                      ]}
                    >
                      <IconComponent size={28} color="#fff" />
                    </View>
                    <Text style={styles.categoryCardName}>{category.name}</Text>
                    <View style={styles.categoryLevel}>
                      <Text style={styles.categoryLevelText}>Level {categoryData.level}</Text>
                    </View>
                    <View style={styles.miniProgressBar}>
                      <View
                        style={[
                          styles.miniProgressFill,
                          {
                            width: `${categoryProgress * 100}%`,
                            backgroundColor: category.color,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Quests</Text>
            {activeQuests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No active quests</Text>
                <Text style={styles.emptyStateSubtext}>
                  Go to Quests tab to start new quests
                </Text>
              </View>
            ) : (
              activeQuests.map((quest: Quest) => {
                const category = CATEGORY_DATA[quest.category];
                const isCompleted = quest.status === 'completed';

                const QuestIconComponent = 
                  quest.category === 'health' ? Heart :
                  quest.category === 'wealth' ? DollarSign :
                  quest.category === 'social' ? Users :
                  quest.category === 'discipline' ? Target :
                  quest.category === 'mental' ? Brain :
                  Shield;

                return (
                  <TouchableOpacity
                    key={quest.id}
                    style={[
                      styles.questCard,
                      isCompleted && styles.questCardCompleted,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push({
                        pathname: '/quest-detail' as any,
                        params: { questId: quest.id },
                      });
                    }}
                    disabled={isCompleted}
                    activeOpacity={0.7}
                  >
                    <View style={styles.questLeft}>
                      <View
                        style={[
                          styles.questIcon,
                          { backgroundColor: category.color },
                        ]}
                      >
                        <QuestIconComponent size={20} color="#fff" />
                      </View>
                      <View style={styles.questInfo}>
                        <Text
                          style={[
                            styles.questTitle,
                            isCompleted && styles.questTitleCompleted,
                          ]}
                        >
                          {quest.title}
                        </Text>
                        <Text style={styles.questCategory}>{category.name}</Text>
                      </View>
                    </View>
                    <View style={styles.questRight}>
                      <View style={styles.questXP}>
                        <Zap size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.questXPText}>{quest.xpValue}</Text>
                      </View>
                      {isCompleted && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showStreakCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStreakCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <View style={styles.calendarHeaderTop}>
                <Text style={styles.calendarTitle}>Login Streak History</Text>
                <TouchableOpacity onPress={() => setShowStreakCalendar(false)}>
                  <X size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.monthSelector}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
                  <ChevronLeft size={24} color="#667eea" />
                </TouchableOpacity>
                <Text style={styles.monthText}>
                  {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
                  <ChevronRight size={24} color="#667eea" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.calendarContent}>
              <View style={styles.weekDaysRow}>
                {calendarWeekDays.map(day => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              <View style={styles.daysGrid}>
                {generateCalendarDays().map((dayInfo, index) => (
                  <View key={index} style={styles.dayCell}>
                    {dayInfo && (
                      <View style={[
                        styles.dayContent,
                        dayInfo.history?.loggedIn && styles.dayLoggedIn,
                        dayInfo.dateString === new Date().toISOString().split('T')[0] && styles.dayToday,
                      ]}>
                        <Text style={[
                          styles.dayNumber,
                          dayInfo.history?.loggedIn && styles.dayNumberActive,
                        ]}>
                          {dayInfo.day}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.calendarLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
                  <Text style={styles.legendText}>Logged In</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FFD700', borderWidth: 2, borderColor: '#FF6B6B' }]} />
                  <Text style={styles.legendText}>Today</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showXPCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowXPCalendar(false)}
      >
        <View style={styles.xpModalOverlay}>
          <View style={styles.xpModalContent}>
            <View style={styles.xpModalHeader}>
              <View>
                <Text style={styles.xpModalTitle}>XP History</Text>
                <Text style={styles.xpModalSubtitle}>
                  {isCurrentWeek ? 'This week' : `${weekDays[0].dayNumber} - ${weekDays[6].dayNumber}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowXPCalendar(false);
                setSelectedDay(null);
                setSelectedWeekOffset(0);
              }}>
                <X size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.weekSelector}
              onPress={() => {
                setShowWeekSelector(true);
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.weekSelectorContent}>
                <Text style={styles.weekSelectorLabel}>
                  {isCurrentWeek ? 'This Week' : getWeekLabel(selectedWeekOffset)}
                </Text>
                <ChevronDown size={20} color="#4ECDC4" />
              </View>
            </TouchableOpacity>

            <View style={styles.xpModalStats}>
              <View style={styles.xpStatBox}>
                <Text style={styles.xpStatLabel}>Week Total</Text>
                <Text style={styles.xpStatValue}>
                  {weekDays.reduce((sum, d) => sum + d.xp, 0)} XP
                </Text>
              </View>
              <View style={styles.xpStatDivider} />
              <View style={styles.xpStatBox}>
                <Text style={styles.xpStatLabel}>Daily Avg</Text>
                <Text style={styles.xpStatValue}>
                  {Math.round(weekDays.reduce((sum, d) => sum + d.xp, 0) / 7)} XP
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.xpChartScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.screenTimeChart}>
                {weekDays.map((day, index) => {
                  const maxXP = Math.max(...weekDays.map(d => d.xp), 1);
                  const heightPercent = day.xp > 0 ? (day.xp / maxXP) * 100 : 2;
                  const todayString = new Date().toISOString().split('T')[0];
                  const isToday = day.date === todayString;
                  const isSelected = selectedDay === day.date;
                  
                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={styles.screenTimeBarContainer}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setSelectedDay(day.date === selectedDay ? null : day.date);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.screenTimeBarWrapper}>
                        <View 
                          style={[
                            styles.screenTimeBar,
                            { 
                              height: `${heightPercent}%`,
                              backgroundColor: isSelected ? '#FFD700' : isToday ? '#4ECDC4' : '#667eea',
                            }
                          ]}
                        >
                          {day.xp > 0 && (
                            <Text style={styles.screenTimeBarText}>{day.xp}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.screenTimeLabelContainer}>
                        <Text style={[styles.screenTimeDayLabel, (isToday || isSelected) && styles.screenTimeDayLabelToday]}>
                          {day.label}
                        </Text>
                        <Text style={[styles.screenTimeDateLabel, (isToday || isSelected) && styles.screenTimeDateLabelToday]}>
                          {day.dayNumber}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedDay && (
                <View style={styles.categoryBreakdown}>
                  <Text style={styles.categoryBreakdownTitle}>Category Breakdown</Text>
                  <Text style={styles.categoryBreakdownDate}>
                    {new Date(selectedDay).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  {enabledCategories.map(categoryId => {
                    const category = CATEGORY_DATA[categoryId];
                    const dayHistory = user.dayHistory?.[selectedDay];
                    const xp = dayHistory?.categoryXP?.[categoryId] || 0;

                    const IconComponent = 
                      categoryId === 'health' ? Heart :
                      categoryId === 'wealth' ? DollarSign :
                      categoryId === 'social' ? Users :
                      categoryId === 'discipline' ? Target :
                      categoryId === 'mental' ? Brain :
                      Shield;

                    return (
                      <View key={categoryId} style={styles.categoryBreakdownItem}>
                        <View style={styles.categoryBreakdownLeft}>
                          <View
                            style={[
                              styles.categoryBreakdownIcon,
                              { backgroundColor: category.color },
                            ]}
                          >
                            <IconComponent size={16} color="#fff" />
                          </View>
                          <Text style={styles.categoryBreakdownName}>{category.name}</Text>
                        </View>
                        <Text style={styles.categoryBreakdownXP}>{xp} XP</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWeekSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeekSelector(false)}
      >
        <TouchableOpacity
          style={styles.weekSelectorOverlay}
          activeOpacity={1}
          onPress={() => setShowWeekSelector(false)}
        >
          <View style={styles.weekSelectorModal}>
            <View style={styles.weekSelectorHeader}>
              <Text style={styles.weekSelectorTitle}>Select Week</Text>
              <TouchableOpacity onPress={() => setShowWeekSelector(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.weekSelectorList}
              showsVerticalScrollIndicator={false}
            >
              {availableWeeks.map((week) => (
                <TouchableOpacity
                  key={week.offset}
                  style={[
                    styles.weekSelectorItem,
                    selectedWeekOffset === week.offset && styles.weekSelectorItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedWeekOffset(week.offset);
                    setSelectedDay(null);
                    setShowWeekSelector(false);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.weekSelectorItemContent}>
                    <Text style={[
                      styles.weekSelectorItemText,
                      selectedWeekOffset === week.offset && styles.weekSelectorItemTextSelected,
                    ]}>
                      {week.label}
                    </Text>
                    {week.isCurrentWeek && (
                      <View style={styles.currentWeekBadge}>
                        <Text style={styles.currentWeekBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>
                  {selectedWeekOffset === week.offset && (
                    <View style={styles.weekSelectorCheckmark}>
                      <Text style={styles.weekSelectorCheckmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#ffffff99',
    marginBottom: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
  },
  levelBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  xpCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  xpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  xpValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#ffffff20',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#ffffff99',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  xpChartCard: {
    flex: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  xpChartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  xpChartTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4ECDC4',
  },
  xpChartValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#ffffff60',
    marginTop: 8,
    fontWeight: '600' as const,
  },
  barLabelToday: {
    color: '#4ECDC4',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff99',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 120,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  categoryIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryIconText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
  },
  categoryCardName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  categoryLevel: {
    backgroundColor: '#ffffff20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryLevelText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#ffffff20',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  questCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  questCardCompleted: {
    opacity: 0.6,
  },
  questLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  questIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questIconText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  questTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  questCategory: {
    fontSize: 12,
    color: '#ffffff99',
  },
  questRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  questXPText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyState: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ffffff99',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff10',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  calendarHeader: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  calendarHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
  },
  calendarContent: {
    padding: 20,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  dayLoggedIn: {
    backgroundColor: '#4ECDC4',
  },
  dayWithXP: {
    backgroundColor: '#FFD70030',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  dayNumberActive: {
    color: '#fff',
  },
  xpAmount: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFD700',
    marginTop: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  xpModalOverlay: {
    flex: 1,
    backgroundColor: '#00000090',
    justifyContent: 'flex-end',
  },
  xpModalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  xpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  xpModalTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  xpModalSubtitle: {
    fontSize: 14,
    color: '#ffffff80',
  },
  xpModalStats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  xpStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  xpStatLabel: {
    fontSize: 12,
    color: '#ffffff80',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  xpStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#4ECDC4',
  },
  xpStatDivider: {
    width: 1,
    backgroundColor: '#ffffff20',
    marginHorizontal: 20,
  },
  xpChartScrollView: {
    flex: 1,
  },
  screenTimeChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 300,
    paddingTop: 20,
  },
  screenTimeBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  screenTimeBarWrapper: {
    width: '100%',
    height: 250,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  screenTimeBar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  screenTimeBarText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#fff',
  },
  screenTimeLabelContainer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  screenTimeDayLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff60',
  },
  screenTimeDayLabelToday: {
    color: '#4ECDC4',
  },
  screenTimeDateLabel: {
    fontSize: 10,
    color: '#ffffff40',
  },
  screenTimeDateLabelToday: {
    color: '#4ECDC4',
    fontWeight: '700' as const,
  },
  weekSelector: {
    marginBottom: 20,
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
    padding: 16,
  },
  weekSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekSelectorLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  weekSelectorOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  weekSelectorModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  weekSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff20',
  },
  weekSelectorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  weekSelectorList: {
    maxHeight: 400,
  },
  weekSelectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  weekSelectorItemSelected: {
    backgroundColor: '#ffffff15',
  },
  weekSelectorItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  weekSelectorItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#ffffff99',
  },
  weekSelectorItemTextSelected: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  currentWeekBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentWeekBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  weekSelectorCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekSelectorCheckmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  categoryBreakdown: {
    marginTop: 32,
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  categoryBreakdownTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  categoryBreakdownDate: {
    fontSize: 14,
    color: '#ffffff80',
    marginBottom: 16,
  },
  categoryBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  categoryBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBreakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBreakdownName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  categoryBreakdownXP: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#4ECDC4',
  },
});
