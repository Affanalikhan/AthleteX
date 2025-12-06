const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class Assessment {
  static collection() {
    return getDatabase().collection('assessments');
  }

  static async create(assessmentData) {
    const assessment = {
      ...assessmentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(assessment);
    return { ...assessment, _id: result.insertedId };
  }

  static async findById(id) {
    return await this.collection().findOne({ _id: new ObjectId(id) });
  }

  static async findByUserId(userId) {
    return await this.collection()
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async findByAthleteId(athleteId) {
    return await this.collection()
      .find({ athleteId })
      .sort({ createdAt: -1 })
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

  static async findAll(filter = {}) {
    return await this.collection()
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async findRecent(limit = 10) {
    return await this.collection()
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  static async getStatsByUserId(userId) {
    return await this.collection().aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$testType',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' }
        }
      }
    ]).toArray();
  }
}

module.exports = Assessment;
