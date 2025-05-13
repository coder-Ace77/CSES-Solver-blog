const bcrypt = require('bcrypt');

const args = process.argv.slice(2);
const password = args[0];

if (!password) {
  console.error('Please provide a password as a command line argument.');
  process.exit(1);
}

const saltRounds = 10; // You can adjust this value

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  console.log('Hashed password:', hash);
});