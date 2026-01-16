import { Text, View } from 'react-native';
import UIPanel from '../../components/UI/UIPanel';
import ScreenScrollView, { ScreenScrollViewRef } from '../ScreenScrollView';
import { StyleZ } from '../../assets/css/styles';
import ZAccordion from '../../components/UI/Accordion/ZAccordion';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { useEffect, useState, useRef } from 'react';
import ModalMoreFAQs from './ModalMoreFAQs';
import ScreenFAQsContact_Updated from './ScreenFAQsContact_Updated';
import { useNavigation } from '@react-navigation/native';

export default function ScreenFAQs() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScreenScrollViewRef>(null);
  const [modalMoreQuestionsView, set_modalMoreQuestionsView] =
    useState<boolean>(false);

  useEffect(() => {
    // // // // // // // // console.log('FAQ page render!');
  }, []);

  // Reset scroll position when user navigates away from this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Immediately scroll to top when leaving the screen
      scrollViewRef.current?.scrollToTop(false);
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <>
      <ScreenScrollView ref={scrollViewRef}>
        <UIPanel>
          <Text style={StyleZ.h3}>Common Questions</Text>

          <ZAccordion
            ACCORDION_ITEMS={[
              {
                title: `What is a Fargo rating?`,
                content: `Fargo is a rating system used in pool and billiards to measure player skill level. It provides a numerical rating based on your performance against other rated players. Higher numbers indicate better players.`,
              },
              {
                title: `How do I create an account?`,
                content: `Click on 'Profile' in the navigation menu, then select 'Sign Up' to create a new account. You'll need to provide a username and password.`,
              },
              {
                title: `What's the difference between open and restricted tournaments?`,
                content: `Open tournaments allow players of any skill level to participate. Restricted tournaments have a maximum Fargo rating limit, meaning only players below that rating can enter.`,
              },
            ]}
          />

          <View>
            <View>
              <LFButton
                type="outline-dark"
                label="View More Questions"
                onPress={() => {
                  set_modalMoreQuestionsView(true);
                }}
              />
            </View>
          </View>
        </UIPanel>

        <ScreenFAQsContact_Updated />
      </ScreenScrollView>

      <ModalMoreFAQs
        isOpened={modalMoreQuestionsView}
        F_isOpened={set_modalMoreQuestionsView}
      />
    </>
  );
}
