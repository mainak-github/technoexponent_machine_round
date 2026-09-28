import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {confirmBooking, getEvent} from '../services/api';
import {RootStackParamList} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Checkout'
>;

const USER_ID = 'mainak@example.com';

const CheckoutScreen = ({route, navigation}: Props) => {
  const {hold} = route.params;

  const [seconds, setSeconds] = useState(() =>
    getRemainingSeconds(hold.expires_at),
  );

  const [confirming, setConfirming] = useState(false);
  const [expired, setExpired] = useState(false);

  const expiryHandled = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getRemainingSeconds(
        hold.expires_at,
      );

      setSeconds(remaining);

      if (remaining <= 0 && !expiryHandled.current) {
        expiryHandled.current = true;

        handleExpiry();
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [hold.expires_at]);

  const handleExpiry = async () => {
    setExpired(true);

    try {
      /*
       * Get the latest availability from the server.
       * This makes sure we don't rely only on the local timer.
       */
      await getEvent(hold.event);
    } catch {
      // The Event screen will try again when it becomes active.
    }

    Alert.alert(
      'Reservation expired',
      'Your seat reservation has expired and the seats are available again.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleConfirm = async () => {
    if (
      confirming ||
      expired ||
      seconds <= 0
    ) {
      return;
    }

    try {
      setConfirming(true);

      await confirmBooking(
        hold.id,
        USER_ID,
      );

      Alert.alert(
        'Booking confirmed',
        'Your seats have been booked successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.popToTop();
            },
          },
        ],
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        'Unable to confirm booking.';

      Alert.alert(
        'Booking failed',
        message,
      );
    } finally {
      setConfirming(false);
    }
  };

  const minutes = Math.floor(seconds / 60);

  const remainingSeconds = seconds % 60;

  const timerText =
    `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Your Reservation
      </Text>

      <Text style={styles.info}>
        Seats: {hold.quantity}
      </Text>

      <Text
        style={[
          styles.timer,
          seconds <= 10 && styles.timerWarning,
        ]}>
        {timerText}
      </Text>

      {expired ? (
        <Text style={styles.expiredText}>
          Reservation expired
        </Text>
      ) : (
        <Text style={styles.message}>
          Your seats are temporarily reserved.
        </Text>
      )}

      <Button
        title={
          confirming
            ? 'Confirming...'
            : 'Confirm Booking'
        }
        onPress={handleConfirm}
        disabled={
          confirming ||
          expired ||
          seconds <= 0
        }
      />
    </View>
  );
};

const getRemainingSeconds = (
  expiresAt: string,
) => {
  const expiresTime =
    new Date(expiresAt).getTime();

  const currentTime = Date.now();

  return Math.max(
    0,
    Math.floor(
      (expiresTime - currentTime) / 1000,
    ),
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },

  info: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },

  timer: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  timerWarning: {
    fontWeight: '800',
  },

  message: {
    textAlign: 'center',
    marginBottom: 24,
  },

  expiredText: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
});

export default CheckoutScreen;