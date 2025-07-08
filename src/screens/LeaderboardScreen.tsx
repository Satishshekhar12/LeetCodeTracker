import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ListRenderItem,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import axios from 'axios';
import {fetchUserData, saveToStorage, getFromStorage} from '../services/api';
import {LeaderboardUser, UserApiData, StoredUserData} from '../types';
import UserRow from '../components/UserRow';

const LeaderboardScreen: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [usernameMappings, setUsernameMappings] = useState<{
    [key: string]: string;
  }>({});
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newDisplayName, setNewDisplayName] = useState<string>('');

  // Fetch usernames and username mappings from GitHub on app start
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        // Fetch usernames from GitHub
        const usernamesResponse = await axios.get<string[]>(
          'https://raw.githubusercontent.com/College-Notes/leetcode-data/refs/heads/main/usernames.json',
        );

        // Fetch username mappings from GitHub
        const mappingsResponse = await axios.get<{[key: string]: string}>(
          'https://raw.githubusercontent.com/College-Notes/leetcode-data/refs/heads/main/usernameMappings.json',
        );

        // Get custom usernames and mappings from local storage
        const customUsernamesData = await getFromStorage('customUsernames');
        const customMappingsData = await getFromStorage(
          'customUsernameMappings',
        );

        const customUsernames = Array.isArray(customUsernamesData)
          ? customUsernamesData
          : [];
        const customMappings =
          customMappingsData &&
          typeof customMappingsData === 'object' &&
          !Array.isArray(customMappingsData)
            ? (customMappingsData as unknown as {[key: string]: string})
            : {};

        // Combine GitHub data with local custom data
        const allUsernames = [...usernamesResponse.data, ...customUsernames];
        const allMappings = {...mappingsResponse.data, ...customMappings};

        setUsernames(allUsernames);
        setUsernameMappings(allMappings);
      } catch (error) {
        console.error('Failed to fetch data from GitHub:', error);

        // Try to load from local storage as fallback
        const customUsernamesData = await getFromStorage('customUsernames');
        const customMappingsData = await getFromStorage(
          'customUsernameMappings',
        );

        const customUsernames = Array.isArray(customUsernamesData)
          ? customUsernamesData
          : [];
        const customMappings =
          customMappingsData &&
          typeof customMappingsData === 'object' &&
          !Array.isArray(customMappingsData)
            ? (customMappingsData as unknown as {[key: string]: string})
            : {};

        setUsernames(customUsernames);
        setUsernameMappings(customMappings);

        Alert.alert(
          'Error',
          'Failed to fetch data from GitHub. Using local data.',
        );
      }
    };
    fetchData();
  }, []);

  const fetchAllUserData = useCallback(async (): Promise<void> => {
    try {
      setRefreshing(true); // Start refreshing
      const currentDate = new Date();
      const currentDay = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM

      const results = await Promise.all(
        usernames.map(async (username: string): Promise<LeaderboardUser> => {
          try {
            // Fetch data from API
            const apiData: UserApiData = await fetchUserData(username);

            // Retrieve existing data from AsyncStorage
            const storedData: StoredUserData = (await getFromStorage(
              username,
            )) || {
              startOfDayTotal: apiData.totalSolved || 0,
              startOfMonthTotal: apiData.totalSolved || 0,
              total: apiData.totalSolved || 0,
              dailyIncrease: 0,
              monthlyIncrease: 0,
              easy: apiData.easySolved || 0,
              medium: apiData.mediumSolved || 0,
              hard: apiData.hardSolved || 0,
              lastUpdatedDay: currentDay,
              lastUpdatedMonth: currentMonth,
            };

            // Check if it's a new day
            const isNewDay = storedData.lastUpdatedDay !== currentDay;

            // Check if it's a new month
            const isNewMonth = storedData.lastUpdatedMonth !== currentMonth;

            // Calculate daily increase
            const dailyIncrease = isNewDay
              ? 0 // Reset daily increase if it's a new day
              : (apiData.totalSolved || 0) - (storedData.startOfDayTotal || 0);

            // Calculate monthly increase
            const monthlyIncrease = isNewMonth
              ? 0 // Reset monthly increase if it's a new month
              : (apiData.totalSolved || 0) -
                (storedData.startOfMonthTotal || 0);

            // Ensure dailyIncrease and monthlyIncrease are valid numbers
            const validDailyIncrease = isNaN(dailyIncrease) ? 0 : dailyIncrease;
            const validMonthlyIncrease = isNaN(monthlyIncrease)
              ? 0
              : monthlyIncrease;

            // Update storage with new data
            const updatedStoredData: StoredUserData = {
              startOfDayTotal: isNewDay
                ? apiData.totalSolved || 0 // Reset startOfDayTotal if it's a new day
                : storedData.startOfDayTotal || 0,
              startOfMonthTotal: isNewMonth
                ? apiData.totalSolved || 0 // Reset startOfMonthTotal if it's a new month
                : storedData.startOfMonthTotal || 0,
              total: apiData.totalSolved || 0,
              dailyIncrease: validDailyIncrease,
              monthlyIncrease: validMonthlyIncrease,
              easy: apiData.easySolved || 0,
              medium: apiData.mediumSolved || 0,
              hard: apiData.hardSolved || 0,
              lastUpdatedDay: currentDay,
              lastUpdatedMonth: currentMonth,
            };

            await saveToStorage(username, updatedStoredData);

            // Return updated leaderboard data
            return {
              rank: 0, // Placeholder for now
              username: usernameMappings[username] || username,
              easy: updatedStoredData.easy,
              medium: updatedStoredData.medium,
              hard: updatedStoredData.hard,
              total: updatedStoredData.total,
              dailyIncrease: updatedStoredData.dailyIncrease,
              monthlyIncrease: updatedStoredData.monthlyIncrease,
            };
          } catch (error) {
            console.error(`Failed to fetch data for ${username}:`, error);

            // Use stored data as fallback if API fetch fails
            const fallbackData = await getFromStorage(username);
            return fallbackData
              ? {
                  rank: 0,
                  username: usernameMappings[username] || username,
                  easy: fallbackData.easy || 0,
                  medium: fallbackData.medium || 0,
                  hard: fallbackData.hard || 0,
                  total: fallbackData.total || 0,
                  dailyIncrease: fallbackData.dailyIncrease || 0,
                  monthlyIncrease: fallbackData.monthlyIncrease || 0,
                }
              : {
                  rank: 0,
                  username: usernameMappings[username] || username,
                  easy: 0,
                  medium: 0,
                  hard: 0,
                  total: 0,
                  dailyIncrease: 0,
                  monthlyIncrease: 0,
                };
          }
        }),
      );

      // Sort and rank data
      const sortedData = results
        .sort((a, b) => b.total - a.total)
        .map((user, index) => ({...user, rank: index + 1}));

      setLeaderboardData(sortedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data. Showing last fetched data.');
      setLoading(false);
    } finally {
      setRefreshing(false); // Stop refreshing
    }
  }, [usernames, usernameMappings]);

  useEffect(() => {
    if (usernames.length > 0) {
      fetchAllUserData();
    }
  }, [usernames, fetchAllUserData]);

  const handleAddUser = async (): Promise<void> => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Please enter a valid username');
      return;
    }

    if (usernames.includes(newUsername.trim())) {
      Alert.alert('Error', 'User already exists in the leaderboard');
      return;
    }

    try {
      // Test if the user exists by fetching their data
      await fetchUserData(newUsername.trim());

      // Get current custom data from storage
      const currentCustomUsernames = await getFromStorage('customUsernames');
      const currentCustomMappings = await getFromStorage(
        'customUsernameMappings',
      );

      const customUsernames = Array.isArray(currentCustomUsernames)
        ? currentCustomUsernames
        : [];
      const customMappings =
        currentCustomMappings &&
        typeof currentCustomMappings === 'object' &&
        !Array.isArray(currentCustomMappings)
          ? (currentCustomMappings as unknown as {[key: string]: string})
          : {};

      // Add new user to custom data
      const updatedCustomUsernames = [...customUsernames, newUsername.trim()];
      const updatedCustomMappings = {
        ...customMappings,
        [newUsername.trim()]: newDisplayName.trim() || newUsername.trim(),
      };

      // Save to local storage
      await saveToStorage('customUsernames', updatedCustomUsernames);
      await saveToStorage('customUsernameMappings', updatedCustomMappings);

      // Update local state
      const updatedUsernames = [...usernames, newUsername.trim()];
      const updatedMappings = {
        ...usernameMappings,
        [newUsername.trim()]: newDisplayName.trim() || newUsername.trim(),
      };

      setUsernames(updatedUsernames);
      setUsernameMappings(updatedMappings);

      // Close modal and reset form
      setShowAddUserModal(false);
      setNewUsername('');
      setNewDisplayName('');

      Alert.alert('Success', 'User added successfully!');
    } catch (error) {
      Alert.alert(
        'Error',
        'User not found on LeetCode. Please check the username.',
      );
    }
  };

  const openAddUserModal = (): void => {
    setShowAddUserModal(true);
  };

  const closeAddUserModal = (): void => {
    setShowAddUserModal(false);
    setNewUsername('');
    setNewDisplayName('');
  };

  const renderUserRow: ListRenderItem<LeaderboardUser> = ({item}) => (
    <UserRow
      rank={item.rank}
      username={item.username}
      easy={item.easy}
      medium={item.medium}
      hard={item.hard}
      total={item.total}
      dailyIncrease={item.dailyIncrease}
      monthlyIncrease={item.monthlyIncrease}
    />
  );

  const keyExtractor = (item: LeaderboardUser): string => item.username;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>LeetCode Leaderboard</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddUserModal}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.developedBy}>Developed by Satish</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00ff00" />
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.rank]}>#</Text>
            <Text style={[styles.headerCell, styles.username]}>Username</Text>
            <Text style={[styles.headerCell, styles.easy]}>Easy</Text>
            <Text style={[styles.headerCell, styles.medium]}>Medium</Text>
            <Text style={[styles.headerCell, styles.hard]}>Hard</Text>
            <Text style={[styles.headerCell, styles.total]}>Total</Text>
            <Text style={[styles.headerCell, styles.daily]}>Daily</Text>
            <Text style={[styles.headerCell, styles.monthly]}>Monthly</Text>
          </View>
          <FlatList
            data={leaderboardData}
            keyExtractor={keyExtractor}
            renderItem={renderUserRow}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchAllUserData}
                colors={['#00ff00']}
              />
            }
          />
        </>
      )}

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeAddUserModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>

            <TextInput
              style={styles.input}
              placeholder="LeetCode Username"
              placeholderTextColor="#888"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Display Name (Optional)"
              placeholderTextColor="#888"
              value={newDisplayName}
              onChangeText={setNewDisplayName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeAddUserModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addUserButton}
                onPress={handleAddUser}>
                <Text style={styles.addUserButtonText}>Add User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1e1e2f',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  developedBy: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 6,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  rank: {
    flex: 0.5,
  },
  username: {
    flex: 2,
    textAlign: 'left',
    paddingLeft: 10,
  },
  easy: {color: 'green'},
  medium: {color: 'orange'},
  hard: {color: 'red'},
  total: {fontWeight: 'bold'},
  daily: {color: 'blue'},
  monthly: {color: 'purple'},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#3a3a4e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#666',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addUserButton: {
    flex: 1,
    backgroundColor: '#00ff00',
    borderRadius: 8,
    padding: 12,
    marginLeft: 10,
  },
  addUserButtonText: {
    color: '#1e1e2f',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LeaderboardScreen;
