import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type UserRowProps = {
  rank: number;
  username: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  dailyIncrease: number;
  monthlyIncrease: number;
};

const UserRow: React.FC<UserRowProps> = ({
  rank,
  username,
  easy,
  medium,
  hard,
  total,
  dailyIncrease,
  monthlyIncrease,
}) => {
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.rank]}>{rank}</Text>
      <Text style={[styles.cell, styles.username]}>{username}</Text>
      <Text style={[styles.cell, styles.easy]}>{easy}</Text>
      <Text style={[styles.cell, styles.medium]}>{medium}</Text>
      <Text style={[styles.cell, styles.hard]}>{hard}</Text>
      <Text style={[styles.cell, styles.total]}>{total}</Text>
      <Text style={[styles.cell, styles.daily]}>{dailyIncrease}</Text>
      <Text style={[styles.cell, styles.monthly]}>{monthlyIncrease}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  rank: {
    fontWeight: 'bold',
    color: '#FFFFF2',
  },
  username: {
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 2,
    textAlign: 'left',
    paddingLeft: 10,
  },
  easy: { color: 'green' },
  medium: { color: 'orange' },
  hard: { color: 'red' },
  total: { fontWeight: 'bold', color: 'skyblue' },
  daily: { color: 'blue' },
  monthly: { color: 'purple' },
});

export default UserRow;