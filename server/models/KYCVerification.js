const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class KYCVerification {
  static collection() {
    return getDatabase().collection('kyc_verifications');
  }

  static async create(kycData) {
    const kyc = {
      ...kycData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(kyc);
    return { ...kyc, _id: result.insertedId };
  }

  static async findByTrainerId(trainerId) {
    return await this.collection().findOne({ trainerId });
  }

  static async updateAadhar(trainerId, aadharData) {
    const result = await this.collection().updateOne(
      { trainerId },
      { 
        $set: { 
          aadharCard: aadharData,
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  static async updatePAN(trainerId, panData) {
    const result = await this.collection().updateOne(
      { trainerId },
      { 
        $set: { 
          panCard: panData,
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  static async updateEmail(trainerId, emailData) {
    const result = await this.collection().updateOne(
      { trainerId },
      { 
        $set: { 
          email: emailData,
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  static async updatePhone(trainerId, phoneData) {
    const result = await this.collection().updateOne(
      { trainerId },
      { 
        $set: { 
          phone: phoneData,
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  static async verifyAadhar(trainerId) {
    const result = await this.collection().updateOne(
      { trainerId },
      { 
        $set: { 
          'aadharCard.verified': true,
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  static async verifyPAN(trainerId) {
    const result = await this.collection().updateOne(
      { trainerId },
      { 
        $set: { 
          'panCard.verified': true,
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  static async verifyEmail(trainerId) {
    const result = await this.collection().updateOne(
      { trainerId },
      { 
        $set: { 
          'email.verified': true,
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  static async verifyPhone(trainerId) {
    const result = await this.collection().updateOne(
      { trainerId },
      { 
        $set: { 
          'phone.verified': true,
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }
}

module.exports = KYCVerification;
