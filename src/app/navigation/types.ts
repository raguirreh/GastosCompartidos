export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ProfileSetup: undefined;
  Join: { token: string };
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Balances: undefined;
  Profile: undefined;
};

export type GroupsStackParamList = {
  GroupsList: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId: string };
  AddExpense: { groupId: string };
};
