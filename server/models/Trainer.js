const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class Trainer {
  static collection() {
    return getDatabase().collection('trainers');
  }

  static async create(trainerData) {
    const trainer = {
      ...trainerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(trainer);
    return { ...trainer, _id: result.insertedId };
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

  static async updateKYC(trainerId, kycData) {
    const result = await this.collection().updateOne(
      { _id: new ObjectId(trainerId) },
      { 
        $set: { 
          'verification.kyc': kycData,
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  static async findVerified() {
    return await this.collection().find({ 
      'verification.status': 'verified' 
    }).toArray();
  }

  static async findBySport(sport) {
    return await this.collection().find({
      $or: [
        { 'sportsExpertise.primarySport': sport },
        { 'sportsExpertise.secondarySports': sport }
      ],
      'verification.status': 'verified'
    }).toArray();
  }

  static async findAll(filter = {}) {
    return await this.collection().find(filter).toArray();
  }
}

module.exports = Trainer;
