import { Text, View } from 'react-native';
import UIPanel from '../../components/UI/UIPanel';
import ScreenScrollView, { ScreenScrollViewRef } from '../ScreenScrollView';
import ScreenHomeSubNavigation from './ScreenHomeSubNavigation';
import { Ionicons } from '@expo/vector-icons';
import UIBadge from '../../components/UI/UIBadge';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { StyleZ } from '../../assets/css/styles';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { useContextAuth } from '../../context/ContextAuth';
import {
  ECustomContentType,
  EUserRole,
  ICAUserData,
  ICustomContent,
  IFeaturedPlayer,
} from '../../hooks/InterfacesGlobal';
import ModalEditorContent from './ModalEditorContent';
import { useEffect, useState, useRef } from 'react';
import {
  ILFInputGridInput,
  ILFInputsGrid,
} from '../../components/LoginForms/LFInputsGrid';
import { useNavigation } from '@react-navigation/native';
import { useFeaturedContent } from '../../context/ContextFeaturedContent';

export default function ScreenHomeFeaturedPlayer() {
  const { user } = useContextAuth();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScreenScrollViewRef>(null);

  // // // // // // // console.log('user:', user);
  // // // // // // // console.log('user.role:', user?.role);

  const [modalEditorIsOpened, set_modalEditorIsOpened] =
    useState<boolean>(false);

  const { featuredPlayer, refreshFeaturedPlayer } = useFeaturedContent();

  const theData = (): IFeaturedPlayer => {
    return featuredPlayer as IFeaturedPlayer;
  };

  // Reset scroll position when user navigates away from this screen
  // Also refresh featured player data IMMEDIATELY when leaving
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      // Immediately scroll to top when leaving the screen
      scrollViewRef.current?.scrollToTop(false);

      // Refresh featured player data IMMEDIATELY when leaving (no delay)
      refreshFeaturedPlayer();
    });

    return unsubscribeBlur;
  }, [navigation, refreshFeaturedPlayer]);

  return (
    <>
      <ScreenScrollView ref={scrollViewRef}>
        <ScreenHomeSubNavigation />

        <UIPanel>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: BasePaddingsMargins.formInputMarginLess,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name="ribbon"
                style={{
                  fontSize: TextsSizes.p,
                  color: BaseColors.primary,
                  marginRight: BasePaddingsMargins.m10,
                }}
              />
              <UIBadge label="Featured Player" type="primary-outline" />
            </View>
            {user !== null &&
            (user as ICAUserData).role === EUserRole.MasterAdministrator ? (
              <View
                style={{
                  width: 60,
                }}
              >
                <LFButton
                  icon="pencil"
                  size="small"
                  label="edit"
                  type="primary"
                  onPress={() => {
                    set_modalEditorIsOpened(true);
                  }}
                />
              </View>
            ) : null}
          </View>

          {featuredPlayer !== null ? (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  marginBottom: BasePaddingsMargins.formInputMarginLess,
                }}
              >
                <View
                  style={{
                    backgroundColor: BaseColors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    marginRight: BasePaddingsMargins.m20,
                    borderRadius: 40,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 30,
                      color: BaseColors.light,
                    }}
                  >
                    {theData().name.split(' ')[0].substring(0, 1)}
                    {theData().name.split(' ')[1] !== undefined
                      ? theData().name.split(' ')[1].substring(0, 1)
                      : null}
                  </Text>
                </View>
                <View>
                  <Text
                    style={[
                      StyleZ.h2,
                      {
                        // color: BaseColors.light,
                        marginBottom: 0,
                      },
                    ]}
                  >
                    {theData().name}
                  </Text>
                  <Text style={[StyleZ.p]}>
                    {theData().label_about_the_person ||
                      'Professional Pool Player'}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="location"
                      style={[
                        StyleZ.p,
                        {
                          marginRight: BasePaddingsMargins.m5,
                        },
                      ]}
                    />
                    <Text style={[StyleZ.p]}>
                      {theData().address || 'Location not specified'}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  marginBottom: BasePaddingsMargins.formInputMarginLess,
                }}
              >
                <Text
                  style={[
                    StyleZ.h4,
                    {
                      fontWeight: 'normal',
                    },
                  ]}
                >
                  {theData().description || 'No description available.'}
                </Text>
              </View>
              <View>
                <Text
                  style={[
                    StyleZ.h4,
                    {
                      marginBottom: BasePaddingsMargins.m10,
                    },
                  ]}
                >
                  Recent Achievements:
                </Text>
                {theData().achievements && theData().achievements.length > 0 ? (
                  theData().achievements.map(
                    (achievement: string, key: number) => {
                      return (
                        <View
                          key={`achievement-${key}`}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: BasePaddingsMargins.m10,
                          }}
                        >
                          <Ionicons
                            name="chevron-forward-circle"
                            style={[
                              {
                                color: BaseColors.primary,
                                fontSize: StyleZ.h5.fontSize,
                                marginRight: BasePaddingsMargins.m10,
                              },
                            ]}
                          />
                          <Text style={[StyleZ.h5]}>{achievement}</Text>
                        </View>
                      );
                    },
                  )
                ) : (
                  <Text style={[StyleZ.p, { fontStyle: 'italic' }]}>
                    No achievements listed.
                  </Text>
                )}
              </View>
            </>
          ) : null}
        </UIPanel>
      </ScreenScrollView>
      {user !== null &&
      (user as ICAUserData).role === EUserRole.MasterAdministrator ? (
        <ModalEditorContent
          // key={`modal-editor-for-`}
          F_isOpened={set_modalEditorIsOpened}
          isOpened={modalEditorIsOpened}
          type={ECustomContentType.ContentFeaturedPlayer}
          data_row={featuredPlayer as any}
          set_data_row={() => {}} // Disabled for now since we're using context
        />
      ) : null}
    </>
  );
}
