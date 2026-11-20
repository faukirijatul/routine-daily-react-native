# Routine Daily

Routine Daily is an Android app for planning your daily routine, tracking the status of each activity, and seeing today's schedule from a home screen widget.

## Features

- Keep a separate routine for each day of the week.
- Add, edit, and delete routines.
- Change a routine's status by tapping its icon. The status cycles **Pending → Completed → Failed → Pending**.
- See how many routines are completed, failed, or pending today, plus your success rate (completed ÷ total routines for the day).
- Import routines from JSON. An import replaces all saved routines.
- Show today's stats and the routine in progress on an Android home screen widget. Tap the widget to open the app.
- Receive a reminder 30 minutes before a newly added routine starts.
- Show an ongoing notification with the routine in progress and its progress, updated every minute.
- Store all data locally on the device. The app ships with no sample routines.

## Running on Android

### Emulator or device with a development build

1. Install dependencies:

   ```bash
   npm install
   ```

2. Open Android Studio and start an emulator from **Device Manager**, or connect an Android device with USB debugging enabled.
3. From the project root, run:

   ```bash
   npm run android
   ```

This builds and installs the debug app, then launches it on the emulator or connected device. Expo Go is not supported because the app uses native modules (Notifee and the Android widget).

### Building an Android build with EAS

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

When the build finishes, download it from the link EAS displays. EAS builds run in the cloud.

## Using the app

The app has three tabs:

- **Today**: today's stats, the routine in progress (with a progress bar and time left), and the list of today's routines. Tap the icon next to a routine to change its status. Pull down to refresh.
- **Manage**: pick a day, then add, edit, or delete routines for that day. Deleting asks for confirmation.
- **Settings**: show the notification for the routine in progress now, import routines from JSON, or delete all routines.

### Managing routines

1. Open the **Manage** tab.
2. Select a day.
3. Tap **Add** and enter a title, a start time, and an end time.
4. Use the pencil icon to edit a routine or the trash icon to delete it.

Times use the 24-hour `HH:mm` format, for example `08:30`. The start and end times must be different.

### Importing routines from JSON

Go to **Settings → Import routines from JSON**, paste a JSON array, then tap **Validate and import**. Every imported routine starts with the status **Pending**.

Example for every day of the week:

```json
[
  {
    "day": "Sunday",
    "startTime": "08:00",
    "endTime": "09:00",
    "title": "Light exercise"
  },
  {
    "day": "Monday",
    "startTime": "06:00",
    "endTime": "07:00",
    "title": "Morning workout"
  },
  {
    "day": "Tuesday",
    "startTime": "08:00",
    "endTime": "09:00",
    "title": "Study"
  },
  {
    "day": "Wednesday",
    "startTime": "09:00",
    "endTime": "10:00",
    "title": "Reading"
  },
  {
    "day": "Thursday",
    "startTime": "13:00",
    "endTime": "14:00",
    "title": "Project work"
  },
  {
    "day": "Friday",
    "startTime": "16:00",
    "endTime": "17:00",
    "title": "Grocery shopping"
  },
  {
    "day": "Saturday",
    "startTime": "10:00",
    "endTime": "11:00",
    "title": "Cleaning the house"
  }
]
```

Format rules:

- The top level must be a JSON array.
- Each object must have `day`, `startTime`, `endTime`, and `title`.
- `day` must be exactly `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, or `Saturday` (case-sensitive).
- Times must use the 24-hour `HH:mm` format. The title cannot be empty, and the start and end times cannot be the same.
- `id` and `status` are not needed. Any `id` or `status` values in the file are ignored, and every routine is imported as **Pending**.
- An empty array (`[]`) is valid and clears all routines.

## Widget

Add the **Today's Routine** widget from your launcher's widget picker. It shows:

- Today's counts for completed, failed, and pending routines, plus the success rate.
- The routine in progress, with its progress bar and time left, or a message when nothing is in progress.

Tapping the widget opens the app. The widget is read-only: change statuses in the app. It refreshes about every 30 minutes and whenever the app updates the routines.

## Notifications

- **Reminder**: when you add a routine in the app, the app schedules a one-time notification 30 minutes before its next start time. Editing a routine does not reschedule its reminder, and routines imported from JSON do not get reminders.
- **Ongoing notification**: the app keeps a persistent notification showing the routine in progress, its progress, and the time left. It is updated every minute and starts when the app opens. The notification shows "No routine in progress" when nothing is scheduled.
- **Show notification now**: in **Settings**, shows the ongoing notification immediately.

Allow notifications when the app asks for permission. Otherwise, reminders and the ongoing notification will not appear.

## Status and storage

- Routines and their statuses are saved locally on the device with AsyncStorage.
- Each routine applies to a single day of the week.
- When the date changes, all statuses are reset to **Pending** the next time the data loads.
- Importing JSON replaces all saved routines. To remove everything without importing, use **Settings → Delete all routines**.
- Data saved by earlier versions of the app, which used Indonesian day names such as `Senin`, is converted to the English day names automatically.

## Architecture

The app uses a layered architecture:

| Layer | Responsibility | Location |
|---|---|---|
| Presentation | Navigation screens and UI components | `app/`, `src/components/` |
| Service | Routine operations, notifications, and widget updates | `src/services/`, `src/widget/` |
| Domain | Data types and routine business rules | `src/domain/`, `src/types/` |
| Data | Local storage of routines | `src/data/` |

Data flow for routines:

```text
Screen / Widget → Service → Domain / Repository → AsyncStorage
```

Entry points:

- `index.ts` loads Expo Router and registers the widget task handler.
- `app/_layout.tsx` requests notification permission and starts the ongoing notification on launch.
- `plugins/withNotifeeForegroundService.js` is an Expo config plugin that configures the foreground service for the ongoing notification.

## Technology

- Expo SDK 58 and React Native 0.88 with TypeScript
- Expo Router for navigation
- AsyncStorage for local storage
- Lucide React Native for icons
- Notifee (`@notifee/react-native`) for the ongoing notification, and Expo Notifications for reminders
- `react-native-android-widget` for the home screen widget
- Expo Application Services (EAS) for cloud builds
