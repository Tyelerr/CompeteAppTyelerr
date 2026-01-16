import { Text, View } from 'react-native';
import UIPanel from '../../components/UI/UIPanel';
import ScreenScrollView from '../ScreenScrollView';
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
  IFeaturedBar,
} from '../../hooks/InterfacesGlobal';
import ModalEditorContent from './ModalEditorContent';
import { useEffect, useState } from 'react';
import {
  ILFInputGridInput,
  ILFInputsGrid,
} from '../../components/LoginForms/LFInputsGrid';
import { useNavigation } from '@react-navigation/native';
import { useFeaturedContent } from '../../context/ContextFeaturedContent';

export default function ScreenHomeFeaturedBar() {
  const { user } = useContextAuth();
  const navigation = useNavigation();

  // // // // // // // console.log('user:', user);
  // // // // // // // console.log('user.role:', user?.role);

  const [modalEditorIsOpened, set_modalEditorIsOpened] =
    useState<boolean>(false);

  const { featuredBar, refreshFeaturedBar } = useFeaturedContent();

  const theData = (): IFeaturedBar => {
    return featuredBar as IFeaturedBar;
  };

  // Refresh featured bar data IMMEDIATELY when user leaves this screen
  // This way when they return, new data is already ready
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Refresh featured bar data IMMEDIATELY when leaving (no delay)
      refreshFeaturedBar();
    });

    return unsubscribe;
  }, [navigation, refreshFeaturedBar]);

  return (
    <>
      <ScreenScrollView>
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
              <UIBadge label="Featured Bar" type="primary-outline" />
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

          {featuredBar !== null ? (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  marginBottom: BasePaddingsMargins.formInputMarginLess,
                }}
              >
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
                      {theData().address || 'Address not specified'}
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
              <View
                style={{
                  marginBottom: BasePaddingsMargins.formInputMarginLess,
                }}
              >
                <Text
                  style={[
                    StyleZ.h4,
                    {
                      marginBottom: BasePaddingsMargins.m10,
                    },
                  ]}
                >
                  Highlights:
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                  }}
                >
                  {theData().highlights && theData().highlights.length > 0 ? (
                    theData().highlights.map(
                      (highlight: string, key: number) => {
                        return (
                          <View
                            key={`highlight-${key}`}
                            style={{
                              marginBottom: BasePaddingsMargins.m5,
                              marginRight: BasePaddingsMargins.m5,
                            }}
                          >
                            <UIBadge type="secondary" label={highlight} />
                          </View>
                        );
                      },
                    )
                  ) : (
                    <Text style={[StyleZ.p, { fontStyle: 'italic' }]}>
                      No highlights listed.
                    </Text>
                  )}
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                }}
              >
                <Text
                  style={[
                    StyleZ.p,
                    {
                      fontSize: StyleZ.h3.fontSize,
                      marginRight: BasePaddingsMargins.m5,
                    },
                  ]}
                >
                  Contact:{' '}
                </Text>
                <Text
                  style={[
                    StyleZ.p,
                    {
                      fontSize: StyleZ.h3.fontSize,
                    },
                  ]}
                >
                  {theData().phone_number || 'Phone not available'}
                </Text>
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
          type={ECustomContentType.ContentFeaturedBar}
          data_row={featuredBar as any}
          set_data_row={() => {}} // Disabled for now since we're using context
        />
      ) : null}
    </>
  );
}
