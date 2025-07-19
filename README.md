# Bestpresso - Coffee Logger

A minimalistic, responsive web application for logging coffee brewing sessions. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **Log Coffee Sessions**: Record grounds in, brewing time, coffee out, last clean date, and brand
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Local Storage**: Data persists in your browser's local storage
- **Clean UI**: Modern, minimalistic design with smooth animations
- **Yield Calculation**: Automatically calculates and displays extraction yield percentage
- **Data Export/Import**: Export logs as JSON and import them back

## Getting Started

1. **Open the Website**: Simply open `index.html` in any modern web browser
2. **No Installation Required**: This is a static website that runs entirely in your browser
3. **Start Logging**: Fill in the required fields and click "Log Coffee"

## Required Fields

- **Grounds In (grams)**: Amount of coffee grounds used (supports decimal values)
- **Time (seconds)**: Brewing time in seconds (whole numbers only)
- **Coffee Out (grams)**: Amount of coffee produced (supports decimal values)

## Optional Fields

- **Last Clean**: Date when you last cleaned your equipment
- **Brand**: Coffee brand or variety name

## Features

### Automatic Calculations
The app automatically calculates the extraction yield percentage (coffee out / grounds in × 100) for each log entry.

### Data Persistence
All your coffee logs are saved locally in your browser's storage, so they'll persist between sessions.

### Mobile-Friendly
The interface is optimized for mobile devices with touch-friendly inputs and responsive layout.

### Clean Interface
- Modern gradient background
- Card-based layout
- Smooth animations
- Clear typography using Inter font

## Browser Compatibility

Works in all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## Data Management

- **Clear All Logs**: Use the "Clear All Logs" button to remove all stored data
- **Local Storage**: Data is stored in your browser's localStorage
- **No Server Required**: Everything runs locally in your browser

## File Structure

```
bestpresso/
├── index.html      # Main HTML file
├── styles.css      # CSS styles
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Usage Tips

1. **Consistent Measurements**: Use a scale for accurate weight measurements
2. **Regular Logging**: Log each brewing session to track your progress
3. **Yield Tracking**: Monitor your extraction yield to optimize your brewing technique
4. **Brand Notes**: Use the brand field to track which coffees work best for you

## Privacy

All data is stored locally in your browser. No data is sent to any external servers or services.

## Future Enhancements

Potential features that could be added:
- Data visualization and charts
- Brewing recipe templates
- Equipment tracking
- Coffee bean inventory
- Brewing tips and guides

---

Enjoy your coffee journey! ☕ 