import axios from 'axios';
import {Platform} from 'react-native';

const baseUrl =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
});

export const getEvent = async (eventId: number) => {
  const response = await api.get(`/events/${eventId}/`);
  return response.data;
};

export const createHold = async (
  eventId: number,
  userIdentifier: string,
  quantity: number,
) => {
  const response = await api.post(`/events/${eventId}/hold/`, {
    user_identifier: userIdentifier,
    quantity,
  });

  return response.data;
};

export const confirmBooking = async (
  holdId: number,
  userIdentifier: string,
) => {
  const response = await api.post(`/holds/${holdId}/confirm/`, {
    user_identifier: userIdentifier,
  });

  return response.data;
};



export const connectToEvent = (
  eventId: number,
  onAvailability: (availableSeats: number) => void,
  onError?: () => void,
) => {
  const socket = new WebSocket(
    `ws://10.0.2.2:8000/ws/events/${eventId}/`,
  );

  socket.onmessage = event => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'availability') {
        onAvailability(data.available_seats);
      }
    } catch {
      // Ignore invalid socket messages
    }
  };

  socket.onerror = () => {
    onError?.();
  };

  return socket;
};