const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class User {
  static collection() {
    return getDatabase().collection('users');
  }

  static async create(userData) {
    const user = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(user);
    return { ...user, _id: result.insertedId };
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

  static async delete(id) {
    const result = await this.collection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  static async findAll(filter = {}) {
    return await this.collection().find(filter).toArray();
  }
}

module.exports = User;
