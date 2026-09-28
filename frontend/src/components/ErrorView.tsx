import React from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';

type Props = {
  message: string;
  onRetry: () => void;
};

const ErrorView = ({message, onRetry}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>

      <Button title="Try Again" onPress={onRetry} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ErrorView;