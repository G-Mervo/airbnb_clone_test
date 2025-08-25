import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import WishlistPage from './WishlistPage';
import { getWishList as fetchWishList } from '../../api/apiRooms';
import { svg } from '../../asset/HeartIconSvg';
import { saveFavorite, deleteFavorite } from '../../api/apiAuthentication';

type RootState = {
  app: {
    userFavListing: (string | number)[];
    userData: any;
    isFavorite: boolean | null;
    itemId: string | number | null;
  };
};

const Wishlist: React.FC = () => {
  const [wishList, setWishList] = useState<any[] | null>(null);
  const { favListings, userData, isFavorite, itemId } = useSelector((store: RootState & any) => ({
    favListings: store.app.userFavListing,
    userData: store.app.userData,
    isFavorite: (store as any).app.isFavorite,
    itemId: (store as any).app.itemId,
  }));

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['wishList', favListings],
    // mock getWishList returns [] for now; replace with real implementation as needed
    queryFn: () => fetchWishList(favListings as any),
    enabled: false,
  });

  const firstRender = useRef(false);

  useEffect(() => {
    let timeoutId: any;
    if (favListings.length && !firstRender.current) {
      refetch();
      timeoutId = setTimeout(() => {
        firstRender.current = true;
      }, 1000);
    }
    return () => clearTimeout(timeoutId);
  }, [refetch, favListings, isLoading]);

  useEffect(() => {
    if (data) setWishList(data as any);
  }, [data]);

  // Persist favorite changes when toggled from the wishlist page (mirrors referenced repo behavior)
  useEffect(() => {
    const run = async () => {
      if (!itemId || !userData) return;
      if (isFavorite) {
        await saveFavorite(itemId);
      } else {
        await deleteFavorite(itemId);
      }
    };
    run();
  }, [itemId, isFavorite, userData]);

  return (
    <WishlistPage
      userData={userData}
      isLoading={isLoading}
      wishList={wishList}
      favListings={favListings as any}
      svg={svg as any}
    />
  );
};

export default Wishlist;
