const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('DB Connected!');
  
  // Check if admin exists
  let admin = await User.findOne({ role: 'admin' });
  
  if (!admin) {
    admin = await User.create({
      username: 'Suhrobiddin',
      email: 'nuraliyevsuhrobiddin@gmail.com',
      password: 'Suhrob2005', // Model avtomatik hash qiladi
      role: 'admin'
    });
    console.log('--- ADMIN YARATILDI ---');
  } else {
    // Parolni reset qilib qoyamiz har extimolga qarshi
    admin.email = 'nuraliyevsuhrobiddin@gmail.com';
    admin.username = 'Suhrobiddin';
    admin.password = 'Suhrob2005'; // auto hashing running on save
    await admin.save();
    console.log('--- MAVJUD ADMIN TOPILDI VA PAROLI TICKLANDI ---');
  }
  
  console.log('Email: nuraliyevsuhrobiddin@gmail.com');
  console.log('Parol: Suhrob2005');
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
