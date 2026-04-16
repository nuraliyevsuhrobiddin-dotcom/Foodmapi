export const MOCK_RESTAURANTS = [
  {
    id: '1',
    name: 'Qarshi Milliy Taomlari',
    rating: 4.8,
    reviews: 245,
    distance: 1.2,
    description: 'Eng mazali Qashqadaryo tandir goshti va milliy taomlar.',
    type: 'Milliy',
    coverImage: 'https://images.unsplash.com/photo-1542315181-70ee9795f50f?q=80&w=600&auto=format&fit=crop',
    address: 'Qarshi shahar, Islom Karimov ko\'chasi, 24-uy',
    hours: '08:00 - 23:00',
    coordinates: [38.8615, 65.7854], // Qarshi center
    menu: [
      { id: 'm1', name: 'Tandir go\'sht', price: '120,000 so\'m', image: 'https://images.unsplash.com/photo-1603099507971-55db29a39f60?w=300&h=300&fit=crop' },
      { id: 'm2', name: 'Qashqadaryo somsa', price: '15,000 so\'m', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&h=300&fit=crop' },
      { id: 'm3', name: 'Moshxo\'rda', price: '30,000 so\'m', image: 'https://plus.unsplash.com/premium_photo-1663852297801-4475510655d9?w=300&h=300&fit=crop' }
    ]
  },
  {
    id: '2',
    name: 'Nasaf Mega Cafe',
    rating: 4.5,
    reviews: 180,
    distance: 2.5,
    description: 'Zamonaviy shinam kafe, Yevropa va milliy taomlar muhiti.',
    type: 'Kafe',
    coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop',
    address: 'Qarshi, Mustaqillik shox ko\'chasi',
    hours: '09:00 - 22:00',
    coordinates: [38.8650, 65.7900],
    menu: [
      { id: 'm4', name: 'Latte', price: '25,000 so\'m', image: 'https://images.unsplash.com/photo-1510594247504-20d0f5077cc2?w=300&h=300&fit=crop' },
      { id: 'm5', name: 'Cheesecake', price: '35,000 so\'m', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop' }
    ]
  },
  {
    id: '3',
    name: 'Burger Uz - Qarshi',
    rating: 4.3,
    reviews: 532,
    distance: 0.8,
    description: 'Tezkor tayyorlanadigan mazzali burgerlar va fast food.',
    type: 'Fast Food',
    coverImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop',
    address: 'Navoiy bog\'i ro\'parasi, Qarshi',
    hours: '10:00 - 02:00',
    coordinates: [38.8590, 65.7820],
    menu: [
      { id: 'm6', name: 'Cheeseburger', price: '35,000 so\'m', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop' },
      { id: 'm7', name: 'Fri kartoshka', price: '15,000 so\'m', image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&h=300&fit=crop' },
      { id: 'm8', name: 'Coca Cola', price: '10,000 so\'m', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop' }
    ]
  },
  {
    id: '4',
    name: 'Shahrisabz Oqsaroy Restorani',
    rating: 4.9,
    reviews: 890,
    distance: 4.0,
    description: 'Haqiqiy shohona dam olish va mazzali betakror taomlar',
    type: 'Milliy',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop',
    address: 'Qarshi, Amir Temur ko\'chasi',
    hours: '11:00 - 23:00',
    coordinates: [38.8700, 65.7750],
    menu: [
      { id: 'm9', name: 'Osh', price: '45,000 so\'m', image: 'https://images.unsplash.com/photo-1528659101037-77bb6cb1eeb4?w=300&h=300&fit=crop' },
      { id: 'm10', name: 'Shashlik assorti', price: '90,000 so\'m', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=300&fit=crop' }
    ]
  }
];

export const CATEGORIES = ['Hammasi', 'Saqlanganlar', 'Milliy', 'Fast Food', 'Kafe'];
