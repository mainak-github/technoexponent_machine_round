import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  Button,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useFocusEffect} from '@react-navigation/native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import ErrorView from '../components/ErrorView';
import LoadingView from '../components/LoadingView';
import SeatQuantitySelector from '../components/SeatQuantitySelector';

import {
  connectToEvent,
  createHold,
  getEvent,
} from '../services/api';

import {
  RootStackParamList,
} from '../navigation/AppNavigator';

import {Event} from '../types/booking';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Event'
>;

const EVENT_ID = 1;

const USER_ID = 'mainak@example.com';

const EventScreen = ({navigation}: Props) => {
  const [event, setEvent] = useState<Event | null>(null);

  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [holding, setHolding] = useState(false);

  const [error, setError] = useState('');

  const [socketConnected, setSocketConnected] =
    useState(false);

  /*
   * Get the latest event from the backend.
   */
  const loadEvent = useCallback(async () => {
    try {
      setError('');

      const data = await getEvent(EVENT_ID);

      setEvent(data);

      /*
       * Make sure the selected quantity is still valid
       * after availability changes.
       */
      setQuantity(currentQuantity => {
        if (data.available_seats <= 0) {
          return 0;
        }

        if (currentQuantity <= 0) {
          return 1;
        }

        if (
          currentQuantity >
          data.available_seats
        ) {
          return data.available_seats;
        }

        return currentQuantity;
      });
    } catch (err) {
      setError('Unable to load event.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * Initial event load.
   */
  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  /*
   * Refresh the event whenever this screen becomes
   * active again.
   *
   * This is important after returning from Checkout.
   */
  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [loadEvent]),
  );

  /*
   * Connect to the event WebSocket.
   *
   * Whenever the backend broadcasts a new availability
   * value, update the screen immediately.
   */
  useEffect(() => {
    const socket = connectToEvent(
      EVENT_ID,
      availableSeats => {
        setSocketConnected(true);

        setEvent(currentEvent => {
          if (!currentEvent) {
            return currentEvent;
          }

          return {
            ...currentEvent,
            available_seats: availableSeats,
          };
        });

        /*
         * Make sure the selected quantity never becomes
         * greater than the currently available seats.
         */
        setQuantity(currentQuantity => {
          if (availableSeats <= 0) {
            return 0;
          }

          if (currentQuantity <= 0) {
            return 1;
          }

          if (
            currentQuantity >
            availableSeats
          ) {
            return availableSeats;
          }

          return currentQuantity;
        });
      },
      () => {
        setSocketConnected(false);
      },
    );

    return () => {
      socket.close();
    };
  }, []);

  /*
   * Manual pull-to-refresh.
   *
   * WebSocket normally keeps availability updated,
   * but this is useful as a fallback.
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadEvent();
  };

  /*
   * Reserve the selected number of seats.
   */
  const handleHold = async () => {
    if (!event) {
      return;
    }

    if (holding) {
      return;
    }

    if (quantity <= 0) {
      Alert.alert(
        'Invalid quantity',
        'Please select at least one seat.',
      );

      return;
    }

    if (
      quantity >
      event.available_seats
    ) {
      Alert.alert(
        'Not enough seats',
        'The selected number of seats is no longer available.',
      );

      await loadEvent();

      return;
    }

    try {
      setHolding(true);

      const hold = await createHold(
        event.id,
        USER_ID,
        quantity,
      );

      /*
       * Navigate to Checkout with the server-created
       * hold and its expiry timestamp.
       */
      navigation.navigate('Checkout', {
        hold,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        'Unable to reserve seats.';

      Alert.alert(
        'Reservation failed',
        message,
      );

      /*
       * Availability may have changed because another
       * user booked/held seats.
       */
      await loadEvent();
    } finally {
      setHolding(false);
    }
  };

  /*
   * Loading state.
   */
  if (loading) {
    return <LoadingView />;
  }

  /*
   * Error / missing event state.
   */
  if (error || !event) {
    return (
      <ErrorView
        message={
          error || 'Event not found.'
        }
        onRetry={loadEvent}
      />
    );
  }

  const soldOut =
    event.available_seats <= 0;

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }>
      <View style={styles.card}>
        <Text style={styles.title}>
          {event.name}
        </Text>

        <View style={styles.availabilityRow}>
          <Text style={styles.availableSeats}>
            {event.available_seats}{' '}
            {event.available_seats === 1
              ? 'seat'
              : 'seats'}{' '}
            available
          </Text>

          <View
            style={[
              styles.socketDot,
              socketConnected
                ? styles.connected
                : styles.disconnected,
            ]}
          />
        </View>

        <Text style={styles.totalSeats}>
          Total seats: {event.total_seats}
        </Text>

        {socketConnected && (
          <Text style={styles.liveText}>
            Live availability
          </Text>
        )}

        {soldOut ? (
          <View style={styles.soldOutContainer}>
            <Text style={styles.soldOut}>
              Sold out
            </Text>
          </View>
        ) : (
          <>
            <SeatQuantitySelector
              quantity={quantity}
              max={event.available_seats}
              onChange={setQuantity}
            />

            <View style={styles.buttonContainer}>
              <Button
                title={
                  holding
                    ? 'Reserving...'
                    : 'Reserve Seats'
                }
                onPress={handleHold}
                disabled={
                  holding ||
                  quantity <= 0 ||
                  quantity >
                    event.available_seats
                }
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },

  card: {
    padding: 28,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },

  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  availableSeats: {
    fontSize: 20,
    fontWeight: '500',
  },

  totalSeats: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },

  liveText: {
    fontSize: 13,
    color: 'green',
    marginBottom: 16,
  },

  socketDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: 8,
  },

  connected: {
    backgroundColor: 'green',
  },

  disconnected: {
    backgroundColor: '#999999',
  },

  soldOutContainer: {
    marginTop: 24,
    alignItems: 'center',
  },

  soldOut: {
    fontSize: 20,
    fontWeight: '700',
  },

  buttonContainer: {
    marginTop: 20,
  },
});

export default EventScreen;