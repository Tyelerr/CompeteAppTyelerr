import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { IFeaturedPlayer, IFeaturedBar } from '../hooks/InterfacesGlobal';
import { GetRandomFeaturedPlayer } from '../ApiSupabase/CrudFeaturedPlayers';
import { GetRandomFeaturedBar } from '../ApiSupabase/CrudFeaturedBars';

interface FeaturedContentContextType {
  featuredPlayer: IFeaturedPlayer | null;
  featuredBar: IFeaturedBar | null;
  refreshFeaturedPlayer: () => Promise<void>;
  refreshFeaturedBar: () => Promise<void>;
  isLoading: boolean;
}

const FeaturedContentContext = createContext<
  FeaturedContentContextType | undefined
>(undefined);

interface FeaturedContentProviderProps {
  children: ReactNode;
}

export const FeaturedContentProvider: React.FC<
  FeaturedContentProviderProps
> = ({ children }) => {
  const [featuredPlayer, setFeaturedPlayer] = useState<IFeaturedPlayer | null>(
    null,
  );
  const [featuredBar, setFeaturedBar] = useState<IFeaturedBar | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshFeaturedPlayer = async () => {
    try {
      const { data, error } = await GetRandomFeaturedPlayer();
      if (error === null && data !== null) {
        setFeaturedPlayer(data as IFeaturedPlayer);
      }
    } catch (error) {
      console.log('Error refreshing featured player:', error);
    }
  };

  const refreshFeaturedBar = async () => {
    try {
      const { data, error } = await GetRandomFeaturedBar();
      if (error === null && data !== null) {
        setFeaturedBar(data as IFeaturedBar);
      }
    } catch (error) {
      console.log('Error refreshing featured bar:', error);
    }
  };

  // Initial load of both featured content
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([refreshFeaturedPlayer(), refreshFeaturedBar()]);
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  // Expose functions to refresh content immediately when tabs are switched
  const refreshPlayerImmediately = async () => {
    await refreshFeaturedPlayer();
  };

  const refreshBarImmediately = async () => {
    await refreshFeaturedBar();
  };

  const value: FeaturedContentContextType = {
    featuredPlayer,
    featuredBar,
    refreshFeaturedPlayer: refreshPlayerImmediately,
    refreshFeaturedBar: refreshBarImmediately,
    isLoading,
  };

  return (
    <FeaturedContentContext.Provider value={value}>
      {children}
    </FeaturedContentContext.Provider>
  );
};

export const useFeaturedContent = (): FeaturedContentContextType => {
  const context = useContext(FeaturedContentContext);
  if (context === undefined) {
    throw new Error(
      'useFeaturedContent must be used within a FeaturedContentProvider',
    );
  }
  return context;
};
