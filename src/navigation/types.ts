import type { NavigatorScreenParams } from '@react-navigation/native';

// Main tabs navigation
export type MainTabsParamList = {
  Notes: undefined;
  Search: undefined;
  Genes: undefined;
  Researchers: undefined;
  Articles: undefined;
  Conferences: undefined;
  Inbox: undefined;
  Profile: undefined;
  Settings: undefined;
};

// Root stack navigation
export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabsParamList>;
  GeneDetail: { symbol: string; organism: string };
  ResearcherDetail: { researcherId: string };
  ArticleDetail: { articleId: string };
  ConferenceDetail: { conferenceId: string };
  Tags: undefined;
  Collections: undefined;
  CollectionDetail: { collectionId: string };
  Privacy: undefined;
  MyQr: undefined;
  ScanQr: undefined;
  // Legacy - keep for backwards compatibility
  Home: undefined;
  Settings: undefined;
};
