# UI Changes - Visual Guide

## 1. Dashboard - Quick Stats Section (BEFORE)

```
┌─────────────────────────────────────────┐
│        Quick Stats 📊                   │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐    │
│  │      10      │  │    Online    │    │
│  │ Recent Actions│  │Server Status │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  [Super Admin Only]                     │
│  ┌──────────────┐  ┌──────────────┐    │
│  │       3      │  │      →       │    │
│  │ Open Reports │  │   View All   │    │ <- Links to /error-reports
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

## 2. Dashboard - Quick Stats Section (AFTER)

```
┌─────────────────────────────────────────┐
│        Quick Stats 📊                   │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐    │
│  │      10      │  │      8       │    │ <- NEW: Player Count
│  │ Recent Actions│  │Players Online│    │    (Updates every 10s)
│  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐                      │
│  │    Online    │                      │
│  │Server Status │                      │
│  └──────────────┘                      │
│                                         │
│  [Super Admin Only]                     │
│  ┌──────────────┐  ┌──────────────┐    │
│  │       3      │  │      →       │    │
│  │ Open Reports │  │   View All   │    │ <- Now links to /all-stats
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

### Key Changes:
1. **New Card**: "Players Online" card showing current player count (8)
2. **Auto-Refresh**: Count updates automatically every 10 seconds
3. **Updated Link**: "View All" now redirects to `/all-stats` instead of `/error-reports`
4. **Layout**: Adjusted grid to accommodate the new player count card

## 3. New Page: All Stats Dashboard

```
┌────────────────────────────────────────────────────────────────────┐
│  🎮  Detailed Statistics                    User Name   [Logout]   │
├────────────────────────────────────────────────────────────────────┤
│  ← Back to Dashboard                                               │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Time Range                                                    │ │
│  │ [Last 24 Hours] [ Last 7 Days ] [ Last 30 Days ]            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ CPU Usage Trend                                              │ │
│  │                                                              │ │
│  │  100% ┤                                                      │ │
│  │   75% ┤      ╭─────╮                                        │ │
│  │   50% ┤   ╭──╯     ╰──╮                                     │ │
│  │   25% ┤───╯           ╰────                                 │ │
│  │    0% └──────────────────────────────────────────           │ │
│  │       12:00  14:00  16:00  18:00  20:00  22:00             │ │
│  │                                                              │ │
│  │       Legend: ─ CPU Usage (%)                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Memory Usage Trend                                           │ │
│  │                                                              │ │
│  │  100% ┤                                                      │ │
│  │   75% ┤                  ╭───╮                              │ │
│  │   50% ┤        ╭─────────╯   ╰──╮                          │ │
│  │   25% ┤────────╯                 ╰────                      │ │
│  │    0% └──────────────────────────────────────────           │ │
│  │       12:00  14:00  16:00  18:00  20:00  22:00             │ │
│  │                                                              │ │
│  │       Legend: ─ Memory Usage (%)                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Player Count Trend                                           │ │
│  │                                                              │ │
│  │   20  ┤                                                      │ │
│  │   15  ┤      ╭─╮     ╭──╮                                   │ │
│  │   10  ┤   ╭──╯ ╰─╮  ╭╯  ╰──╮                               │ │
│  │    5  ┤───╯      ╰──╯       ╰────                          │ │
│  │    0  └──────────────────────────────────────────           │ │
│  │       12:00  14:00  16:00  18:00  20:00  22:00             │ │
│  │                                                              │ │
│  │       Legend: ─ Players Online                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Features:
1. **Navigation**: Back button to return to dashboard
2. **Time Range Selector**: Three buttons for different time periods
3. **Three Trend Graphs**:
   - CPU Usage (green line)
   - Memory Usage (blue line)
   - Player Count (orange line)
4. **Interactive Charts**: Hover tooltips show exact values
5. **Responsive Design**: Charts adapt to screen size

## 4. Empty State (No Historical Data)

```
┌────────────────────────────────────────────────────────────────────┐
│  🎮  Detailed Statistics                    User Name   [Logout]   │
├────────────────────────────────────────────────────────────────────┤
│  ← Back to Dashboard                                               │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Time Range                                                    │ │
│  │ [Last 24 Hours] [ Last 7 Days ] [ Last 30 Days ]            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │                          📊                                  │ │
│  │                                                              │ │
│  │               No Historical Data Yet                         │ │
│  │                                                              │ │
│  │     Historical metrics will be collected automatically       │ │
│  │                     over time.                               │ │
│  │                                                              │ │
│  │     To start collecting data, enable metric history saving   │ │
│  │     by adding ?saveHistory=true to the metrics API endpoint. │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## 5. Player Count Update Animation

The player count in Quick Stats updates every 10 seconds:

```
Time: 00:00
┌──────────────┐
│      8       │
│Players Online│
└──────────────┘

Time: 00:10 (updates)
┌──────────────┐
│      11      │  <- Changed from 8 to 11
│Players Online│
└──────────────┘

Time: 00:20 (updates)
┌──────────────┐
│      9       │  <- Changed from 11 to 9
│Players Online│
└──────────────┘
```

## Color Scheme

All UI elements follow the existing dark theme:

- **Background**: Stone-900 (#1c1917)
- **Panels**: Stone-800 (#292524)
- **Borders**: Stone-700 (#44403c)
- **Primary Text**: Green-400 (#4ade80)
- **Secondary Text**: Stone-300 (#d6d3d1)
- **Muted Text**: Stone-400 (#a8a29e)

**Chart Colors**:
- CPU Line: Green (#4ade80)
- Memory Line: Blue (#3b82f6)
- Player Count Line: Orange (#f59e0b)

## Responsive Behavior

### Desktop (>1024px):
- Quick Stats: 2-column grid
- Charts: Full width with legend

### Tablet (768px - 1024px):
- Quick Stats: 2-column grid
- Charts: Full width, smaller height

### Mobile (<768px):
- Quick Stats: 1-column stack
- Charts: Single column, optimized height
- Time range buttons: Stack vertically

## Accessibility

1. **Keyboard Navigation**: All interactive elements are keyboard accessible
2. **Color Contrast**: All text meets WCAG AA standards
3. **Screen Readers**: Proper ARIA labels on charts and buttons
4. **Focus Indicators**: Visible focus states on all interactive elements

## Performance

- **Initial Load**: Charts render on client-side (Recharts)
- **Data Fetching**: API calls only when needed (on mount and time range change)
- **Auto-Refresh**: Dashboard polls every 10 seconds for player count
- **Optimization**: Charts use ResponsiveContainer for automatic sizing
