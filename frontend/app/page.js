'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { posts as postsApi, collections as collectionsApi, follows as followsApi, comments as commentsApi } from '../lib/api/index';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Stories from '../components/Stories';
import CategoryChips from '../components/CategoryChips';
import Feed from '../components/Feed';
import NoteModal from '../components/NoteModal';
import CreateModal from '../components/CreateModal';
import ProfileModal from '../components/ProfileModal';
import ExplorePage from '../components/ExplorePage';
import AnalyticsModal from '../components/AnalyticsModal';
import SchedulerModal from '../components/SchedulerModal';
import CaptionModal from '../components/CaptionModal';
import ThemeModal from '../components/ThemeModal';
import BookmarkModal from '../components/BookmarkModal';
import SettingsPage from './settings/page';
import ReportModal from '../components/ReportModal';
import BlockMuteModal from '../components/BlockMuteModal';
import AdminDashboard from './admin/page';
import ModerationQueue from '../components/ModerationQueue';
import TranslationModal from '../components/TranslationModal';
import VideoUpload from '../components/VideoUpload';
import GoLiveModal from '../components/live/GoLiveModal';
import VerificationModal from '../components/VerificationModal';
import ReelsPage from '../components/ReelsPage';
import GroupsPage from '../components/GroupsPage';
import { PollCreator } from '../components/PollComponents';
import PhotoFilters from '../components/PhotoFilters';
import QRCodeShare from '../components/QRCodeShare';
import NearbyPlaces from '../components/NearbyPlaces';
import ShopPage from '../components/ShopPage';
import StoryHighlights from '../components/StoryHighlights';
import { UserTag, UserTagInput } from '../components/UserTags';
import PostInsights from '../components/PostInsights';
import GIFSearch from '../components/GIFSearch';
import TextStyles from '../components/TextStyles';
import AudioMusic from '../components/AudioMusic';
import CollabPost from '../components/CollabPost';
import StoryFilters from '../components/StoryFilters';
import AutoReply from '../components/AutoReply';
import ScheduledMessages from '../components/ScheduledMessages';
import StickerPicker from '../components/StickerPicker';
import PostBackgrounds from '../components/PostBackgrounds';
import VoiceMessage from '../components/VoiceMessage';
import CustomEmojis from '../components/CustomEmojis';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const [notes, setNotes] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showLiveStream, setShowLiveStream] = useState(false);
  const [showGoLive, setShowGoLive] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showReels, setShowReels] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showPhotoFilters, setShowPhotoFilters] = useState(false);
  const [filterImage, setFilterImage] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insightsPostId, setInsightsPostId] = useState(null);
  const [showGIF, setShowGIF] = useState(false);
  const [showTextStyles, setShowTextStyles] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [showStoryFilters, setShowStoryFilters] = useState(false);
  const [storyFilterImage, setStoryFilterImage] = useState(null);
  const [showAutoReply, setShowAutoReply] = useState(false);
  const [showScheduledMsg, setShowScheduledMsg] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [showVoiceMsg, setShowVoiceMsg] = useState(false);
  const [showCustomEmojis, setShowCustomEmojis] = useState(false);
  const [translateTarget, setTranslateTarget] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [dark, setDark] = useState(false);
  const [follows, setFollows] = useState({});
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const addToast = useCallback((msg) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('rn-theme');
    if (saved === 'dark') { setDark(true); document.documentElement.classList.add('dark'); }
    if (!authLoading) fetchNotes(1);
    if (user) {
      fetchCollections();
      checkFollows();
    }

    const handleOpenGoLive = () => {
      if (user) setShowGoLive(true);
      else window.location.assign('/auth/login');
    };
    window.addEventListener('openGoLive', handleOpenGoLive);
    return () => window.removeEventListener('openGoLive', handleOpenGoLive);
  }, [user, authLoading]);

  useEffect(() => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem('rn-theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('rn-theme', 'light'); }
  }, [dark]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        setPage((p) => { const next = p + 1; fetchNotes(next); return next; });
      }
    }, { threshold: 0.1 });
    observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, category, search]);

  const fetchNotes = async (pageNum = 1, filterOverrides = {}) => {
    try {
      setLoading(pageNum === 1);
      const selectedCategory = filterOverrides.category ?? category;
      const selectedSearch = filterOverrides.search ?? search;
      const { data, error, hasMore: more } = await postsApi.list({
        page: pageNum,
        limit: 10,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: selectedSearch || undefined
      });
      if (data) {
        setNotes((prev) => pageNum === 1 ? data : [...prev, ...data]);
        setHasMore(more);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchNotes(1);
    setRefreshing(false);
    addToast('Feed refreshed');
  };

  const fetchCollections = async () => {
    const { data } = await collectionsApi.list();
    if (data) setCollections(data);
  };

  const checkFollows = async () => {
    if (!user) return;
    const followState = {};
    for (const note of notes) {
      if (note.user_id !== user.id) {
        const { following } = await followsApi.check(note.user_id);
        followState[note.user_id] = following;
      }
    }
    setFollows(followState);
  };

  const handleCategory = (cat) => {
    setCategory(cat);
    setPage(1);
    fetchNotes(1, { category: cat });
  };
  const handleSearch = (q) => {
    setSearch(q);
    setPage(1);
    fetchNotes(1, { search: q });
  };

  const toggleLike = async (note) => {
    const newLiked = !note.liked;
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, liked: newLiked, likes: n.likes + (newLiked ? 1 : -1) } : n));
    if (selectedNote?.id === note.id) setSelectedNote((prev) => prev ? { ...prev, liked: newLiked, likes: prev.likes + (newLiked ? 1 : -1) } : null);
    const { error } = await postsApi.toggleLike(note.id);
    if (error) {
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, liked: !newLiked, likes: n.likes + (newLiked ? -1 : 1) } : n));
    }
  };

  const toggleCollect = async (note) => {
    const newCollected = !note.collected;
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, collected: newCollected, collects: n.collects + (newCollected ? 1 : -1) } : n));
    if (selectedNote?.id === note.id) setSelectedNote((prev) => prev ? { ...prev, collected: newCollected, collects: prev.collects + (newCollected ? 1 : -1) } : null);
    const { error } = await postsApi.toggleCollect(note.id);
    if (error) {
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, collected: !newCollected, collects: n.collects + (newCollected ? -1 : 1) } : n));
    }
  };

  const addComment = async (noteId, text) => {
    const { data, error } = await commentsApi.create(noteId, text);
    if (data) {
      setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, comment_count: (n.comment_count || 0) + 1 } : n));
      if (selectedNote?.id === noteId) setSelectedNote((prev) => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : null);
      return data;
    }
  };

  const createNote = async (data) => {
    const { data: note, error } = await postsApi.create(data);
    if (note) {
      setNotes((prev) => [{ ...note, profiles: profile }, ...prev]);
      addToast('Note published');
      return note;
    }
    addToast(`Publish failed: ${error?.message || 'Unknown error'}`);
    return null;
  };

  const toggleFollow = async (userId) => {
    const { data, error } = await followsApi.toggle(userId);
    if (data) {
      setFollows((prev) => ({ ...prev, [userId]: data.following }));
    }
  };

  const openNotificationTarget = async (notification) => {
    if (notification?.entity_type !== 'post' || !notification.entity_id) return;
    const existing = notes.find((note) => note.id === notification.entity_id);
    if (existing) return setSelectedNote(existing);
    const { data, error } = await postsApi.get(notification.entity_id);
    if (data) setSelectedNote(data);
    else addToast(`Post could not be opened: ${error?.message || 'Not found'}`);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', transition: 'background 0.3s, color 0.3s' }}>
        <Sidebar onExplore={() => setShowExplore(true)} onPost={() => user ? setShowCreate(true) : window.location.assign('/auth/login')} onNotifications={() => document.querySelector('.rn-notification-trigger')?.click()} onLive={() => window.location.assign('/live')} />
        <Header
          dark={dark} setDark={setDark}
          onSearch={handleSearch} search={search}
          onOpenCreate={() => user ? setShowCreate(true) : window.location.assign('/auth/login')}
          onOpenProfile={() => user ? setShowProfile(true) : window.location.assign('/auth/login')}
          onOpenExplore={() => setShowExplore(true)}
          onOpenSettings={() => user ? setShowSettings(true) : window.location.assign('/auth/login')}
          onOpenAdmin={() => user ? setShowAdmin(true) : window.location.assign('/auth/login')}
          onOpenModeration={() => user ? setShowModeration(true) : window.location.assign('/auth/login')}
          onOpenVideo={() => user ? setShowVideoUpload(true) : window.location.assign('/auth/login')}
          onOpenLive={() => user ? setShowLiveStream(true) : window.location.assign('/auth/login')}
          onOpenReels={() => setShowReels(true)}
          onOpenGroups={() => user ? setShowGroups(true) : window.location.assign('/auth/login')}
          onOpenVerification={() => user ? setShowVerification(true) : window.location.assign('/auth/login')}
          onOpenQR={() => user ? setShowQR(true) : window.location.assign('/auth/login')}
          onOpenNearby={() => setShowNearby(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenHighlights={() => user ? setShowHighlights(true) : window.location.assign('/auth/login')}
          onOpenAutoReply={() => user ? setShowAutoReply(true) : window.location.assign('/auth/login')}
          onOpenScheduledMsg={() => user ? setShowScheduledMsg(true) : window.location.assign('/auth/login')}
          addToast={addToast}
          me={profile}
          onSignOut={signOut}
          onLogin={() => window.location.assign('/auth/login')}
          onOpenNotification={openNotificationTarget}
        />
        {user && <Stories me={profile} onOpenCreate={() => setShowCreate(true)} addToast={addToast} />}
        <CategoryChips active={category} onChange={handleCategory} />
        <Feed
          notes={notes}
          onNoteClick={setSelectedNote}
          onLike={(note) => user ? toggleLike(note) : window.location.assign('/auth/login')}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          loadMoreRef={loadMoreRef}
          hasMore={hasMore}
        />
        {selectedNote && (
          <NoteModal
            note={selectedNote}
            follows={follows}
            onClose={() => setSelectedNote(null)}
            onLike={toggleLike}
            onCollect={toggleCollect}
            onComment={addComment}
            onFollow={(userId) => user ? toggleFollow(userId) : window.location.assign('/auth/login')}
            addToast={addToast}
            me={profile}
            onReport={(entityType, entityId) => setReportTarget({ entityType, entityId })}
            onBlock={(userId, username) => setBlockTarget({ userId, username })}
          />
        )}
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={createNote} categories={['Fashion','Food','Travel','Beauty','Fitness','Home','Pets','Art','Photography']} addToast={addToast} />}
        {showProfile && <ProfileModal notes={notes} me={profile} follows={follows} onClose={() => setShowProfile(false)} onOpenCreate={() => { setShowProfile(false); setShowCreate(true); }} onOpenAnalytics={() => { setShowProfile(false); setShowAnalytics(true); }} onOpenScheduler={() => { setShowProfile(false); setShowScheduler(true); }} onOpenCaptions={() => { setShowProfile(false); setShowCaptions(true); }} onOpenTheme={() => { setShowProfile(false); setShowTheme(true); }} onOpenBookmarks={() => { setShowProfile(false); setShowBookmarks(true); }} onOpenSettings={() => { setShowProfile(false); setShowSettings(true); }} onPostUpdated={(updated) => setNotes((current) => current.map((note) => note.id === updated.id ? { ...note, ...updated } : note))} onPostDeleted={(postId) => setNotes((current) => current.filter((note) => note.id !== postId))} onProfileUpdated={refreshProfile} />}
        {showExplore && <ExplorePage notes={notes} onClose={() => setShowExplore(false)} onNoteClick={setSelectedNote} onLike={toggleLike} />}
        {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} userId={user.id} />}
        {showScheduler && <SchedulerModal onClose={() => setShowScheduler(false)} addToast={addToast} />}
        {showCaptions && <CaptionModal onClose={() => setShowCaptions(false)} addToast={addToast} />}
        {showTheme && <ThemeModal dark={dark} setDark={setDark} onClose={() => setShowTheme(false)} />}
        {showBookmarks && <BookmarkModal collections={collections} setCollections={setCollections} selectedNoteId={selectedNote?.id} onClose={() => setShowBookmarks(false)} addToast={addToast} userId={user.id} />}
        {showSettings && <SettingsPage onClose={() => setShowSettings(false)} addToast={addToast} />}
        {reportTarget && <ReportModal entityType={reportTarget.entityType} entityId={reportTarget.entityId} onClose={() => setReportTarget(null)} addToast={addToast} />}
        {blockTarget && <BlockMuteModal targetUserId={blockTarget.userId} targetUsername={blockTarget.username} onClose={() => setBlockTarget(null)} addToast={addToast} />}
        {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} addToast={addToast} />}
        {showModeration && <ModerationQueue onClose={() => setShowModeration(false)} addToast={addToast} />}
        {showVideoUpload && <VideoUpload onClose={() => setShowVideoUpload(false)} addToast={addToast} onUpload={(data) => { createNote(data); setShowVideoUpload(false); }} />}
        {showLiveStream && <GoLiveModal onClose={() => setShowLiveStream(false)} addToast={addToast} />}
        {showGoLive && <GoLiveModal onClose={() => setShowGoLive(false)} addToast={addToast} />}
        {showVerification && <VerificationModal onClose={() => setShowVerification(false)} addToast={addToast} />}
        {showReels && <ReelsPage onClose={() => setShowReels(false)} addToast={addToast} />}
        {showGroups && <GroupsPage onClose={() => setShowGroups(false)} addToast={addToast} />}
        {showPhotoFilters && filterImage && <PhotoFilters image={filterImage} onApply={(css) => {}} onClose={() => { setShowPhotoFilters(false); setFilterImage(null); }} />}
        {showQR && <QRCodeShare username={profile?.username} onClose={() => setShowQR(false)} />}
        {showNearby && <NearbyPlaces onClose={() => setShowNearby(false)} addToast={addToast} />}
        {showShop && <ShopPage onClose={() => setShowShop(false)} addToast={addToast} />}
        {showHighlights && <StoryHighlights userId={user?.id} onClose={() => setShowHighlights(false)} addToast={addToast} />}
        {showInsights && insightsPostId && <PostInsights postId={insightsPostId} onClose={() => { setShowInsights(false); setInsightsPostId(null); }} />}
        {showGIF && <GIFSearch onSelect={(url) => addToast?.('GIF selected')} onClose={() => setShowGIF(false)} />}
        {showAudio && <AudioMusic onSelect={(track) => addToast?.(`Added: ${track.title}`)} onClose={() => setShowAudio(false)} />}
        {showCollab && <CollabPost onClose={() => setShowCollab(false)} addToast={addToast} />}
        {showStoryFilters && storyFilterImage && <StoryFilters image={storyFilterImage} onApply={(css) => {}} onClose={() => { setShowStoryFilters(false); setStoryFilterImage(null); }} />}
        {showAutoReply && <AutoReply onClose={() => setShowAutoReply(false)} addToast={addToast} />}
        {showScheduledMsg && <ScheduledMessages onClose={() => setShowScheduledMsg(false)} addToast={addToast} />}
        {showStickers && <StickerPicker onSelect={(s) => addToast?.('Sticker added')} onClose={() => setShowStickers(false)} />}
        {showBackgrounds && <PostBackgrounds onSelect={(bg) => addToast?.('Background selected')} onClose={() => setShowBackgrounds(false)} />}
        {showVoiceMsg && <VoiceMessage onSend={(url) => addToast?.('Voice message sent')} onClose={() => setShowVoiceMsg(false)} />}
        {showCustomEmojis && <CustomEmojis onSelect={(e) => addToast?.('Emoji added')} onClose={() => setShowCustomEmojis(false)} addToast={addToast} />}
        {translateTarget && <TranslationModal text={translateTarget} onTranslate={(t) => {}} onClose={() => setTranslateTarget(null)} />}
        <Toast toasts={toasts} />
      </div>
    </ErrorBoundary>
  );
}
