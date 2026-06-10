import { useQuery } from '@tanstack/react-query';
import { getArtist, getArtistTopSongs } from '@/services/api';

export function useArtist(id: string | undefined) {
  return useQuery({
    queryKey: ['artist', id],
    queryFn: () => getArtist(id!),
    enabled: !!id,
  });
}

export function useArtistTopSongs(id: string | undefined) {
  return useQuery({
    queryKey: ['artist-songs', id],
    queryFn: () => getArtistTopSongs(id!),
    enabled: !!id,
  });
}
