import { ILFInputGridInput } from '../components/LoginForms/LFInputsGrid';

export enum EIGameTypes {
  Ball8 = '8-Ball',
  Ball9 = '9-Ball',
  Ball10 = '10-Ball',
  OnePocket = 'One Pocket',
  StraightPool = 'Straight Pool',
  BankPool = 'Bank Pool',
}
export const GameTypes = [
  { label: '8-Ball', value: EIGameTypes.Ball8 as string },
  { label: '9-Ball', value: EIGameTypes.Ball9 as string },
  { label: '10-Ball', value: EIGameTypes.Ball10 as string },
  { label: 'One Pocket', value: EIGameTypes.OnePocket as string },
  { label: 'Straight Pool', value: EIGameTypes.StraightPool as string },
  { label: 'Bank Pool', value: EIGameTypes.BankPool as string },
];

export enum ETournamentFormat {
  SingleElimination = 'Single Elimination',
  DoubleElimination = 'Double Elimination',
  RoundRobin = 'Round Robin',
  DoubleRoundRobin = 'Double Round Robin',
  SwissSystem = 'Swiss System',
  ChipTournament = 'Chip Tournament',
}
export const TournametFormats = [
  { label: 'Single Elimination', value: ETournamentFormat.SingleElimination },
  { label: 'Double Elimination', value: ETournamentFormat.DoubleElimination },
  { label: 'Round Robin', value: ETournamentFormat.RoundRobin },
  { label: 'Double Round Robin', value: ETournamentFormat.DoubleRoundRobin },
  { label: 'Swiss System', value: ETournamentFormat.SwissSystem },
  { label: 'Chip Tournament', value: ETournamentFormat.ChipTournament },
];

export interface IAlert {
  // Identity
  id: string;
  user_id: string;

  // Alert identification
  alert_name?: string; // User-friendly name for this alert

  // Filter columns (nullable = user did not set it)
  // These mirror fields from the tournaments table
  game_type?: string;
  format?: string;
  equipment?: string;
  reports_to_fargo?: boolean;

  // Entry fee filter
  max_entry_fee?: number; // Maximum entry fee cap (match if tournaments.tournament_fee <= this value)

  // Fargo rating filters (min and max range)
  min_fargo?: number; // Minimum Fargo (match if tournaments.max_fargo >= this value)
  max_fargo?: number; // Maximum Fargo cap (match if tournaments.max_fargo <= this value)
  required_fargo_games?: number; // Required Fargo games (match if tournaments.required_fargo_games >= this value)

  // Other tournament filters
  table_size?: string;
  is_open_tournament?: boolean;

  // Location filters
  city?: string; // Parsed city from tournament location
  state?: string; // Parsed state from tournament location
  location_text?: string; // Free-text location search (matches against tournaments.address OR tournaments.venue using ILIKE)

  // Date range filters
  date_from?: string; // Start of date range (match if tournaments.start_date >= this)
  date_to?: string; // End of date range (match if tournaments.start_date <= this)

  // Control
  is_enabled: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Legacy fields (kept for backward compatibility during migration)
  // TODO: Remove these after full migration to new schema
  creator_id?: string;
  name?: string;
  preffered_game?: string;
  tournament_format?: string;
  fargo_range_from?: number;
  fargo_range_to?: number;
  location?: string;
  checked_open_tournament?: boolean;
  maximum_fargo?: number;
}

export enum ETournamentStatuses {
  Approved = 'approved',
  Pending = 'pending',
  Deleted = 'deleted',
  FargoRated = 'fargo-rated',
  OpenTournament = 'open-tournament',
}
export const TournamentStatusesForDropdown = [
  { label: 'Approved', value: ETournamentStatuses.Approved },
  { label: 'Pending', value: ETournamentStatuses.Pending },
  { label: 'Deleted', value: ETournamentStatuses.Deleted },
  { label: 'Fargo Rated', value: ETournamentStatuses.FargoRated },
  { label: 'Open Tournament', value: ETournamentStatuses.OpenTournament },
];

export interface ITournament {
  id?: string;
  id_unique_number: number;
  /**
   * parent_recurring_tournament_id is id that will
   * point to the parent tournament by who the cron job in supabase created the tournaments
   */
  parent_recurring_tournament_id: number;
  uuid: string;
  tournament_name: string;
  game_type: string;
  format: string;
  director_name: string;
  description: string;
  equipment: string;
  custom_equipment: string;
  game_spot: string;
  venue: string;
  venue_lat: string;
  venue_lng: string;
  address: string;
  phone: string;

  // Location fields for state/city/zip filtering
  city?: string;
  state?: string;
  zip_code?: string;

  // when thumbnail type is '' use thumbnail_url if not use the custom images
  thumbnail_type: string;
  thumbnail_url: string;
  start_date: string;
  strart_time: string;
  is_recurring: boolean;
  reports_to_fargo: boolean;
  is_open_tournament: boolean;
  race_details: string;
  number_of_tables: number;
  table_size: ETableSizes;
  max_fargo: number;
  tournament_fee: number;
  created_at?: string;
  updated_at?: string;
  side_pots: ILFInputGridInput[][];
  chip_allocations: ILFInputGridInput[][];
  status: ETournamentStatuses;

  // Required Fargo Games fields
  required_fargo_games?: number | null;
  has_required_fargo_games?: boolean;

  // Green Fee fields
  green_fee?: number | null;
  has_green_fee?: boolean;

  // Recurring tournament fields
  recurring_series_id?: string | null;
  is_recurring_master?: boolean;

  // profiles hold the data for the user that created the tournament
  profiles: ICAUserData;

  // venues hold the venue for the tournament, will be null if not id attached to the tournament
  venues: IVenue;

  // POINT(lat lng)
  point_location: string;

  deleted_at: string;
  venue_id: number;
}

export interface ILikedTournament {
  likeid: number;
  tournamentobject: ITournament;
}

export enum ETableSizes {
  TableSize_7ft = '7ft',
  TableSize_8ft = '8ft',
  TableSize_9ft = '9ft',
  TableSize_10ft = '10ft',
  TableSize_12x6 = '12x6',
  Custom = 'custom',
}
export const ItemsTableSizes: { label: string; value: string }[] = [
  { label: '7ft', value: ETableSizes.TableSize_7ft },
  { label: '8ft', value: ETableSizes.TableSize_8ft },
  { label: '9ft', value: ETableSizes.TableSize_9ft },
  { label: '10ft', value: ETableSizes.TableSize_10ft },
  { label: '12x6', value: ETableSizes.TableSize_12x6 },
  { label: 'Custom Size', value: ETableSizes.Custom },
];

export enum ETournamentTimeDeleted {
  AllTime = '',
  Last7Days = 'last-7-days',
  Last30Days = 'last-30-days',
}

export interface IAnalytics {
  active_events: number;
  my_directors: number;
  my_tournaments: number;
  pending_approval: number;
}

export interface IAnalyticsEventsRow {
  tournament_type: string;
  tournament_count: number;
}

export interface ITournamentFilters {
  search?: string;

  game_type?: string;
  equipment?: string;
  equipment_custom?: string;

  daysOfWeek?: number[];

  entryFeeFrom?: number;
  entryFeeTo?: number;

  fargoRatingFrom?: number;
  fargoRatingTo?: number;

  minimun_required_fargo_games_10plus?: boolean;
  handicapped?: boolean;
  reports_to_fargo?: boolean;
  is_open_tournament?: boolean;

  // Location filtering - keep existing for backward compatibility
  venue?: string;
  lat?: string;
  lng?: string;
  radius?: number;

  // New state/city/zip filtering
  state?: string;
  city?: string;
  zip_code?: string;

  format?: string;

  table_size?: string;

  // Date range filtering
  dateFrom?: string;
  dateTo?: string;

  filtersFromModalAreAplied?: boolean;

  // Timestamp for tracking filter changes and forcing re-renders
  _timestamp?: number;

  // User role for admin access (to bypass restrictive filters)
  userRole?: EUserRole;
}

export interface IVenueTable {
  id?: number;
  venue_id?: number;
  table_size: ETableSizes;
  table_brand?: string;
  count: number | undefined;
  created_at?: string;
  updated_at?: string;
}

export interface IVenue {
  id: number;
  venue: string;
  address: string;
  venue_lat: string;
  venue_lng: string;
  point_location: string;
  profile_id: number;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  state?: string;
  zip_code?: string;
  tables?: IVenueTable[];
}

export enum ETableBrands {
  Diamond = 'Diamond',
  Brunswick = 'Brunswick',
  Olhausen = 'Olhausen',
  Connelly = 'Connelly',
  Imperial = 'Imperial',
  Valley = 'Valley',
  Aramith = 'Aramith',
  GabrielCarom = 'Gabriel Carom',
  Other = 'Other',
}

export const TableBrands: { label: string; value: string }[] = [
  { label: 'Diamond', value: ETableBrands.Diamond },
  { label: 'Brunswick', value: ETableBrands.Brunswick },
  { label: 'Olhausen', value: ETableBrands.Olhausen },
  { label: 'Connelly', value: ETableBrands.Connelly },
  { label: 'Imperial', value: ETableBrands.Imperial },
  { label: 'Valley', value: ETableBrands.Valley },
  { label: 'Aramith', value: ETableBrands.Aramith },
  { label: 'Gabriel Carom', value: ETableBrands.GabrielCarom },
  { label: 'Other', value: ETableBrands.Other },
];

export const TimeItems: { label: string; value: string }[] = [];
const TimeItemsDate = new Date();
TimeItemsDate.setHours(9, 0);
for (let i = 0; i < 25; i++) {
  TimeItemsDate.setMinutes(TimeItemsDate.getMinutes() + 30);
  const TimeItemDateValue: string = `${
    TimeItemsDate.getHours() < 10
      ? `0${TimeItemsDate.getHours()}`
      : TimeItemsDate.getHours()
  }:${
    TimeItemsDate.getMinutes() < 10
      ? `0${TimeItemsDate.getMinutes()}`
      : TimeItemsDate.getMinutes()
  }`;
  const LabelForTheTime: string = `${(TimeItemsDate.getHours() <= 12
    ? TimeItemsDate.getHours()
    : TimeItemsDate.getHours() - 12
  ).toString()}:${
    TimeItemsDate.getMinutes() < 10
      ? `0${TimeItemsDate.getMinutes()}`
      : TimeItemsDate.getMinutes()
  }`;
  TimeItems.push({
    label: `${
      TimeItemDateValue === '12:00'
        ? `${LabelForTheTime}${
            TimeItemsDate.getHours() < 12 ? 'AM' : 'PM'
          } (Noon)`
        : `${LabelForTheTime}${TimeItemsDate.getHours() < 12 ? 'AM' : 'PM'}`
    }`,
    value: TimeItemDateValue,
  });
}

export enum EUserStatus {
  StatusActive = 'active',
  StatusDeleted = 'deleted',
}

export interface ICAUserData {
  id: string;
  created_at: string;
  created_at_formatted: string;
  user_name: string;
  email: string;
  name: string;
  preferred_game: string;
  skill_level: string;
  zip_code: string;
  home_city?: string;
  home_state?: string;
  favorite_player: string;
  favorite_game: string;
  role: EUserRole;
  status: EUserStatus;
  profile_image_url: string;
  id_auto: number;
}

export enum EUserRole {
  BasicUser = 'basic',
  CompeteAdmin = 'compete-admin',
  BarAdmin = 'bar-admin',
  TournamentDirector = 'tournament-director',
  MasterAdministrator = 'master-administrator',
}

export const UserRoles = [
  { label: 'Basic User', value: EUserRole.BasicUser },
  { label: 'Compete Admin', value: EUserRole.CompeteAdmin },
  { label: 'Bar Admin', value: EUserRole.BarAdmin },
  { label: 'Tournament Director', value: EUserRole.TournamentDirector },
  { label: 'Master Administrator', value: EUserRole.MasterAdministrator },
];

export enum ECustomContentType {
  ContentFeaturedPlayer = 'featured-player',
  ContentFeaturedBar = 'featured-bar',
  ContentRewards = 'rewards',
  ContentReward = 'reward',
}
export enum EActivityType {
  EnterInGift = 'enter-in-gift',
}

export interface ICustomContent {
  id: number;
  created_at: string;
  name: string;
  label_about_the_person: string;
  address: string;
  description: string;
  list: ILFInputGridInput[][];
  labels: ILFInputGridInput[][];
  phone_number: string;
  type: ECustomContentType;
  reward_picture: string;
  reward_link: string;

  value: number;
  features: string;
  giveawy_rules: string;
  subtitle: string;
  date_ends: string; // timestamp

  entries: number;

  // NEW: link back to the tournament that created this giveaway (optional)
  tournament_id_unique_number?: number | null;

  // for the gifts we have additional columns
  count_total_entries: number; // how many unique users entered the gift
  logged_user_have_entered: boolean; // if logged user entered the gift
}

export const enum EPermissionType {
  AccessToBarVenues = 'access-to-bar-venues',
}
export interface IPermissions {
  id: number;
  created_at: string;
  id_user_need_permission: number;
  id_user_give_permission: number;
  permission_type: EPermissionType;
}

export enum ESupportMessageType {
  GeneralQuestion = 'General Question',
  TournamentInquiry = 'Tournament Inquiry',
  TechnicalSupport = 'Technical Support',
  AccountIssue = 'Account Issue',
  FeedbackSuggestion = 'Feedback / Suggestion',
}

export enum ESupportMessageStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Resolved = 'resolved',
}

export interface ISupportMessage {
  id: number;
  created_at: string;
  updated_at: string;

  // User information
  user_id: string;
  user_email: string;
  user_name?: string;

  // Message details
  message_type: ESupportMessageType;
  message_content: string;
  tournament_id?: string;

  // Status tracking
  status: ESupportMessageStatus;
  is_read: boolean;

  // Admin response
  admin_response?: string;
  admin_user_id?: string;
  responded_at?: string;

  // Optional user profile data for display
  profiles?: ICAUserData;
}

export const SupportMessageTypes = [
  { label: 'General Question', value: ESupportMessageType.GeneralQuestion },
  { label: 'Tournament Inquiry', value: ESupportMessageType.TournamentInquiry },
  { label: 'Technical Support', value: ESupportMessageType.TechnicalSupport },
  { label: 'Account Issue', value: ESupportMessageType.AccountIssue },
  {
    label: 'Feedback / Suggestion',
    value: ESupportMessageType.FeedbackSuggestion,
  },
];

export const SupportMessageStatuses = [
  { label: 'Pending', value: ESupportMessageStatus.Pending },
  { label: 'In Progress', value: ESupportMessageStatus.InProgress },
  { label: 'Resolved', value: ESupportMessageStatus.Resolved },
];

// Featured Player and Bar interfaces for random selection
export interface IFeaturedPlayer {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  label_about_the_person?: string;
  address?: string;
  description?: string;
  phone_number?: string;
  achievements: string[]; // JSON array of achievement strings
  is_active: boolean;
  last_featured_date?: string;
  featured_count: number;
  selection_weight: number;
  created_by?: string;
  updated_by?: string;
}

export interface IFeaturedBar {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  address?: string;
  description?: string;
  phone_number?: string;
  highlights: string[]; // JSON array of highlight strings
  website?: string;
  hours_of_operation?: string;
  special_features?: string;
  is_active: boolean;
  last_featured_date?: string;
  featured_count: number;
  selection_weight: number;
  created_by?: string;
  updated_by?: string;
}
