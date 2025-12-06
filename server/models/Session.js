const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class Session {
  static collection() {
    return getDatabase().collection('sessions');
  }

  static async create(sessionData) {
    const session = {
      ...sessionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(session);
    return { ...session, _id: result.insertedId };
  }

  static async findById(id) {
    return await this.collection().findOne({ _id: new ObjectId(id) });
  }

  static async findByTrainerId(trainerId) {
    return await this.collection()
      .find({ trainerId })
      .sort({ scheduledDate: -1 })
      .toArray();
  }

  static async findByAthleteId(athleteId) {
    return await this.collection()
      .find({ athleteId })
      .sort({ scheduledDate: -1 })
      .toArray();
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

  static async updateStatus(id, status) {
    const result = await this.collection().updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  static async findUpcoming(trainerId) {
    return await this.collection()
      .find({
        trainerId,
        scheduledDate: { $gte: new Date() },
        status: { $in: ['scheduled', 'in-progress'] }
      })
      .sort({ scheduledDate: 1 })
      .toArray();
  }

  static async findAll(filter = {}) {
    return await this.collection()
      .find(filter)
      .sort({ scheduledDate: -1 })
      .toArray();
  }
}

module.exports = Session;
