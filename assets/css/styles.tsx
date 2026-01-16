import { StyleSheet } from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';

export const StyleZ = StyleSheet.create({
  colors: {
    backgroundColor: BaseColors.backgroundColor,
    color: BaseColors.othertexts,
  },

  test: {
    backgroundColor: 'red',
  },
  testText: {
    color: 'yellow',
  },

  hr: {
    borderBottomColor: BaseColors.secondary,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
  },

  headerTitleStyle: {
    fontWeight: 700,
    fontSize: 25,
    color: BaseColors.title,
  },
  headerSubtitleStyle: {
    fontSize: 16,
    color: BaseColors.othertexts,
  },
  h1: {},
  h2: {
    fontSize: TextsSizes.h2,
    color: BaseColors.light,
    fontWeight: 'bold',
    marginBottom: BasePaddingsMargins.m15,
  },
  h3: {
    fontSize: TextsSizes.h3,
    color: BaseColors.light,
    fontWeight: 'bold',
    marginBottom: BasePaddingsMargins.m15,
  },
  h4: {
    fontSize: TextsSizes.h4,
    fontWeight: '600',
    color: BaseColors.light,
  },
  h5: {
    fontSize: TextsSizes.h5,
    fontWeight: '600',
    color: BaseColors.light,
  },
  p: {
    fontSize: TextsSizes.p,
    lineHeight: 1.3 * TextsSizes.p,
    color: BaseColors.othertexts,
  },

  contentSwitcherButton: {
    color: BaseColors.light,
    backgroundColor: BaseColors.contentSwitcherBackgroundCOlor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: 12,
    paddingBlock: 6,
    borderRadius: 4,
    fontSize: 12,
  },
  contentSwitcherButtonActive: {
    backgroundColor: BaseColors.primary,
    color: BaseColors.light,
  },

  tabBarIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingInline: 10,
    paddingBlock: 5,
    marginBottom: 0,
    borderRadius: 10,
    width: 40,
  },

  loginFormHeading: {
    width: '100%',
    marginBottom: BasePaddingsMargins.sectionMarginBottom,
  },
  loginFromContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loginForm: {
    backgroundColor: BaseColors.dark,
    width: '100%',
    maxWidth: 320,
    padding: BasePaddingsMargins.m15,
  },
  loginForm_submitTournament: {
    backgroundColor: BaseColors.dark,
    width: '100%',
    maxWidth: 362, // 13% increase from 320 (320 * 1.13 = 361.6, rounded to 362)
    padding: BasePaddingsMargins.m15,
  },
  loginFormInput: {
    color: BaseColors.othertexts,
    borderStyle: 'solid',
    borderRadius: 5,
    borderColor: BaseColors.othertexts,
    borderWidth: 1,
    width: '100%',
    height: 50, // Fixed height to prevent growing
    paddingBlock: BasePaddingsMargins.m10,
    paddingHorizontal: 15,
    fontSize: TextsSizes.p,
  },
  loginFormInput_Textarea: {
    minHeight: 120,
    height: 120,
    paddingTop: 15,
  },

  loginFormInputHolder: {
    width: '100%',
    marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
  },
  loginFormInputHolder_onlyRead: {
    pointerEvents: 'none',
  },
  loginFormInput_onlyRead: {
    backgroundColor: BaseColors.secondary,
    borderWidth: 0,
  },

  loginFormInputLabel: {
    color: BaseColors.othertexts,
    width: '100%',
    display: 'flex',
    marginBottom: 5,
  },

  LFButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  LFBUtton: {
    backgroundColor: 'silver',
    fontSize: 15,
    display: 'flex',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 5,
    justifyContent: 'center',
    flexDirection: 'row',
    textAlign: 'center',
    minHeight: 48,
  },
  LFBUtton_Small: {
    fontSize: 15,
    paddingHorizontal: 3,
    paddingVertical: 10,
  },
  LFBUtton_Compact: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  LFBUtton_Bigger: {
    fontSize: TextsSizes.h1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  /// Different styles start
  LFButtonPrimary: {
    color: BaseColors.light,
    backgroundColor: BaseColors.primary,
  },
  LFButtonPrimaryPressed: {
    backgroundColor: BaseColors.primaryPressed,
  },
  LFButtonOutlineDark: {
    color: BaseColors.light,
    backgroundColor: BaseColors.dark,
    borderWidth: 1,
    borderColor: BaseColors.PanelBorderColor,
    borderStyle: 'solid',
  },
  LFButtonOutlineDarkPressed: {
    backgroundColor: BaseColors.PanelBorderColor,
  },
  LFButtonDanger: {
    backgroundColor: BaseColors.danger,
    color: BaseColors.light,
  },
  LFButtonDangerPressed: {
    backgroundColor: BaseColors.dangerPressed,
  },
  LFButtonDark: {
    color: BaseColors.light,
    backgroundColor: BaseColors.dark,
  },
  LFButtonSecondary: {
    color: BaseColors.light,
    backgroundColor: BaseColors.secondary,
  },

  // ✅ Success (green) button + pressed variant
  LFButtonSuccess: {
    color: BaseColors.light,
    backgroundColor: BaseColors.success,
  },
  LFButtonSuccessPressed: {
    backgroundColor: '#15803d', // darker green for press feedback
  },
  /// Different styles end

  LFForgotPasswordLink_Container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: BasePaddingsMargins.m15,
  },
  LFForgotPasswordLink: {
    color: BaseColors.light,
    fontWeight: 'bold',
    fontSize: TextsSizes.p,
    paddingVertical: BasePaddingsMargins.m5,
    paddingHorizontal: BasePaddingsMargins.m15,
    borderRadius: 6,
    borderWidth: 0,
    backgroundColor: BaseColors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    minHeight: 36,
    maxWidth: 200,
    alignSelf: 'center',
    lineHeight: 36,
    includeFontPadding: false,
  },
  LFForgotPasswordLink_Pressed: {
    backgroundColor: BaseColors.primaryPressed,
    color: BaseColors.light,
  },
  LFForgotPasswordLink_Enhanced: {
    shadowColor: BaseColors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  LFForgotPasswordLink_Danger: {
    backgroundColor: BaseColors.danger,
    color: BaseColors.light,
  },
  LFForgotPasswordLink_DangerPressed: {
    backgroundColor: BaseColors.dangerPressed,
    color: BaseColors.light,
  },
  LFErrorMessage: {
    color: '#DC3545',
    display: 'flex',
    paddingTop: 5,
    width: '100%',
  },
  LFErrorMessage_addon_centered: {
    justifyContent: 'center',
    textAlign: 'center',
    flexWrap: 'wrap',
    marginBottom: BasePaddingsMargins.sectionMarginBottom,
    maxWidth: 250,
  },
  // Pagination (Billiards tournaments)
  pageArrow: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    marginLeft: 6,
  },
  pageArrowDisabled: {
    opacity: 0.3,
  },
  pageText: {
    color: '#E5E7EB',
    fontSize: 14,
    marginHorizontal: 8,
  },
});

export const StylePanel = StyleSheet.create({
  defaultStyle: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BaseColors.PanelBorderColor,
    padding: BasePaddingsMargins.m20,
    marginBottom: BasePaddingsMargins.m30,
  },
  ForCalendar: {
    padding: BasePaddingsMargins.m10,
    marginBottom: 0,
  },
});

export const StyleBadge = StyleSheet.create({
  defaultStyle: {
    backgroundColor: BaseColors.dark,
    borderStyle: 'solid',
    borderColor: BaseColors.secondary,
    borderWidth: 1,
    borderRadius: 15,
    paddingInline: 20,
    paddingBlock: 5,
    display: 'flex',
    justifyContent: 'center',
    width: 'auto',
  },

  sizeSmall: {
    paddingInline: 8,
    fontSize: TextsSizes.small,
  },

  defaultTextStyle: {
    fontSize: TextsSizes.p,
    color: BaseColors.light,
    textAlign: 'center',
    width: '100%',
  },
  secondary: {
    backgroundColor: BaseColors.secondary,
    borderColor: BaseColors.secondary,
  },
  primary: {
    backgroundColor: BaseColors.primary,
    borderColor: BaseColors.primary,
  },
  secondaryText: {
    color: BaseColors.light,
  },
  primaryText: {
    color: BaseColors.light,
  },
  primaryOutline: {
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: BaseColors.primary,
  },
  primaryOutlineText: {
    color: BaseColors.primary,
  },
});

export const StyleModal = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,.7)',
    width: '100%',
  },
  containerForScrollingView: {
    maxHeight: '80%',
    width: '90%',
    maxWidth: 600, // Limit max width for larger screens
    backgroundColor: BaseColors.dark,
    position: 'relative',
    borderRadius: BasePaddingsMargins.m15,
  },
  // New fixed layout styles
  containerForFixedLayout: {
    height: '80%',
    width: '90%',
    maxWidth: 600,
    backgroundColor: BaseColors.dark,
    position: 'relative',
    borderRadius: BasePaddingsMargins.m15,
    flexDirection: 'column',
  },
  fixedHeader: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 15,
    borderTopLeftRadius: BasePaddingsMargins.m15,
    borderTopRightRadius: BasePaddingsMargins.m15,
    backgroundColor: BaseColors.dark,
    zIndex: 1000,
    minHeight: 60,
    position: 'relative',
    overflow: 'hidden',
    elevation: 5,
  },
  fixedFooter: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 25,
    borderBottomLeftRadius: BasePaddingsMargins.m15,
    borderBottomRightRadius: BasePaddingsMargins.m15,
    backgroundColor: BaseColors.dark,
    zIndex: 1000,
    minHeight: 80,
  },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 16,
    minHeight: 400,
  },
  scrollView: {
    paddingInline: 16,
    height: '100%',
    maxHeight: '100%',
  },
  headingContainer: {
    marginBottom: BasePaddingsMargins.m20,
  },
  heading: {
    fontSize: TextsSizes.h3,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'left',
    color: BaseColors.light,
  },
  contentView: {
    width: '100%',
    paddingBlock: 25,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 16,
    top: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
  },
  // Close button for fixed header
  closeButtonFixed: {
    position: 'absolute',
    right: 16,
    top: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    elevation: 10000,
  },

  ModalInfoMessageContainer: {
    width: 250,
    backgroundColor: BaseColors.dark,
    padding: BasePaddingsMargins.m15,
    borderWidth: 1,
    borderColor: BaseColors.secondary,
    borderStyle: 'solid',
    borderRadius: 5,
  },

  backgroundTouchableForClosing: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    zIndex: -1,
  },
});

export const StyleZTable = StyleSheet.create({
  container: {},
  header: {},
  headerTexts: {
    color: BaseColors.othertexts,
    fontSize: TextsSizes.p,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  cell: {
    paddingInline: 7,
    paddingBlock: 7,
  },
  cellFirst: {
    paddingLeft: 0,
  },
  cellLast: {
    paddingRight: 0,
  },
  cellCentered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const StyleGoogle = StyleSheet.create({
  searchVenue_Container: {
    marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
  },
  searchVenue_ScrollView: {},
  searchVenue_ItemContainer: {
    backgroundColor: BaseColors.secondary,
    marginBottom: BasePaddingsMargins.m10,
    paddingBlock: BasePaddingsMargins.m5,
    paddingInline: BasePaddingsMargins.m15,
    borderRadius: BasePaddingsMargins.m10,
  },
  searchVenue_ItemText: {
    color: BaseColors.light,
    fontSize: TextsSizes.p,
  },
});

export const StyleTournamentsAdmin = StyleSheet.create({
  p: {
    color: BaseColors.othertexts,
    fontSize: TextsSizes.p,
    marginBottom: BasePaddingsMargins.m5,
  },
  title: {
    color: BaseColors.light,
    fontSize: TextsSizes.h4,
    fontWeight: 'bold',
    marginBlock: BasePaddingsMargins.m15,
  },
  titleV2: {
    marginTop: 0,
  },
  image: {
    borderRadius: 10,
    width: '100%',
    height: 200,
    backgroundColor: BaseColors.secondary,
  },
  imageSmall: {
    height: 100,
  },
  badgesHolder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeHolder: {
    marginRight: BasePaddingsMargins.m10,
    marginBottom: BasePaddingsMargins.m15,
  },
});

export const StyleTournamentAnalytics = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cellTrophy: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: BasePaddingsMargins.m5,
  },
  cellTexts: {},
  n: {
    color: BaseColors.light,
    fontSize: TextsSizes.h1,
    fontWeight: 'bold',
  },
  p: {
    color: BaseColors.othertexts,
    fontSize: TextsSizes.p,
  },
  icon: {
    color: BaseColors.light,
    fontSize: TextsSizes.h1,
  },

  TitleAnalyiticsBig: {
    fontSize: TextsSizes.h3,
    color: BaseColors.light,
    fontWeight: 'bold',
    marginBottom: BasePaddingsMargins.formInputMarginLess,
  },

  ItemTexts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: BasePaddingsMargins.formInputMarginLess,
  },
  ItemTexts_Cell1: {
    width: '65%',
  },
  ItemTexts_Cell2: {
    width: '33%',
  },
  ItemTexts_Title: {
    color: BaseColors.light,
    fontSize: TextsSizes.p,
    fontWeight: 'bold',
  },
  ItemTexts_Value: {
    color: BaseColors.light,
    fontSize: TextsSizes.h4,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});

export const StyleProgress = StyleSheet.create({
  container: {
    backgroundColor: BaseColors.secondary,
    position: 'relative',
    height: BasePaddingsMargins.m10,
    borderRadius: 0.5 * BasePaddingsMargins.m10,
  },
  progress: {
    backgroundColor: BaseColors.primary,
    left: 0,
    top: 0,
    width: '0%',
    height: BasePaddingsMargins.m10,
    borderRadius: 0.5 * BasePaddingsMargins.m10,
  },
});

export const StyleSlider = StyleSheet.create({
  container_main: {
    marginBottom: BasePaddingsMargins.formInputMarginLess,
  },
  titleContainer: {
    marginBottom: BasePaddingsMargins.m10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: TextsSizes.p,
    color: BaseColors.light,
    fontWeight: 'bold',
  },
  singleValue: {
    fontSize: TextsSizes.p,
    color: BaseColors.light,
    fontWeight: 'bold',
  },
  footer_measures: {
    marginTop: BasePaddingsMargins.m5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer_measures_text: {
    color: BaseColors.othertexts,
    fontSize: TextsSizes.small,
  },
});

export const StyleThumbnailSelector = StyleSheet.create({
  thumb: {
    position: 'relative',
    width: 136,
    height: 136,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: BaseColors.othertexts,
    borderStyle: 'solid',
    backgroundColor: BaseColors.secondary,
    borderRadius: 10,
    marginBottom: BasePaddingsMargins.m10,
    marginRight: BasePaddingsMargins.m10,
  },
  thumb_submitTournament: {
    position: 'relative',
    width: 154, // 13% increase from 136 (136 * 1.13 = 153.68, rounded to 154)
    height: 154, // Keep it square
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: BaseColors.othertexts,
    borderStyle: 'solid',
    backgroundColor: BaseColors.secondary,
    borderRadius: 10,
    marginBottom: BasePaddingsMargins.m10,
    marginRight: BasePaddingsMargins.m10,
  },
  thumb_file: {
    borderStyle: 'dotted',
  },
  thumb_active: {
    borderColor: BaseColors.primary,
    borderWidth: 4,
  },
  image: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
});
