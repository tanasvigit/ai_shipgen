const androidGoogleMapsApiKey = process.env.ANDROID_GOOGLE_MAPS_API_KEY || ''

module.exports = {
  expo: {
    name: 'ShipGen Driver',
    slug: 'shipgen-driver-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Allow ShipGen Driver to use your location for trip updates.',
        },
      ],
      'expo-asset',
    ],
    extra: {
      eas: {
        projectId: '250bb499-8398-4278-971c-af9ac28dc811',
      },
    },
    android: {
      package: 'com.lawde123.shipgendrivermobile',
      config: {
        googleMaps: {
          apiKey: androidGoogleMapsApiKey,
        },
      },
    },
  },
}
