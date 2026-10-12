import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GeoLocationCoords {
    latitude: number;
    longitude: number;
}

/** Coordonnées de référence du Centre-ville de Yamoussoukro (Mairie / Grande Mosquée / Basilique) */
export const YAKRO_DEFAULT_COORDS: GeoLocationCoords = {
    latitude: 6.8276,
    longitude: -5.2893,
};

export async function getCurrentLocation(): Promise<GeoLocationCoords> {
    if (Capacitor.isNativePlatform()) {
        try {
            const permissions = await Geolocation.checkPermissions();
            if (permissions.location !== 'granted') {
                const request = await Geolocation.requestPermissions();
                if (request.location !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 8000,
            });

            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
        } catch (error) {
            console.error('Capacitor Geolocation error:', error);
            return getBrowserLocation();
        }
    } else {
        return getBrowserLocation();
    }
}

function getBrowserLocation(): Promise<GeoLocationCoords> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        // Essai 1 : Haute précision avec timeout de 5s
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (firstError) => {
                // Essai 2 : Basse précision (IP / Wi-Fi réseau, fonctionne sur PC/Mac sans GPS matériel)
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (secondError) => {
                        reject(secondError || firstError);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 7000,
                        maximumAge: 60000,
                    }
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 30000,
            }
        );
    });
}
