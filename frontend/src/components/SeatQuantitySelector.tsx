import React from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';

type Props = {
  quantity: number;
  max: number;
  onChange: (value: number) => void;
};

const SeatQuantitySelector = ({quantity, max, onChange}: Props) => {
  const decrease = () => {
    if (quantity > 1) {
      onChange(quantity - 1);
    }
  };

  const increase = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="-" onPress={decrease} disabled={quantity <= 1} />

      <Text style={styles.quantity}>{quantity}</Text>

      <Button title="+" onPress={increase} disabled={quantity >= max} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 20,
  },
  quantity: {
    fontSize: 22,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
});

export default SeatQuantitySelector;