import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CheckoutScreen({ navigation }: any) {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod'|'online'>('cod');

  const delivery = totalAmount >= 500 ? 0 : 50;
  const total = totalAmount + delivery;

  const placeOrder = async () => {
    if (!name || !phone || !address || !pincode || !city) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    const itemsList = items.map(i => `${i.product.nameEn} x${i.quantity} = Rs${i.product.price * i.quantity}`).join('\n');
    const msg = `Ever Pure Order\n\n${itemsList}\n\nAddress: ${name}, ${address}, ${city} - ${pincode}\nPhone: ${phone}\n\nDelivery: ${delivery === 0 ? 'FREE' : 'Rs' + delivery}\nTotal: Rs${total}\nPayment: ${paymentMethod === 'cod' ? 'COD' : 'Online'}`;
    try {
      await Linking.openURL(`https://wa.me/919711121512?text=${encodeURIComponent(msg)}`);
      clearCart();
      Alert.alert('Success', 'Order placed! Check WhatsApp.', [{ text: 'OK', onPress: () => navigation.navigate('Home') }]);
    } catch (e) { Alert.alert('Error', 'Failed to place order'); }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <View style={s.empty}>
        <Ionicons name="cart-outline" size={80} color="#ccc" />
        <Text style={s.emptyTxt}>Cart is empty</Text>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Home')}>
          <Text style={s.btnTxt}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={s.title}>Checkout</Text>
        <View style={{width:24}}/>
      </View>
      <ScrollView style={s.content}>
        <View style={s.section}>
          <Text style={s.secTitle}>Order Summary</Text>
          {items.map(i => (
            <View key={i.product.id} style={s.row}>
              <Text style={s.itemName}>{i.product.nameEn} x{i.quantity}</Text>
              <Text style={s.itemPrice}>₹{i.product.price * i.quantity}</Text>
            </View>
          ))}
          <View style={s.divider}/>
          <View style={s.row}><Text>Subtotal</Text><Text>₹{totalAmount}</Text></View>
          <View style={s.row}><Text>Delivery</Text><Text style={delivery===0?s.free:undefined}>{delivery===0?'FREE':'₹'+delivery}</Text></View>
          {totalAmount < 500 && <Text style={s.hint}>Add ₹{500-totalAmount} more for FREE delivery</Text>}
          <View style={s.divider}/>
          <View style={s.row}><Text style={s.totalLbl}>Total</Text><Text style={s.totalVal}>₹{total}</Text></View>
        </View>
        <View style={s.section}>
          <Text style={s.secTitle}>Shipping Address</Text>
          <TextInput style={s.input} placeholder="Full Name *" value={name} onChangeText={setName} placeholderTextColor="#999"/>
          <TextInput style={s.input} placeholder="Phone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#999"/>
          <TextInput style={[s.input,{height:80,textAlignVertical:'top'}]} placeholder="Address *" value={address} onChangeText={setAddress} multiline placeholderTextColor="#999"/>
          <View style={s.rowInput}>
            <TextInput style={[s.input,{flex:1,marginRight:10}]} placeholder="Pincode *" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} placeholderTextColor="#999"/>
            <TextInput style={[s.input,{flex:1}]} placeholder="City *" value={city} onChangeText={setCity} placeholderTextColor="#999"/>
          </View>
        </View>
        <View style={s.section}>
          <Text style={s.secTitle}>Payment</Text>
          <TouchableOpacity style={[s.payOpt,paymentMethod==='cod'&&s.payOptActive]} onPress={()=>setPaymentMethod('cod')}>
            <Ionicons name={paymentMethod==='cod'?'radio-button-on':'radio-button-off'} size={22} color={paymentMethod==='cod'?'#059669':'#999'}/>
            <Text style={s.payTxt}>Cash on Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.payOpt,paymentMethod==='online'&&s.payOptActive]} onPress={()=>setPaymentMethod('online')}>
            <Ionicons name={paymentMethod==='online'?'radio-button-on':'radio-button-off'} size={22} color={paymentMethod==='online'?'#059669':'#999'}/>
            <Text style={s.payTxt}>Pay Online (UPI/Card)</Text>
          </TouchableOpacity>
        </View>
        <View style={{height:100}}/>
      </ScrollView>
      <View style={s.footer}>
        <View>
          <Text style={s.footerLbl}>Total</Text>
          <Text style={s.footerVal}>₹{total}</Text>
        </View>
        <TouchableOpacity style={s.placeBtn} onPress={placeOrder} disabled={loading}>
          {loading?<ActivityIndicator color="#fff"/>:<Text style={s.placeTxt}>Place Order</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#f9fafb'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:20,paddingTop:50,backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#e5e7eb'},
  title:{fontSize:18,fontWeight:'bold',color:'#111'},
  content:{flex:1},
  section:{backgroundColor:'#fff',margin:15,marginBottom:0,padding:20,borderRadius:12},
  secTitle:{fontSize:16,fontWeight:'bold',color:'#111',marginBottom:15},
  row:{flexDirection:'row',justifyContent:'space-between',marginBottom:8},
  itemName:{fontSize:14,color:'#374151',flex:1},
  itemPrice:{fontSize:14,fontWeight:'600',color:'#111'},
  divider:{height:1,backgroundColor:'#e5e7eb',marginVertical:12},
  free:{color:'#059669',fontWeight:'600'},
  hint:{fontSize:12,color:'#f59e0b',marginTop:5},
  totalLbl:{fontSize:16,fontWeight:'bold',color:'#111'},
  totalVal:{fontSize:18,fontWeight:'bold',color:'#059669'},
  input:{backgroundColor:'#f9fafb',borderWidth:1,borderColor:'#e5e7eb',borderRadius:8,padding:12,fontSize:16,color:'#111',marginBottom:12},
  rowInput:{flexDirection:'row'},
  payOpt:{flexDirection:'row',alignItems:'center',padding:15,borderWidth:1,borderColor:'#e5e7eb',borderRadius:12,marginBottom:10},
  payOptActive:{borderColor:'#059669',backgroundColor:'#f0fdf4'},
  payTxt:{marginLeft:12,fontSize:16,color:'#111'},
  footer:{backgroundColor:'#fff',padding:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderTopColor:'#e5e7eb'},
  footerLbl:{fontSize:12,color:'#6b7280'},
  footerVal:{fontSize:20,fontWeight:'bold',color:'#059669'},
  placeBtn:{backgroundColor:'#059669',paddingHorizontal:30,paddingVertical:14,borderRadius:12},
  placeTxt:{color:'#fff',fontWeight:'600',fontSize:16},
  empty:{flex:1,justifyContent:'center',alignItems:'center'},
  emptyTxt:{fontSize:18,color:'#374151',marginTop:20},
  btn:{marginTop:20,backgroundColor:'#059669',paddingHorizontal:30,paddingVertical:12,borderRadius:8},
  btnTxt:{color:'#fff',fontWeight:'600'},
});
