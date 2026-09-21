import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GeoLocationCoords {
    latitude: number;
    longitude: number;
}

export async function getCurrentLocation(): Promise<GeoLocationCoords> {
    if (Capacitor.isNativePlatform()) {
        try {
            // Check permissions first on native
            const permissions = await Geolocation.checkPermissions();
            if (permissions.location !== 'granted') {
                const request = await Geolocation.requestPermissions();
                if (request.location !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000
            });

            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
        } catch (error) {
            console.error('Capacitor Geolocation error:', error);
            // Fallback to browser geolocation even if on native (sometimes works better in some webviews)
            return getBrowserLocation();
        }
    } else {
        return getBrowserLocation();
    }
}

function getBrowserLocation(): Promise<GeoLocationCoords> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}
