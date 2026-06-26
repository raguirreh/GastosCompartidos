import { Navigate, Route, Routes } from 'react-router-dom';
import { SplashScreen } from '../../features/auth/screens/SplashScreen';
import { OnboardingScreen } from '../../features/auth/screens/OnboardingScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { AuthScreen } from '../../features/auth/screens/AuthScreen';
import { LogoutScreen } from '../../features/auth/screens/LogoutScreen';
import { SignUpScreen } from '../../features/auth/screens/SignUpScreen';
import { ProfileSetupScreen } from '../../features/auth/screens/ProfileSetupScreen';
import { JoinGroupScreen } from '../../features/groups/screens/JoinGroupScreen';
import { HomeScreen } from '../../features/groups/screens/HomeScreen';
import { GroupsListScreen } from '../../features/groups/screens/GroupsListScreen';
import { FriendsListScreen } from '../../features/groups/screens/FriendsListScreen';
import { AddFriendScreen } from '../../features/groups/screens/AddFriendScreen';
import { GroupDetailScreen } from '../../features/groups/screens/GroupDetailScreen';
import { CreateGroupScreen } from '../../features/groups/screens/CreateGroupScreen';
import { AddExpenseScreen } from '../../features/expenses/screens/AddExpenseScreen';
import { BalancesScreen } from '../../features/balances/screens/BalancesScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';
import { MainLayout } from './MainLayout';
import { RequireAuth } from './RequireAuth';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/auth-demo" element={<AuthScreen />} />
      <Route path="/logout" element={<LogoutScreen />} />
      <Route path="/signup" element={<SignUpScreen />} />
      <Route path="/profile-setup" element={<ProfileSetupScreen />} />
      <Route path="/join/:token" element={<JoinGroupScreen />} />

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<MainLayout />}>
          <Route path="home" element={<HomeScreen />} />
          <Route path="groups" element={<GroupsListScreen />} />
          <Route path="friends" element={<FriendsListScreen />} />
          <Route path="friends/new" element={<AddFriendScreen />} />
          <Route path="groups/new" element={<CreateGroupScreen />} />
          <Route path="groups/:groupId" element={<GroupDetailScreen />} />
          <Route path="groups/:groupId/add-expense" element={<AddExpenseScreen />} />
          <Route path="groups/:groupId/expenses/:expenseId" element={<AddExpenseScreen />} />
          <Route path="balances" element={<BalancesScreen />} />
          <Route path="profile" element={<ProfileScreen />} />
          <Route index element={<Navigate to="home" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
