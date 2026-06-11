import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { RouteError } from '@/components/ErrorBoundary';

// Route-based code splitting: every page is its own chunk.
const HomePage = lazy(() => import('@/pages/HomePage'));
const DiscoverPage = lazy(() => import('@/pages/DiscoverPage'));
const ChartsPage = lazy(() => import('@/pages/ChartsPage'));
const DownloadPage = lazy(() => import('@/pages/DownloadPage'));
const MadeForYouPage = lazy(() => import('@/pages/MadeForYouPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const SongPage = lazy(() => import('@/pages/SongPage'));
const AlbumPage = lazy(() => import('@/pages/AlbumPage'));
const PlaylistPage = lazy(() => import('@/pages/PlaylistPage'));
const ArtistPage = lazy(() => import('@/pages/ArtistPage'));
const LyricsPage = lazy(() => import('@/pages/LyricsPage'));
const LibraryPage = lazy(() => import('@/pages/LibraryPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const QueuePage = lazy(() => import('@/pages/QueuePage'));
const NowPlayingPage = lazy(() => import('@/pages/NowPlayingPage'));
const LanguagesPage = lazy(() => import('@/pages/LanguagesPage'));
const MoodsPage = lazy(() => import('@/pages/MoodsPage'));
const RegionsPage = lazy(() => import('@/pages/RegionsPage'));
const TasteProfilePage = lazy(() => import('@/pages/TasteProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const CacheInfoPage = lazy(() => import('@/pages/CacheInfoPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'home', element: <Navigate to="/" replace /> },
      { path: 'discover', element: <DiscoverPage /> },
      { path: 'charts', element: <ChartsPage /> },
      { path: 'made-for-you', element: <MadeForYouPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'search/:query', element: <SearchPage /> },
      { path: 'song/:id', element: <SongPage /> },
      { path: 'album/:id', element: <AlbumPage /> },
      { path: 'playlist/:id', element: <PlaylistPage /> },
      { path: 'artist/:id', element: <ArtistPage /> },
      { path: 'lyrics/:id', element: <LyricsPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'queue', element: <QueuePage /> },
      { path: 'now-playing', element: <NowPlayingPage /> },
      { path: 'languages', element: <LanguagesPage /> },
      { path: 'moods', element: <MoodsPage /> },
      { path: 'regions', element: <RegionsPage /> },
      { path: 'taste-profile', element: <TasteProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'cache-info', element: <CacheInfoPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'download', element: <DownloadPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
