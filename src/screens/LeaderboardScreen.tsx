import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { fetchUserData, saveToStorage, getFromStorage } from '../services/api';
import UserRow from '../components/UserRow';

const LeaderboardScreen: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [usernameMappings, setUsernameMappings] = useState<{ [key: string]: string }>({});

  // Fetch usernames and username mappings from GitHub on app start
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch usernames
        const usernamesResponse = await axios.get(
          'https://raw.githubusercontent.com/College-Notes/leetcode-data/refs/heads/main/usernames.json'
        );
        setUsernames(usernamesResponse.data);

        // Fetch username mappings
        const mappingsResponse = await axios.get(
          'https://raw.githubusercontent.com/College-Notes/leetcode-data/refs/heads/main/usernameMappings.json'
        );
        setUsernameMappings(mappingsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data from GitHub:', error);
        Alert.alert('Error', 'Failed to fetch data from GitHub. Using default values.');
        setUsernames([]); // Fallback to an empty list
        setUsernameMappings({}); // Fallback to an empty object
      }
    };
    fetchData();
  }, []);

  const fetchAllUserData = async () => {
    try {
      setRefreshing(true); // Start refreshing
      const currentDate = new Date();
      const currentDay = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM

      const results = await Promise.all(
        usernames.map(async (username) => {
          try {
            // Fetch data from API
            const apiData = await fetchUserData(username);

            // Retrieve existing data from AsyncStorage
            const storedData = (await getFromStorage(username)) || {
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
              : (apiData.totalSolved || 0) - (storedData.startOfMonthTotal || 0);

            // Ensure dailyIncrease and monthlyIncrease are valid numbers
            const validDailyIncrease = isNaN(dailyIncrease) ? 0 : dailyIncrease;
            const validMonthlyIncrease = isNaN(monthlyIncrease) ? 0 : monthlyIncrease;

            // Update storage with new data
            const updatedStoredData = {
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
        })
      );

      // Sort and rank data
      const sortedData = results
        .sort((a, b) => b.total - a.total)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      setLeaderboardData(sortedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data. Showing last fetched data.');
      setLoading(false);
    } finally {
      setRefreshing(false); // Stop refreshing
    }
  };

  useEffect(() => {
    if (usernames.length > 0) {
      fetchAllUserData();
    }
  }, [usernames]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>LeetCode Leaderboard</Text>
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
            keyExtractor={(item) => item.username}
            renderItem={({ item }) => (
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
            )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1e1e2f',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 16,
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
  easy: { color: 'green' },
  medium: { color: 'orange' },
  hard: { color: 'red' },
  total: { fontWeight: 'bold' },
  daily: { color: 'blue' },
  monthly: { color: 'purple' },
});

export default LeaderboardScreen;