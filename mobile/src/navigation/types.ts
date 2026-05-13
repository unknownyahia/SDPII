import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ExploreCategoryId } from '../constants/categories';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ExploreLaunchChipId = ExploreCategoryId;

export type ExploreRouteParams = {
  query?: string;
  where?: string;
  chipId?: ExploreLaunchChipId;
  focusSearch?: boolean;
  focusPostId?: string;
  focusLatitude?: number;
  focusLongitude?: number;
  focusPostTitle?: string;
  focusPostText?: string;
  focusLocationName?: string | null;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: ExploreRouteParams | undefined;
  Post: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
