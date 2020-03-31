const Storage = require("./Storage");
const Joi = require("joi");
const { exists } = require("../../utilities/utilities");
const mongoose = require("mongoose");

const initPayloadSchema = Joi.object().keys({
  connectionString: Joi.string().required(),
  collectionName: Joi.string().required()
});

const collectionPayloadSchema = {
  payload: String
};

class MongoDBStorage extends Storage {
  /**
   * Method for initializing storage
   */
  async aInit(payload) {
    let { error } = Joi.validate(payload, initPayloadSchema);
    if (error) throw new Error(error);

    let { connectionString, collectionName } = payload;

    this._db = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    this._connectionString = connectionString;
    this._collectionName = collectionName;

    //Generating random schema name - every schema should have different name
    this._documentSchemaName = mongoose.Types.ObjectId();

    this._documentSchema = this.DB.model(
      this.DocumentSchemaName,
      collectionPayloadSchema,
      collectionName
    );
  }

  /**
   * @description Database object
   */
  get DB() {
    return this._db;
  }

  /**
   * @description Connection string to mongoDB
   */
  get ConnectionString() {
    return this._connectionString;
  }

  /**
   * @description Collection name for storing data
   */
  get CollectionName() {
    return this._collectionName;
  }

  /**
   * @description Name of document schema
   */
  get DocumentSchemaName() {
    return this._documentSchemaName;
  }

  /**
   * @description Schema of document
   */
  get DocumentSchema() {
    return this._documentSchema;
  }

  /**
   * @description Method for disconnecting from database
   */
  async disconnect() {
    return this.DB.disconnect();
  }

  /**
   * @description Method for connecting to database
   */
  async connect() {
    return this.DB.connect(this.ConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
  }

  /**
   * Method for saving content of storage
   * @param {Object} payload Payload that should be saved
   */
  async aSave(payload) {
    //Removing all documents
    await this.DocumentSchema.deleteMany({});
    let document = new this.DocumentSchema({
      payload: JSON.stringify(payload)
    });
    await document.save();
  }

  /**
   * Method for loading content from storage
   */
  async aLoad() {
    //Finding all document than grabbing last one - find one search for first not last index
    let allDocuments = await this.DocumentSchema.find({});

    //Returning null if there are no documents
    if (!exists(allDocuments) || allDocuments.length <= 0) return null;

    //Getting last document
    let result = allDocuments[allDocuments.length - 1];

    if (exists(result) && exists(result.payload))
      return JSON.parse(result.payload);
    else return null;
  }
}

module.exports = MongoDBStorage;
