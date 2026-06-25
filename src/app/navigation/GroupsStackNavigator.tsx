import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AddExpenseScreen } from '../../features/expenses/screens/AddExpenseScreen';
import { CreateGroupScreen } from '../../features/groups/screens/CreateGroupScreen';
import { GroupDetailScreen } from '../../features/groups/screens/GroupDetailScreen';
import { GroupsListScreen } from '../../features/groups/screens/GroupsListScreen';
import type { GroupsStackParamList } from './types';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export function GroupsStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="GroupsList" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GroupsList" component={GroupsListScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
