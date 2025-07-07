import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_API_URL = 'https://leetcode-backend-ge9p.onrender.com';

/**
 * Fetch user data from the backend API.
 * @param username - The LeetCode username.
 */
export const fetchUserData = async (username: string) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/user/${username}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch data for ${username}:`, error);
    throw error;
  }
};

/**
 * Save data to AsyncStorage.
 * @param key - The key to store the data under.
 * @param data - The data to store.
 */
export const saveToStorage = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data for ${key}:`, error);
  }
};

/**
 * Retrieve data from AsyncStorage.
 * @param key - The key to retrieve data for.
 */
export const getFromStorage = async (key: string) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to retrieve data for ${key}:`, error);
    return null;
  }
};