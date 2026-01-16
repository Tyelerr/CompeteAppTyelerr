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

  // Fallback news data for when feed is unavailable
  const fallbackNews: INewsFeed[] = [
    {
      title: 'Welcome to Compete App',
      description: {
        __cdata:
          "Stay tuned for the latest billiards news and tournaments. We're working to bring you the best content from the billiards community.",
      },
      link: 'https://www.azbilliards.com',
      pubDate: new Date().toDateString(),
      'dc:creator': { __cdata: 'Compete App Team' },
      category: [{ __cdata: 'General' }],
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
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://www.azbilliards.com/feed/', {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CompeteApp/1.0',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`,
        );
      }

      const xmlText = await response.text();

      if (!xmlText || xmlText.trim().length === 0) {
        throw new Error('Empty response received from feed');
      }

      const options = {
        ignoreAttributes: false,
        attributeNameProcessors: [(name: string) => name.replace(':', '_')],
        allowBooleanAttributes: true,
        parseNodeValue: true,
        parseAttributeValue: true,
        cdataPropName: '__cdata',
      };

      const parser = new XMLParser(options);
      const result = parser.parse(xmlText);

      if (!result?.rss?.channel?.item) {
        throw new Error('Invalid RSS feed structure');
      }

      const newsItems = Array.isArray(result.rss.channel.item)
        ? result.rss.channel.item
        : [result.rss.channel.item];

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
        setTimeout(() => {
          __FetchTheFeed(retryAttempt + 1);
        }, retryDelay);
      } else {
        // Max retries reached, use fallback content
        console.warn('Max retries reached, using fallback news content');
        set_itemsNews(fallbackNews);
        setFeedState({
          loading: false,
          error: `Unable to load news feed. ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          retryCount: retryAttempt,
          lastFetchTime: null,
        });
      }
    }
  };

  const __RetryFetch = () => {
    __FetchTheFeed(0);
  };

  const __OpenTheExternalLink = async (url: string) => {
    // const url = 'https://www.example.com'; // Your external URL

    try {
      const supported = await Linking.canOpenURL(url); // Check if the URL can be opened
      // // // // // // // console.log('supported:', supported);

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
    __FetchTheFeed();
  }, []);

  return (
    <ScreenScrollView>
      {/*<ContentSwitcher buttonsDetails={[
      {
        title: 'Latest News'
      },
      {
        title: 'Player Spotlight'
      },
      {
        title: 'Bar of the Month'
      },
    ]} />*/}

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
            <Text style={[StyleZ.p]}>Loading news...</Text>
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
                name="warning"
                style={{
                  fontSize: TextsSizes.h2,
                  color: BaseColors.warning,
                  marginRight: BasePaddingsMargins.m10,
                }}
              />
              <Text style={[StyleZ.h3, { color: BaseColors.warning }]}>
                News Feed Unavailable
              </Text>
            </View>
            <Text style={[StyleZ.p, { marginBottom: BasePaddingsMargins.m15 }]}>
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
                Retry Loading News
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
