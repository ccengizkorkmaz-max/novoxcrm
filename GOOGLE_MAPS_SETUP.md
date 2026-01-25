# Google Maps API Key Setup

To enable the interactive map location picker, you need a Google Maps API key.

## Steps:

1. **Get API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Maps JavaScript API" and "Geocoding API"
   - Go to "Credentials" and create an API key
   - Restrict the key to your domain for security

2. **Add to Environment:**
   - Open `.env.local`
   - Add: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here`

3. **Update Component:**
   - Open `src/components/location-picker.tsx`
   - Replace `YOUR_API_KEY_HERE` with `${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

## Usage:
- Click the map pin icon to open the interactive map
- Click anywhere on the map to place a marker
- Drag the marker to adjust position
- Click "Kaydet" to save the location
- The address is automatically fetched via reverse geocoding
