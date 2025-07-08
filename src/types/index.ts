// Global type definitions for the LeetCode Tracker app

export interface UserApiData {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export interface StoredUserData {
  startOfDayTotal: number;
  startOfMonthTotal: number;
  total: number;
  dailyIncrease: number;
  monthlyIncrease: number;
  easy: number;
  medium: number;
  hard: number;
  lastUpdatedDay: string;
  lastUpdatedMonth: string;
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  dailyIncrease: number;
  monthlyIncrease: number;
}

export interface UsernameMappings {
  [key: string]: string;
}
