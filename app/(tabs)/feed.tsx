import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Search, Heart, MessageCircle, Zap, UserPlus, Heart as HeartIcon, DollarSign, Brain, Target, Users, Shield, X, Send, CornerDownRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useActivities } from '@/context/ActivityContext';
import { useUser } from '@/context/UserContext';
import { CATEGORY_DATA } from '@/constants/categories';
import Avatar from '@/components/Avatar';
import { Activity } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { friendsActivities, recommendedActivities, mockUsers, addFriend, toggleLike, addComment, deleteComment, activities } = useActivities();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  const getCategoryIcon = (categoryId: string, size = 20) => {
    const category = CATEGORY_DATA[categoryId as keyof typeof CATEGORY_DATA];
    const iconProps = { size, color: category?.color || '#667eea' };
    
    switch (categoryId) {
      case 'health':
        return <HeartIcon {...iconProps} />;
      case 'wealth':
        return <DollarSign {...iconProps} />;
      case 'mental':
        return <Brain {...iconProps} />;
      case 'discipline':
        return <Target {...iconProps} />;
      case 'social':
        return <Users {...iconProps} />;
      case 'recovery':
        return <Shield {...iconProps} />;
      default:
        return <Zap {...iconProps} />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderActivityCard = (activity: Activity) => {
    const category = CATEGORY_DATA[activity.category];
    
    return (
      <View key={activity.id} style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({
                pathname: '/user-profile' as any,
                params: { userId: activity.userId },
              });
            }}
          >
            <Avatar avatar={activity.avatar} size={40} />
            <View style={styles.userTextInfo}>
              <Text style={styles.username}>{activity.username}</Text>
              <Text style={styles.timestamp}>{formatTimeAgo(activity.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.activityContent}>
          <View style={styles.activityTextRow}>
            <View style={[styles.categoryIconBadge, { backgroundColor: category.color + '20' }]}>
              {getCategoryIcon(activity.category, 16)}
            </View>
            <Text style={styles.activityText}>
              {activity.type === 'milestone_completed' ? 'completed milestone' : 'completed'}{' '}
              <Text style={styles.questTitle}>{activity.questTitle}</Text>
            </Text>
          </View>
          
          <View style={styles.xpBadge}>
            <Zap size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.xpText}>+{activity.xpEarned} XP</Text>
          </View>

          {activity.caption && (
            <Text style={styles.captionText}>{activity.caption}</Text>
          )}
        </View>

        {activity.media && (
          <View style={styles.mediaContainer}>
            {activity.media.type === 'image' && (
              <Image
                source={{ uri: activity.media.uri }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            )}
          </View>
        )}

        <View style={styles.activityActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              toggleLike(activity.id);
            }}
          >
            <Heart 
              size={20} 
              color={activity.likes?.includes(user.id) ? "#FF6B6B" : "#ffffff99"}
              fill={activity.likes?.includes(user.id) ? "#FF6B6B" : "transparent"}
            />
            <Text style={styles.actionText}>
              {activity.likes?.length || 0}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedActivity(activity);
              setCommentModalVisible(true);
            }}
          >
            <MessageCircle size={20} color="#ffffff99" />
            <Text style={styles.actionText}>
              {activity.comments?.length || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredUsers = mockUsers.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
    u.id !== user.id &&
    !user.friends.includes(u.id)
  );

  const showRecommendedSection = friendsActivities.length === 0 || recommendedActivities.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Feed</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color="#ffffff66" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor="#ffffff66"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {searchQuery.length > 0 ? (
            <View style={styles.searchResults}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {filteredUsers.map(searchUser => (
                <TouchableOpacity
                  key={searchUser.id}
                  style={styles.userCard}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push({
                      pathname: '/user-profile' as any,
                      params: { userId: searchUser.id },
                    });
                  }}
                >
                  <Avatar avatar={searchUser.avatar} size={50} />
                  <View style={styles.userCardInfo}>
                    <Text style={styles.userCardName}>{searchUser.username}</Text>
                    <Text style={styles.userCardLevel}>Level {searchUser.level}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                      addFriend(searchUser.id);
                    }}
                  >
                    <UserPlus size={20} color="#667eea" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              {filteredUsers.length === 0 && (
                <Text style={styles.emptyText}>No users found</Text>
              )}
            </View>
          ) : (
            <>
              {friendsActivities.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Friends Activity</Text>
                  {friendsActivities.map(renderActivityCard)}
                </View>
              )}

              {friendsActivities.length === 0 && (
                <View style={styles.emptySection}>
                  <Users size={48} color="#ffffff33" />
                  <Text style={styles.emptyTitle}>No Friends Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Search for users above to add friends and see their activity
                  </Text>
                </View>
              )}

              {showRecommendedSection && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recommended Users</Text>
                  {recommendedActivities.slice(0, 10).map(renderActivityCard)}
                </View>
              )}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCommentModalVisible(false);
          setSelectedActivity(null);
          setCommentText('');
        }}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.commentModal}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments</Text>
              <TouchableOpacity 
                onPress={() => {
                  setCommentModalVisible(false);
                  setSelectedActivity(null);
                  setCommentText('');
                }}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsScroll} contentContainerStyle={styles.commentsContent}>
              {selectedActivity?.comments && selectedActivity.comments.length > 0 ? (
                selectedActivity.comments.map((comment, commentIndex) => (
                  <View key={comment.id && comment.id.trim() ? comment.id : `comment-${selectedActivity.id}-${commentIndex}`}>
                    <View style={styles.commentItem}>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentUsername}>{comment.username}</Text>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <View style={styles.commentActions}>
                          <Text style={styles.commentTime}>
                            {formatTimeAgo(comment.timestamp)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                              setReplyingTo({ id: comment.id, username: comment.username });
                            }}
                          >
                            <Text style={styles.commentActionText}>Reply</Text>
                          </TouchableOpacity>
                          {comment.userId === user.id && (
                            <TouchableOpacity
                              onPress={async () => {
                                if (Platform.OS !== 'web') {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                                if (selectedActivity) {
                                  const updated = await deleteComment(selectedActivity.id, comment.id);
                                  if (updated) {
                                    setSelectedActivity(updated);
                                  }
                                }
                              }}
                            >
                              <Text style={styles.commentDeleteText}>Delete</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                    {comment.replies && comment.replies.length > 0 && (
                      <View style={styles.repliesContainer}>
                        {comment.replies.map((reply, replyIndex) => (
                          <View key={reply.id && reply.id.trim() ? reply.id : `reply-${selectedActivity.id}-${comment.id}-${replyIndex}`} style={styles.replyItem}>
                            <CornerDownRight size={14} color="#999" style={styles.replyIcon} />
                            <View style={styles.replyContent}>
                              <Text style={styles.commentUsername}>{reply.username}</Text>
                              <Text style={styles.commentText}>{reply.text}</Text>
                              <View style={styles.commentActions}>
                                <Text style={styles.commentTime}>
                                  {formatTimeAgo(reply.timestamp)}
                                </Text>
                                {reply.userId === user.id && (
                                  <TouchableOpacity
                                    onPress={async () => {
                                      if (Platform.OS !== 'web') {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      }
                                      if (selectedActivity) {
                                        const updated = await deleteComment(selectedActivity.id, reply.id);
                                        if (updated) {
                                          setSelectedActivity(updated);
                                        }
                                      }
                                    }}
                                  >
                                    <Text style={styles.commentDeleteText}>Delete</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noCommentsText}>No comments yet. Be the first!</Text>
              )}
            </ScrollView>

            <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom + 12 }]}>
              {replyingTo && (
                <View style={styles.replyingToContainer}>
                  <Text style={styles.replyingToText}>
                    Replying to @{replyingTo.username}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setReplyingTo(null);
                    }}
                  >
                    <X size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Write a comment..."}
                  placeholderTextColor="#666"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendCommentButton, !commentText.trim() && styles.sendCommentButtonDisabled]}
                  onPress={async () => {
                    if (commentText.trim() && selectedActivity) {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      const updated = await addComment(selectedActivity.id, commentText.trim(), replyingTo?.id);
                      if (updated) {
                        setSelectedActivity(updated);
                      }
                      setCommentText('');
                      setReplyingTo(null);
                    }
                  }}
                  disabled={!commentText.trim()}
                >
                  <Send size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff20',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#ffffff66',
    marginTop: 2,
  },
  activityContent: {
    marginBottom: 12,
  },
  activityTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    fontSize: 14,
    color: '#ffffff99',
    flex: 1,
  },
  questTitle: {
    fontWeight: '600' as const,
    color: '#fff',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  captionText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
    lineHeight: 20,
  },
  mediaContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff99',
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#ffffff66',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  searchResults: {
    marginBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  userCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  userCardLevel: {
    fontSize: 12,
    color: '#ffffff66',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#ffffff66',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  commentModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  commentModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  commentsScroll: {
    flex: 1,
  },
  commentsContent: {
    padding: 20,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  commentInputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
  },
  sendCommentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCommentButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  commentContent: {
    flex: 1,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  commentDeleteText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ff6b6b',
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 8,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  replyIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  replyContent: {
    flex: 1,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
