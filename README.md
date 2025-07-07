# 🏆 LeetCode Tracker

A React Native app to track LeetCode progress and display rankings in a leaderboard.

## 📱 Features

- **Leaderboard**: Rankings based on problems solved
- **Problem Breakdown**: Easy, medium, hard counts
- **Offline Support**: Cached data for offline viewing
- **Pull-to-Refresh**: Update data easily

## 🎯 Screenshots

### Leaderboard View

![Leaderboard](https://via.placeholder.com/300x600/1e1e2f/00ff00?text=Leaderboard)

### Loading State

![Loading](https://via.placeholder.com/300x600/1e1e2f/00ff00?text=Loading)

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd LeetCodeTracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the app**
   ```bash
   npm start
   npm run android # For Android
   npm run ios     # For iOS
   ```

## 📁 Project Structure

```
LeetCodeTracker/
├── src/
│   ├── components/   # UI components
│   ├── screens/      # App screens
│   └── services/     # API and storage logic
├── App.jsx           # Main app component
├── index.js          # Entry point
└── README.md         # Documentation
```

## 🔧 Configuration

Update the API URL in `src/services/api.js`:

```javascript
const BACKEND_API_URL = 'https://your-backend-api.com';
```

## 🐛 Troubleshooting

1. **Connection Errors**: Check internet and API URL
2. **Build Issues**: Run `npm install` and clear Metro cache

---

**Made with ❤️ for the LeetCode community**
