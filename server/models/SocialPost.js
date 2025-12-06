const { getDatabase } = require('../config/database');
const { ObjectId } = require('mongodb');

class SocialPost {
  static collection() {
    return getDatabase().collection('social_posts');
  }

  static async create(postData) {
    const post = {
      ...postData,
      likes: postData.likes || [],
      comments: postData.comments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.collection().insertOne(post);
    return { ...post, _id: result.insertedId };
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

  static async findAll(limit = 50) {
    return await this.collection()
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
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

  static async addLike(postId, userId) {
    const result = await this.collection().updateOne(
      { _id: new ObjectId(postId) },
      { 
        $addToSet: { likes: userId },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  static async removeLike(postId, userId) {
    const result = await this.collection().updateOne(
      { _id: new ObjectId(postId) },
      { 
        $pull: { likes: userId },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  static async addComment(postId, comment) {
    const result = await this.collection().updateOne(
      { _id: new ObjectId(postId) },
      { 
        $push: { 
          comments: {
            ...comment,
            id: new ObjectId().toString(),
            createdAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  static async delete(id) {
    const result = await this.collection().deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

module.exports = SocialPost;
