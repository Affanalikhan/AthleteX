const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class Athlete {
  static collection() {
    return getDatabase().collection('athletes');
  }

  static async create(athleteData) {
    const athlete = {
      ...athleteData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(athlete);
    return { ...athlete, _id: result.insertedId };
  }

  static async findByUserId(userId) {
    return await this.collection().findOne({ userId });
  }

  static async findByEmail(email) {
    return await this.collection().findOne({ email });
  }

  static async findById(id) {
    return await this.collection().findOne({ _id: new ObjectId(id) });
  }

  static async update(id, updateData) {
    const result = await this.collection().updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  static async updateProfile(userId, profileData) {
    const result = await this.collection().updateOne(
      { userId },
      { 
        $set: { 
          profile: profileData,
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  static async findAll(filter = {}) {
    return await this.collection().find(filter).toArray();
  }

  static async findTopAthletes(limit = 10) {
    return await this.collection()
      .find({})
      .sort({ 'performance.overallScore': -1 })
      .limit(limit)
      .toArray();
  }

  static async findBySport(sport) {
    return await this.collection().find({ 
      'profile.sport': sport 
    }).toArray();
  }
}

module.exports = Athlete;
