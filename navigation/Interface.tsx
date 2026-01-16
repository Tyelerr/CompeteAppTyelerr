export type TRootStackParamList = {
  Home: undefined; // Home screen takes no params directly, but it's part of the stack
  Billiards: undefined;
  Profile: undefined;
  FAQ: undefined;
  Details: { itemId: number; otherParam: string };
};

export type TRootTabParamList = {
  HomeTab: undefined; // HomeTab is the name of the tab itself
  BilliardsTab: undefined;
  ProfileTab: undefined;
  FAQTab: undefined;
  AdminTab: undefined;
  BarOwnerTab: undefined;
  ProfileLoggedTab: undefined;
  SubmitTab: undefined;
  ShopTab: undefined;
  // SettingsTab: undefined;
};

export interface ICustomHeaderTitleProps {
  title: string;
  subtitle?: string; // Subtitle is optional
  textColor?: string; // Optional custom text color for the title/subtitle
}
