// scripts/generateFakeData.js
// Generate fake test data using Faker.js

const { faker } = require('@faker-js/faker');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Configuration
const NUM_USERS = 50;
const NUM_SERVICES = 30;
const NUM_BOOKINGS = 20;

async function generateFakeUsers() {
  console.log(`\n📝 Generating ${NUM_USERS} fake users...`);
  
  const users = [];
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);

  for (let i = 0; i < NUM_USERS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gsu.edu`;
    const gsuVerified = faker.datatype.boolean(0.8); // 80% verified

    try {
      const [result] = await db.query(
        'INSERT INTO User (name, email, password_hash, gsu_verified) VALUES (?, ?, ?, ?)',
        [name, email, defaultPassword, gsuVerified]
      );
      users.push(result.insertId);
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        console.error(`Error inserting user: ${error.message}`);
      }
    }
  }

  console.log(`✅ Generated ${users.length} users`);
  return users;
}

async function generateFakeServices(userIds) {
  console.log(`\n📝 Generating ${NUM_SERVICES} fake services...`);
  
  const categories = [
    'Academic', 'Physical', 'Professional', 'Creative', 
    'Health', 'Technology', 'Music', 'Transportation'
  ];

  const serviceTemplates = {
    'Academic': ['Tutoring', 'Study Group', 'Homework Help', 'Test Prep'],
    'Physical': ['Moving Help', 'Fitness Training', 'Sports Coaching', 'Yard Work'],
    'Professional': ['Resume Review', 'Interview Prep', 'Career Consulting', 'LinkedIn Profile'],
    'Creative': ['Photography', 'Graphic Design', 'Video Editing', 'Art Lessons'],
    'Health': ['Meal Prep', 'Nutrition Consulting', 'Yoga Classes', 'Mental Health Support'],
    'Technology': ['Web Development', 'App Design', 'Tech Support', 'Data Analysis'],
    'Music': ['Guitar Lessons', 'Piano Tutoring', 'DJ Services', 'Music Production'],
    'Transportation': ['Campus Rides', 'Airport Shuttle', 'Moving Services', 'Delivery']
  };

  const services = [];

  for (let i = 0; i < NUM_SERVICES; i++) {
    const category = faker.helpers.arrayElement(categories);
    const serviceType = faker.helpers.arrayElement(serviceTemplates[category]);
    const subject = faker.helpers.arrayElement(['Math', 'Science', 'Business', 'English', 'Art', 'Music']);
    
    const title = `${serviceType} - ${subject}`;
    const description = faker.lorem.sentences(2);
    const providerId = faker.helpers.arrayElement(userIds);
    const durationMin = faker.helpers.arrayElement([30, 45, 60, 90, 120]);
    const basePrice = faker.number.float({ min: 15, max: 100, fractionDigits: 2 });
    const active = faker.datatype.boolean(0.9); // 90% active

    try {
      const [result] = await db.query(
        'INSERT INTO Services (provider_id, title, category, description, duration_min, base_price_usd, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [providerId, title, category, description, durationMin, basePrice, active]
      );
      services.push(result.insertId);
    } catch (error) {
      console.error(`Error inserting service: ${error.message}`);
    }
  }

  console.log(`✅ Generated ${services.length} services`);
  return services;
}

async function generateFakeAvailability(userIds) {
  console.log(`\n📝 Generating availability slots...`);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let count = 0;

  // Generate 3-5 availability slots per provider
  for (const userId of userIds.slice(0, 25)) { // First 25 users are providers
    const numSlots = faker.number.int({ min: 3, max: 5 });
    
    for (let i = 1; i <= numSlots; i++) {
      const dow = faker.helpers.arrayElement(daysOfWeek);
      const startHour = faker.number.int({ min: 8, max: 18 });
      const duration = faker.helpers.arrayElement([2, 3, 4, 5]);
      const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(startHour + duration).toString().padStart(2, '0')}:00:00`;

      try {
        await db.query(
          'INSERT INTO AvailabilitySlot (provider_id, availability_id, dow, starttime, endtime) VALUES (?, ?, ?, ?, ?)',
          [userId, i, dow, startTime, endTime]
        );
        count++;
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`Error inserting availability: ${error.message}`);
        }
      }
    }
  }

  console.log(`✅ Generated ${count} availability slots`);
}

async function generateFakeBookings(serviceIds, userIds) {
  console.log(`\n📝 Generating ${NUM_BOOKINGS} fake bookings...`);
  
  // Get building IDs
  const [buildings] = await db.query('SELECT building_id FROM CampusBuilding');
  const buildingIds = buildings.map(b => b.building_id);

  const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  let count = 0;

  for (let i = 0; i < NUM_BOOKINGS; i++) {
    const serviceId = faker.helpers.arrayElement(serviceIds);
    
    // Get provider for this service
    const [serviceData] = await db.query('SELECT provider_id FROM Services WHERE service_id = ?', [serviceId]);
    if (serviceData.length === 0) continue;
    
    const providerId = serviceData[0].provider_id;
    
    // Get a random customer (different from provider)
    let customerId;
    do {
      customerId = faker.helpers.arrayElement(userIds);
    } while (customerId === providerId);

    const buildingId = faker.helpers.arrayElement(buildingIds);
    const startAt = faker.date.future();
    const endsAt = new Date(startAt.getTime() + 60 * 60 * 1000); // 1 hour later
    const status = faker.helpers.arrayElement(statuses);
    const price = faker.number.float({ min: 20, max: 80, fractionDigits: 2 });

    try {
      await db.query(
        'INSERT INTO Booking (service_id, provider_id, customer_id, building_id, start_at, ends_at, status, price_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [serviceId, providerId, customerId, buildingId, startAt, endsAt, status, price]
      );
      count++;
    } catch (error) {
      console.error(`Error inserting booking: ${error.message}`);
    }
  }

  console.log(`✅ Generated ${count} bookings`);
}

async function generateFakeReviews() {
  console.log(`\n📝 Generating fake reviews...`);
  
  // Get completed bookings
  const [completedBookings] = await db.query(
    'SELECT booking_id, customer_id FROM Booking WHERE status = "completed"'
  );

  let count = 0;

  for (const booking of completedBookings) {
    // 70% chance of having a review
    if (faker.datatype.boolean(0.7)) {
      const rating = faker.number.int({ min: 3, max: 5 }); // Mostly positive reviews
      const comment = faker.lorem.sentences(faker.number.int({ min: 1, max: 3 }));

      try {
        await db.query(
          'INSERT INTO Review (booking_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)',
          [booking.booking_id, booking.customer_id, rating, comment]
        );
        count++;
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`Error inserting review: ${error.message}`);
        }
      }
    }
  }

  console.log(`✅ Generated ${count} reviews`);
}

async function clearExistingData() {
  console.log('\n🗑️  Clearing existing test data...');
  
  try {
    await db.query('DELETE FROM Review WHERE review_id > 0');
    await db.query('DELETE FROM Booking WHERE booking_id > 0');
    await db.query('DELETE FROM AvailabilitySlot WHERE provider_id > 0');
    await db.query('DELETE FROM Services WHERE service_id > 0');
    await db.query('DELETE FROM User WHERE user_id > 0');
    
    console.log('✅ Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting fake data generation for PantherGigs...');
  
  try {
    // Optional: Clear existing data (comment out if you want to keep existing data)
    // await clearExistingData();

    // Generate data
    const userIds = await generateFakeUsers();
    const serviceIds = await generateFakeServices(userIds);
    await generateFakeAvailability(userIds);
    await generateFakeBookings(serviceIds, userIds);
    await generateFakeReviews();

    console.log('\n✨ Fake data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${NUM_USERS}`);
    console.log(`   - Services: ${NUM_SERVICES}`);
    console.log(`   - Bookings: ${NUM_BOOKINGS}`);
    console.log(`   - Default password for all users: password123`);
    
  } catch (error) {
    console.error('❌ Error generating fake data:', error);
  } finally {
    process.exit();
  }
}

// Run the script
main();
