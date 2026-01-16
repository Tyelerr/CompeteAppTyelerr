import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenScrollView from '../ScreenScrollView';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import ContentSwitcher from '../../components/ContentSwitcher';
import ScreenHomeSubNavigation from './ScreenHomeSubNavigation';
import UIPanel from '../../components/UI/UIPanel';
import { Ionicons } from '@expo/vector-icons';
import { StyleZ } from '../../assets/css/styles';
import { useEffect, useState } from 'react';
import { XMLParser } from 'fast-xml-parser';

interface INewsFeed {
  category: {
    __cdata: string;
  }[];
  'dc:creator': {
    __cdata: string;
  };
  description: {
    __cdata: string;
  };
  link: string;
  pubDate: string;
  title: string;
}

interface IFeedState {
  loading: boolean;
  error: string | null;
  retryCount: number;
  lastFetchTime: number | null;
}

export default function ScreenHome() {
  const [itemsNews, set_itemsNews] = useState<INewsFeed[]>([]);
  const [feedState, setFeedState] = useState<IFeedState>({
    loading: false,
    error: null,
    retryCount: 0,
    lastFetchTime: null,
  });

  // Enhanced fallback news data with real billiards content
  const fallbackNews: INewsFeed[] = [
    {
      title: 'Welcome to Compete App - Latest Billiards News',
      description: {
        __cdata:
          "Stay connected with the billiards community! We're working to bring you the latest tournament results, player spotlights, and venue updates. Check back regularly for fresh content from the world of pool and billiards.",
      },
      link: 'https://www.azbilliards.com',
      pubDate: new Date().toDateString(),
      'dc:creator': { __cdata: 'Compete App Team' },
      category: [{ __cdata: 'General' }],
    },
    {
      title: 'Tournament Directory Available',
      description: {
        __cdata:
          'Browse upcoming tournaments in your area using our comprehensive tournament directory. Find local competitions, register for events, and connect with other players in the billiards community.',
      },
      link: 'https://www.azbilliards.com/tournaments',
      pubDate: new Date().toDateString(),
      'dc:creator': { __cdata: 'Tournament Director' },
      category: [{ __cdata: 'Tournaments' }],
    },
    {
      title: 'Player Profiles and Rankings',
      description: {
        __cdata:
          'Discover top players in your region and track your own progress. Our player ranking system helps you find competitive matches and improve your game through structured competition.',
      },
      link: 'https://www.azbilliards.com/players',
      pubDate: new Date().toDateString(),
      'dc:creator': { __cdata: 'Player Relations' },
      category: [{ __cdata: 'Players' }],
    },
  ];

  const __FetchTheFeed = async (retryAttempt: number = 0): Promise<void> => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryAttempt) * 1000; // Exponential backoff: 1s, 2s, 4s

    setFeedState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      retryCount: retryAttempt,
    }));

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds for mobile

      // Enhanced headers for mobile compatibility
      const response = await fetch('https://www.azbilliards.com/feed/', {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`,
        );
      }

      let xmlText = await response.text();

      if (!xmlText || xmlText.trim().length === 0) {
        throw new Error('Empty response received from feed');
      }

      // Fix malformed XML by removing incomplete item tags at the end
      xmlText = xmlText.trim();
      const lastCompleteItemIndex = xmlText.lastIndexOf('</item>');
      if (lastCompleteItemIndex > -1) {
        const afterLastItem = xmlText.substring(lastCompleteItemIndex + 7);
        // If there's an incomplete <item> tag after the last complete one, remove it
        if (
          afterLastItem.includes('<item>') &&
          !afterLastItem.includes('</item>')
        ) {
          console.log('Found incomplete item tag, fixing...');
          xmlText =
            xmlText.substring(0, lastCompleteItemIndex + 7) +
            afterLastItem.substring(0, afterLastItem.indexOf('<item>')) +
            '</channel></rss>';
        }
      }

      const options = {
        ignoreAttributes: false,
        attributeNameProcessors: [(name: string) => name.replace(':', '_')],
        allowBooleanAttributes: true,
        parseNodeValue: true,
        parseAttributeValue: true,
        cdataPropName: '__cdata',
        stopNodes: ['*.description'], // Prevent parsing HTML content inside descriptions
      };

      const parser = new XMLParser(options);
      const result = parser.parse(xmlText);

      if (!result?.rss?.channel) {
        throw new Error('Invalid RSS feed structure - missing channel');
      }

      // Handle case where there are no items or items is not an array
      let newsItems = [];
      if (result.rss.channel.item) {
        newsItems = Array.isArray(result.rss.channel.item)
          ? result.rss.channel.item
          : [result.rss.channel.item];

        // Filter out incomplete items (items without required fields)
        newsItems = newsItems.filter(
          (item: any) =>
            item &&
            item.title &&
            item.description &&
            item.link &&
            item.pubDate &&
            item['dc_creator'], // Note: this becomes dc_creator after processing
        );
      }

      // If no valid items found, use fallback
      if (newsItems.length === 0) {
        console.warn(
          'No valid news items found in feed, using fallback content',
        );
        newsItems = fallbackNews;
      }

      console.log(`Successfully loaded ${newsItems.length} news items`);
      set_itemsNews(newsItems as INewsFeed[]);
      setFeedState({
        loading: false,
        error: null,
        retryCount: 0,
        lastFetchTime: Date.now(),
      });
    } catch (error) {
      console.error(
        `Failed to fetch XML feed (attempt ${retryAttempt + 1}):`,
        error,
      );

      if (retryAttempt < maxRetries) {
        // Retry with exponential backoff
        console.log(`Retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          __FetchTheFeed(retryAttempt + 1);
        }, retryDelay);
      } else {
        // Max retries reached, use fallback content
        console.warn(
          'Max retries reached, using enhanced fallback news content',
        );
        set_itemsNews(fallbackNews);
        setFeedState({
          loading: false,
          error: `News feed temporarily unavailable. Showing local content. ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          retryCount: retryAttempt,
          lastFetchTime: null,
        });
      }
    }
  };

  const __RetryFetch = () => {
    console.log('User requested manual retry');
    __FetchTheFeed(0);
  };

  const __OpenTheExternalLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`Don't know how to open this URL: ${url}`);
      }
    } catch (error) {
      console.error('An error occurred', error);
      Alert.alert('Failed to open link.');
    }
  };

  useEffect(() => {
    console.log('ScreenHome mounted, fetching RSS feed...');
    __FetchTheFeed();
  }, []);

  return (
    <ScreenScrollView>
      <ScreenHomeSubNavigation />

      {/* Loading State */}
      {feedState.loading && (
        <UIPanel>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: BasePaddingsMargins.m20,
            }}
          >
            <Ionicons
              name="refresh"
              style={{
                fontSize: TextsSizes.h2,
                color: BaseColors.primary,
                marginRight: BasePaddingsMargins.m10,
              }}
            />
            <Text style={[StyleZ.p]}>Loading latest billiards news...</Text>
          </View>
        </UIPanel>
      )}

      {/* Error State */}
      {feedState.error && !feedState.loading && (
        <UIPanel>
          <View
            style={{
              padding: BasePaddingsMargins.m20,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: BasePaddingsMargins.m10,
              }}
            >
              <Ionicons
                name="information-circle"
                style={{
                  fontSize: TextsSizes.h2,
                  color: BaseColors.primary,
                  marginRight: BasePaddingsMargins.m10,
                }}
              />
              <Text style={[StyleZ.h3, { color: BaseColors.primary }]}>
                Showing Local Content
              </Text>
            </View>
            <Text
              style={[
                StyleZ.p,
                { marginBottom: BasePaddingsMargins.m15, fontSize: 12 },
              ]}
            >
              {feedState.error}
            </Text>
            <TouchableOpacity
              onPress={__RetryFetch}
              style={{
                backgroundColor: BaseColors.primary,
                padding: BasePaddingsMargins.m10,
                borderRadius: 5,
                alignItems: 'center',
              }}
            >
              <Text style={[StyleZ.p, { color: '#FFFFFF', marginBottom: 0 }]}>
                Try Loading Live News
              </Text>
            </TouchableOpacity>
          </View>
        </UIPanel>
      )}

      {/* News Content */}
      <View style={{}}>
        {itemsNews.map((news: INewsFeed, key: number) => {
          return (
            <UIPanel key={`panel-news-${key}`}>
              <View
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  },
                ]}
              >
                <View
                  style={{
                    width: '10%',
                  }}
                >
                  <Ionicons
                    name="star-outline"
                    style={{
                      fontSize: TextsSizes.h1,
                      color: BaseColors.warning,
                    }}
                  />
                </View>
                <View
                  style={{
                    width: '88%',
                  }}
                >
                  <Text style={[StyleZ.h2]}>{news.title}</Text>
                  <Text
                    style={[
                      StyleZ.p,
                      {
                        marginBottom: BasePaddingsMargins.m20,
                      },
                    ]}
                  >
                    {news.description.__cdata.substring(0, 200)}
                    {news.description.__cdata.length > 200 ? '...' : ''}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Text
                        style={[
                          StyleZ.p,
                          {
                            marginRight: BasePaddingsMargins.m10,
                          },
                        ]}
                      >
                        {news['dc:creator'].__cdata}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Ionicons
                          name="time"
                          style={[
                            StyleZ.p,
                            {
                              marginRight: BasePaddingsMargins.m5,
                              marginBottom: 0,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            StyleZ.p,
                            {
                              marginBottom: 0,
                            },
                          ]}
                        >
                          {news.pubDate.split(' 20')[0]}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        __OpenTheExternalLink(news.link);
                      }}
                    >
                      <Ionicons
                        name="open"
                        style={[
                          {
                            color: BaseColors.success,
                            fontSize: TextsSizes.h1,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </UIPanel>
          );
        })}
      </View>
    </ScreenScrollView>
  );
}
