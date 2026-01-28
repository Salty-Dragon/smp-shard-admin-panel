# Visual Guide - All Stats Page Features

This document provides a visual description of the enhanced "All Stats" page features.

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎮 Header                                      User | [Logout]  │
├─────────────────────────────────────────────────────────────────┤
│ ← Back to Dashboard                                             │
├─────────────────────────────────────────────────────────────────┤
│ Time Range Selection Panel                                      │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ [Last 24 Hours] [Last 7 Days] [Last 30 Days] [Custom]    │  │
│ │                                                            │  │
│ │ (If Custom selected:)                                      │  │
│ │ Start Date: [____________________] End: [_____________]    │  │
│ │                                          [Apply Button]    │  │
│ │ ─────────────────────────────────────────────────────────  │  │
│ │ ☑ Auto-refresh  Interval: [30 seconds ▼]  [🔄 Refresh]   │  │
│ └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ CPU Usage Trend Chart                                           │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 100% ┤                                                     │  │
│ │  75% ┤         ╱╲                                          │  │
│ │  50% ┤      ╱─╯  ╲╱╲                                       │  │
│ │  25% ┤   ╱─╯         ╲                                     │  │
│ │   0% ┼─────────────────────────────────────────────────→  │  │
│ │      12:00    14:00    16:00    18:00    20:00           │  │
│ │      ── CPU Usage (%)                                      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Memory Usage Trend Chart                                        │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 100% ┤                                                     │  │
│ │  75% ┤                        ╱────╲                       │  │
│ │  50% ┤                   ╱───╯      ╲                      │  │
│ │  25% ┤              ╱───╯              ╲                   │  │
│ │   0% ┼─────────────────────────────────────────────────→  │  │
│ │      12:00    14:00    16:00    18:00    20:00           │  │
│ │      ── Memory Usage (%)                                   │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Player Count Trend Chart                                        │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │  20 ┤                                                      │  │
│ │  15 ┤                ●───●                                 │  │
│ │  10 ┤            ●───╯   ╰───●                             │  │
│ │   5 ┤        ●───╯            ╰───●                        │  │
│ │   0 ┼─────────────────────────────────────────────────→   │  │
│ │     12:00    14:00    16:00    18:00    20:00            │  │
│ │     ── Players Online                                      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Disk Usage Trend Chart                                          │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 100% ┤                                                     │  │
│ │  75% ┤▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                        │  │
│ │  50% ┤▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                        │  │
│ │  25% ┤▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                        │  │
│ │   0% ┼─────────────────────────────────────────────────→  │  │
│ │      12:00    14:00    16:00    18:00    20:00           │  │
│ │      ── Disk Usage (%)                                     │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Server Status History Chart                                     │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Online  ┤▓▓▓▓  ▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓  ▓▓▓▓                    │  │
│ │         ┤       ■■                                         │  │
│ │ Offline ┤                                                  │  │
│ │         ┼─────────────────────────────────────────────→   │  │
│ │         12:00  14:00  16:00  18:00  20:00                │  │
│ │         ▓ Online  ■ Offline                               │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Feature Descriptions

### 1. Time Range Selector
**Location**: Top of page, below navigation  
**Features**:
- 4 clickable buttons for preset ranges
- Buttons highlight in green when selected
- Smooth hover effects
- Responsive layout wraps on small screens

### 2. Custom Date Range Picker
**Location**: Appears when "Custom Range" is selected  
**Features**:
- Two datetime-local inputs (start and end)
- Dark theme matching the site design
- "Apply" button to fetch data
- Button disabled until both dates are filled
- Validation prevents invalid date ranges

### 3. Auto-Refresh Controls
**Location**: Below time range selector, separated by a line  
**Features**:
- Checkbox to enable/disable
- Dropdown to select interval (10s or 30s)
- Manual refresh button always available
- Visual indicators when active

### 4. CPU Usage Chart
**Type**: Line Chart  
**Color**: Green (#4ade80)  
**Shows**: CPU usage percentage (0-100%)  
**Features**:
- Grid lines for easy reading
- Hover tooltips show exact values
- X-axis shows timestamps
- Y-axis labeled "CPU Usage (%)"

### 5. Memory Usage Chart
**Type**: Line Chart  
**Color**: Blue (#3b82f6)  
**Shows**: Memory usage percentage (0-100%)  
**Features**:
- Same structure as CPU chart
- Clearly labeled axis
- Interactive tooltips
- Responsive to screen size

### 6. Player Count Chart
**Type**: Line Chart  
**Color**: Orange (#f59e0b)  
**Shows**: Number of online players  
**Features**:
- Dynamic Y-axis scale
- Shows player activity patterns
- Dots on data points
- Smooth line connections

### 7. Disk Usage Chart
**Type**: Area Chart  
**Color**: Purple (#8b5cf6)  
**Shows**: Disk usage percentage (0-100%)  
**Features**:
- Semi-transparent fill
- Shows usage growth trends
- Gradient effect
- Easy to spot rapid increases

### 8. Server Status Chart
**Type**: Bar Chart  
**Colors**: 
- Green (#10b981) = Online
- Red (#ef4444) = Offline
**Shows**: Server online/offline periods  
**Features**:
- Color-coded bars
- Legend at bottom
- Binary view (Online/Offline)
- Easy to spot downtime

## Interactive Features

### Hover Tooltips
When you hover over any data point on a chart:
```
┌─────────────────────────┐
│ 1/28/2024, 2:30:00 PM  │
│                         │
│ CPU Usage (%): 45.2    │
└─────────────────────────┘
```

### Loading State
While data is being fetched:
```
┌─────────────────────────────────┐
│                                 │
│          ⟳ Loading...           │
│                                 │
└─────────────────────────────────┘
```

### Error State
When an error occurs:
```
┌─────────────────────────────────────┐
│              ⚠️                     │
│    Error Loading Data               │
│                                     │
│  Failed to fetch historical metrics │
│                                     │
│        [Try Again Button]           │
└─────────────────────────────────────┘
```

### No Data State
When no historical data exists:
```
┌─────────────────────────────────────────────┐
│                    📊                       │
│        No Historical Data Yet               │
│                                             │
│  Start collecting real-time server metrics  │
│      to view historical trends.             │
│                                             │
│  Setup Instructions:                        │
│  • Call metrics API with ?saveHistory=true  │
│  • Or set up automated collection           │
│  • See documentation for details            │
└─────────────────────────────────────────────┘
```

## Color Scheme

All charts follow the site's dark theme:
- **Background**: Dark stone (#292524)
- **Borders**: Medium stone (#44403c)
- **Text**: Light stone (#a8a29e)
- **Primary**: Green (#4ade80)
- **Grid Lines**: Subtle stone (#44403c)

## Responsive Design

The page adapts to different screen sizes:

### Desktop (> 1024px)
- Full-width charts
- Horizontal button layout
- Side-by-side date pickers

### Tablet (768px - 1024px)
- Full-width charts
- Buttons wrap to multiple rows
- Date pickers stack vertically

### Mobile (< 768px)
- Full-width charts
- Vertical button layout
- Simplified tooltips
- Smaller fonts for readability

## Accessibility Features

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels on all controls
3. **Color Contrast**: Meets WCAG AA standards
4. **Focus Indicators**: Clear focus states on all buttons and inputs
5. **Semantic HTML**: Proper heading hierarchy and structure

## Performance Optimizations

1. **Data Limiting**: Maximum 100 records per query
2. **Lazy Loading**: Charts only render when data is available
3. **Memoization**: React prevents unnecessary re-renders
4. **Throttled Refresh**: Auto-refresh limited to 10-second intervals
5. **Indexed Queries**: Database queries use timestamp index

## Animation & Transitions

1. **Chart Rendering**: Smooth fade-in when data loads
2. **Button Hover**: Subtle color transition (0.2s)
3. **Loading Spinner**: Smooth rotation animation
4. **Error Messages**: Fade-in effect
5. **Tooltip Appearance**: Instant on hover

## User Workflow Examples

### Example 1: Quick Overview
1. User navigates to All Stats page
2. Page loads with "Last 24 Hours" selected by default
3. All 5 charts display recent data
4. User hovers over charts to see exact values

### Example 2: Custom Time Range Analysis
1. User clicks "Custom Range" button
2. Date picker appears
3. User selects start date: 1/20/2024 00:00
4. User selects end date: 1/27/2024 23:59
5. User clicks "Apply"
6. Charts update with data from that week

### Example 3: Real-Time Monitoring
1. User enables auto-refresh checkbox
2. Selects 10-second interval
3. Charts automatically update every 10 seconds
4. User monitors live server status
5. User disables when done

### Example 4: Investigating Downtime
1. User selects "Last 7 Days"
2. Scrolls to Server Status chart
3. Identifies red bars (offline periods)
4. Correlates with CPU/Memory charts
5. Determines cause of downtime

## Technical Implementation

### Frontend Stack
- **React 19** with TypeScript
- **Recharts 3.7** for visualizations
- **TailwindCSS 4** for styling
- **Next.js 16** for SSR and routing

### Chart Library Features Used
- LineChart for trends
- AreaChart for filled regions
- BarChart for categorical data
- Cell component for conditional coloring
- ResponsiveContainer for adaptive sizing
- CartesianGrid for background
- Tooltip for interactivity
- Legend for clarity

### State Management
- React useState for component state
- useEffect for data fetching and auto-refresh
- useRef for interval management
- No external state library needed

## Maintenance Notes

### Adding New Metrics
To add a new metric to track:
1. Update `src/lib/metrics.ts` to collect the metric
2. Update Prisma schema to store it
3. Add a new chart to `all-stats.tsx`
4. Follow existing chart patterns

### Modifying Chart Appearance
Chart styling is controlled by:
- `stroke` prop for line/border color
- `fill` prop for area fill color
- `strokeWidth` for line thickness
- `fillOpacity` for transparency

### Adjusting Time Ranges
Time range logic in `all-stats.tsx`:
- Modify the switch statement for different presets
- Add new buttons to the UI
- Update the API if needed

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

Note: datetime-local input may have different appearance across browsers but functionality is preserved.

## Summary

The enhanced All Stats page provides:
- **5 comprehensive charts** showing all key metrics
- **Flexible time range selection** with custom dates
- **Auto-refresh capability** for real-time monitoring
- **Excellent user experience** with tooltips and error handling
- **Responsive design** that works on all devices
- **Professional appearance** matching site theme
- **Easy maintenance** with clean, documented code

This implementation transforms raw metrics data into actionable insights through beautiful, interactive visualizations.
