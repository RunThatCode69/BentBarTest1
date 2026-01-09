/**
 * Migration script: Convert Team.coachId (single) to Team.coaches (array)
 *
 * Run this script ONCE after deploying the new Team model:
 * node server/scripts/migrateTeamCoaches.js
 *
 * This script:
 * 1. Finds all teams with the old coachId field
 * 2. Converts coachId to coaches array with role 'owner'
 * 3. Removes the old coachId field
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function migrateTeams() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const teamsCollection = db.collection('teams');

    // Find all teams that have the old coachId field but no coaches array
    const teamsToMigrate = await teamsCollection.find({
      coachId: { $exists: true },
      $or: [
        { coaches: { $exists: false } },
        { coaches: { $size: 0 } }
      ]
    }).toArray();

    console.log(`Found ${teamsToMigrate.length} teams to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const team of teamsToMigrate) {
      try {
        // Convert coachId to coaches array
        await teamsCollection.updateOne(
          { _id: team._id },
          {
            $set: {
              coaches: [{
                coachId: team.coachId,
                role: 'owner',
                addedAt: team.createdAt || new Date()
              }]
            },
            $unset: { coachId: '' }
          }
        );
        migratedCount++;
        console.log(`Migrated team: ${team.teamName} (${team._id})`);
      } catch (err) {
        errorCount++;
        console.error(`Failed to migrate team ${team._id}:`, err.message);
      }
    }

    console.log('\n--- Migration Complete ---');
    console.log(`Successfully migrated: ${migratedCount} teams`);
    console.log(`Errors: ${errorCount}`);

    // Verify migration
    const remainingOldFormat = await teamsCollection.countDocuments({
      coachId: { $exists: true }
    });

    if (remainingOldFormat > 0) {
      console.warn(`\nWARNING: ${remainingOldFormat} teams still have old coachId field`);
    } else {
      console.log('\nAll teams have been migrated to the new format');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateTeams();
