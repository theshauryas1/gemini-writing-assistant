
export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  image?: string; // base64 string
  isError?: boolean;
}

export interface UserPreferences {
  name: string;
  communicationStyle: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  error?: string;
}
