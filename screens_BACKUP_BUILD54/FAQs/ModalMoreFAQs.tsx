import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import UIModalCloseButton from '../../components/UI/UIModal/UIModalCloseButton';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import ZAccordion from '../../components/UI/Accordion/ZAccordion';
import LFButton from '../../components/LoginForms/Button/LFButton';

export default function ModalMoreFAQs({
  F_isOpened,
  isOpened,
}: {
  F_isOpened: (v: boolean) => void;
  isOpened: boolean;
}) {
  return (
    <Modal animationType="fade" transparent={true} visible={isOpened}>
      <View style={[StyleModal.container]}>
        <TouchableOpacity
          style={[StyleModal.backgroundTouchableForClosing]}
          onPress={() => {
            F_isOpened(false);
          }}
        />

        <View style={[StyleModal.containerForScrollingView]}>
          <ScrollView
            style={[
              StyleModal.scrollView,
              /*{
            maxHeight: '100%',
            // height: '50%',

            // backgroundColor: 'red'
          }*/
            ]}
          >
            <View style={[StyleModal.contentView]}>
              <UIModalCloseButton F_isOpened={F_isOpened} />

              <Text style={StyleZ.h3}>
                Additional Frequently Asked Questions
              </Text>

              <ZAccordion
                ACCORDION_ITEMS={[
                  {
                    title: 'How do I know if a tournament reports to Fargo?',
                    content: `Tournaments that report to Fargo will have a 'Fargo Rated' badge displayed on their tournament card. These tournaments will affect your official Fargo rating.`,
                  },
                  {
                    title: `What are recurring tournaments?`,
                    content: `Recurring tournaments happen on a regular schedule (like every Tuesday at 7 PM). These are usually weekly events at local venues and are great for regular practice and competition.`,
                  },
                  {
                    title: `How do I find tournaments near me?`,
                    content: `Use the search and filter options on the Billiards page to find tournaments by location, game type, or date. You can also view tournaments by category using the game type cards.`,
                  },
                  {
                    title: `What types of billiards games are supported?`,
                    content: `We support 8-ball, 9-ball, 10-ball, and their Scotch variants. Each game type has its own tournaments and rating categories.`,
                  },
                  {
                    title: `How do I favorite a tournament?`,
                    content: `Click the heart icon on any tournament card to add it to your favorites. You can view all your favorite tournaments in your Profile page.`,
                  },
                  {
                    title: `What should I do if I can't find a tournament in my area?`,
                    content: `If you don't see tournaments in your area, try expanding your search radius or check back regularly as new tournaments are added frequently. Local venues may also host tournaments that get added to the platform.`,
                  },
                  {
                    title: `How do tournament fees work?`,
                    content: `Tournament fees vary by event and are set by the tournament organizer. The entry fee and any side pot information will be clearly displayed on each tournament's details.`,
                  },
                ]}
              />

              <View>
                <View>
                  <LFButton
                    type="primary"
                    label="Go Back To Main Questions"
                    onPress={() => {
                      F_isOpened(false);
                    }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
