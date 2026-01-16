import { useNavigation, useRoute } from '@react-navigation/native';
import { Text, TouchableOpacity, View } from 'react-native';
import { BaseColors, BasePaddingsMargins, TextsSizes } from '../hooks/Template';
import { Ionicons } from '@expo/vector-icons';

export interface IContentSwitcherButtonDetails {
  title: string;
  route?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function ContentSwitcher({
  buttonsDetails,
}: {
  buttonsDetails: IContentSwitcherButtonDetails[];
}) {
  const navigation = useNavigation();
  const route = useRoute();

  // Calculate width based on actual number of buttons for proper sizing
  // For admin navigation (3-4 buttons), use fixed calculation for consistency
  // For profile navigation (2 buttons), use actual count for proper sizing
  const isAdminContext = buttonsDetails.some(
    (btn) =>
      btn.route?.includes('Admin') ||
      [
        'AdminUsers',
        'AdminApproved',
        'AdminMessages',
        'AdminVenues',
        'AdminTournaments',
      ].includes(btn.route || ''),
  );

  const buttonWidthPercent = isAdminContext
    ? 100 / buttonsDetails.length // Dynamic width for admin tabs (now supports 4 tabs: Users, Venues, Tournaments, Messages)
    : 100 / buttonsDetails.length; // Dynamic width for other contexts

  const buttonWidth = `${buttonWidthPercent}%` as const;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        flexWrap: 'nowrap',
        backgroundColor: BaseColors.contentSwitcherBackgroundCOlor,
        borderRadius: 5,
        padding: 3,
        marginBottom: BasePaddingsMargins.sectionMarginBottom,
        height: 50, // Fixed height
        width: '100%', // Fixed width
      }}
    >
      {buttonsDetails.map((obj: IContentSwitcherButtonDetails, key: number) => {
        const isActive = obj.route === route.name;

        return (
          <TouchableOpacity
            key={`navigation-item-${key}`}
            style={{
              backgroundColor: isActive
                ? BaseColors.primary
                : BaseColors.contentSwitcherBackgroundCOlor,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 4,
              width: buttonWidth,
              height: 44, // Fixed height for each button
              marginBottom: 0,
              flex: 0, // Prevent flex growth
              flexShrink: 0, // Prevent flex shrink
            }}
            activeOpacity={1}
            onPress={() => {
              if (obj.route !== undefined) {
                (navigation as any).navigate(obj.route, {});
              }
            }}
          >
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {obj.icon !== undefined ? (
                <Ionicons name={obj.icon} size={15} color={BaseColors.light} />
              ) : null}

              <Text
                style={{
                  width: '100%',
                  textAlign: 'center',
                  color: BaseColors.light,
                  fontSize: TextsSizes.small,
                  fontFamily:
                    "BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                }}
              >
                {obj.title}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
