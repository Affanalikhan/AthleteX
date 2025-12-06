const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class SAIData {
  static collection() {
    return getDatabase().collection('sai_data');
  }

  static async create(saiData) {
    const data = {
      ...saiData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(data);
    return { ...data, _id: result.insertedId };
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

  static async getDashboardStats() {
    const athletes = await getDatabase().collection('athletes').countDocuments();
    const trainers = await getDatabase().collection('trainers').countDocuments({ 'verification.status': 'verified' });
    const assessments = await getDatabase().collection('assessments').countDocuments();
    const sessions = await getDatabase().collection('sessions').countDocuments();

    return {
      totalAthletes: athletes,
      totalTrainers: trainers,
      totalAssessments: assessments,
      totalSessions: sessions,
      timestamp: new Date()
    };
  }

  static async getAthleteRankings(limit = 50) {
    return await getDatabase().collection('athletes')
      .find({})
      .sort({ 'performance.overallScore': -1 })
      .limit(limit)
      .toArray();
  }

  static async getTrainerVerificationQueue() {
    return await getDatabase().collection('trainers')
      .find({ 'verification.status': 'pending' })
      .sort({ createdAt: 1 })
      .toArray();
  }

  static async getRecentAssessments(limit = 20) {
    return await getDatabase().collection('assessments')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  static async getPerformanceTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await getDatabase().collection('performance_metrics')
      .aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            avgScore: { $avg: '$overallScore' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();
  }

  static async getSportDistribution() {
    return await getDatabase().collection('athletes')
      .aggregate([
        {
          $group: {
            _id: '$profile.sport',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
      .toArray();
  }
}

module.exports = SAIData;
