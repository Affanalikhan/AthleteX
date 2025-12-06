const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class Performance {
  static collection() {
    return getDatabase().collection('performance_metrics');
  }

  static async create(performanceData) {
    const performance = {
      ...performanceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(performance);
    return { ...performance, _id: result.insertedId };
  }

  static async findById(id) {
    return await this.collection().findOne({ _id: new ObjectId(id) });
  }

  static async findByUserId(userId) {
    return await this.collection()
      .find({ userId })
      .sort({ date: -1 })
      .toArray();
  }

  static async findByUserIdAndDateRange(userId, startDate, endDate) {
    return await this.collection()
      .find({
        userId,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
      .sort({ date: 1 })
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

  static async getLatestByUserId(userId) {
    return await this.collection()
      .findOne({ userId }, { sort: { date: -1 } });
  }

  static async getAveragesByUserId(userId) {
    return await this.collection().aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          avgSpeed: { $avg: '$speed' },
          avgEndurance: { $avg: '$endurance' },
          avgStrength: { $avg: '$strength' },
          avgAgility: { $avg: '$agility' },
          avgFlexibility: { $avg: '$flexibility' }
        }
      }
    ]).toArray();
  }
}

module.exports = Performance;
