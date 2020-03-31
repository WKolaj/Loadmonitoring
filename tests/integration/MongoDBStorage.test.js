const MongoDBStorage = require("../../classes/Storage/MongoDBStorage");
const mongoose = require("mongoose");
const testDBConnectionString =
  "mongodb://testLoadmonitoringUser:loadmonitoring1234@localhost:27017/loadmonitoringDevelop";
const testDBCollectionName = "testDBCollection";

//Setting jest timeout to 60s - waiting for mongoDB connection timeout
jest.setTimeout(60000);

describe("MongoDBStorage", () => {
  let clearTestDBCollectionAndCloseConnection = async () => {
    //Connecting to db
    let db = await mongoose.connect(testDBConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    //creating temporary model for collection
    let TestDBCModel = db.model("collectionToDelete", {}, testDBCollectionName);

    //deleting all documents from collection
    await TestDBCModel.deleteMany({});

    //Deleting model from mongoose - error when trying to create new model for mongoose with the same name
    delete mongoose.connection.deleteModel("collectionToDelete");

    //Disconnecting from db
    await db.disconnect();
  };

  let saveDataToTestDBCollection = async data => {
    //Connecting to db
    let db = await mongoose.connect(testDBConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    //creating temporary model for collection
    let TestDBCModel = db.model(
      "dataToAdd",
      { payload: String },
      testDBCollectionName
    );

    let testDBObject = new TestDBCModel({
      payload: JSON.stringify(data)
    });

    await testDBObject.save();

    //Deleting model from mongoose - error when trying to create new model for mongoose with the same name
    delete mongoose.connection.deleteModel("dataToAdd");
  };

  let loadDataFromTestDBCollection = async () => {
    //Connecting to db
    let db = await mongoose.connect(testDBConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    //creating temporary model for collection
    let TestDBCModel = db.model(
      "dataToLoad",
      { payload: String },
      testDBCollectionName
    );

    let elements = (await TestDBCModel.find(() => true)).map(element =>
      JSON.parse(element.payload)
    );

    //Deleting model from mongoose - error when trying to create new model for mongoose with the same name
    delete mongoose.connection.deleteModel("dataToLoad");

    return elements;
  };

  beforeEach(async () => {
    await clearTestDBCollectionAndCloseConnection();
  });

  afterEach(async () => {
    await clearTestDBCollectionAndCloseConnection();
  });

  describe("constructor", () => {
    let exec = () => {
      return new MongoDBStorage();
    };

    it("should create new MongoDBStorage object", () => {
      let result = exec();
      expect(result).toBeDefined();
    });

    it("should set Initialized to false", () => {
      let result = exec();
      expect(result.Initialized).toEqual(false);
    });
  });

  describe("init", () => {
    let storage;
    let initPayload;

    beforeEach(async () => {
      initPayload = {
        connectionString: testDBConnectionString,
        collectionName: testDBCollectionName
      };
    });

    let exec = async () => {
      storage = new MongoDBStorage();
      return storage.init(initPayload);
    };

    it("should set Initialized to true", async () => {
      await exec();
      expect(storage.Initialized).toEqual(true);
    });

    it("should set collection name and connection string", async () => {
      await exec();

      expect(storage.ConnectionString).toBeDefined();
      expect(storage.ConnectionString).toEqual(testDBConnectionString);

      expect(storage.CollectionName).toBeDefined();
      expect(storage.CollectionName).toEqual(testDBCollectionName);
    });

    it("should generate new document schema name and schema", async () => {
      await exec();

      expect(storage.DocumentSchemaName).toBeDefined();
      expect(storage.DocumentSchema).toBeDefined();
    });

    it("should generate new document schema different for every storage", async () => {
      await exec();
      let schemaName1 = storage.DocumentSchemaName;

      await exec();
      let schemaName2 = storage.DocumentSchemaName;

      await exec();
      let schemaName3 = storage.DocumentSchemaName;

      expect(schemaName1).toBeDefined();
      expect(schemaName2).toBeDefined();
      expect(schemaName3).toBeDefined();

      expect(schemaName1).not.toEqual(schemaName2);
      expect(schemaName2).not.toEqual(schemaName3);
      expect(schemaName3).not.toEqual(schemaName1);
    });

    it("should connect to database with mongoose", async () => {
      await exec();

      expect(mongoose.connection.readyState).toEqual(1);
    });

    it("should throw if initPayload does not have connection string ", async () => {
      delete initPayload.connectionString;

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      expect(storage.Initialized).toEqual(false);
    });

    it("should throw if initPayload has empty connection string", async () => {
      initPayload.connectionString = null;

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      expect(storage.Initialized).toEqual(false);
    });

    it("should throw if initPayload has no collection name", async () => {
      initPayload.collectionName = null;

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      expect(storage.Initialized).toEqual(false);
    });

    it("should throw if initPayload has empty collection name", async () => {
      initPayload.collectionName = null;

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      expect(storage.Initialized).toEqual(false);
    });

    it("should throw if connection to mongoDB is impossible - invalid credentials", async () => {
      initPayload.connectionString =
        "mongodb://fakeUser:fakePassword@localhost:27017/loadmonitoringDevelop";

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      expect(storage.Initialized).toEqual(false);
    });

    it("should throw if connection to mongoDB is impossible - invalid database", async () => {
      initPayload.connectionString =
        "mongodb://testLoadmonitoringUser:loadmonitoring1234@localhost:27017/fakeDatabase";

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      expect(storage.Initialized).toEqual(false);
    });

    it("should throw if connection to mongoDB is impossible - invalid port", async () => {
      initPayload.connectionString =
        "mongodb://testLoadmonitoringUser:loadmonitoring1234@localhost:10000/loadmonitoringDevelop";

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();

      expect(storage.Initialized).toEqual(false);
    });
  });

  describe("load", () => {
    let storage;
    let init;
    let initPayload;
    let initialData;
    let saveInitialData;

    beforeEach(async () => {
      init = true;
      initPayload = {
        connectionString: testDBConnectionString,
        collectionName: testDBCollectionName
      };
      saveInitialData = true;
      initialData = {
        value1: "text1",
        value2: "text2",
        value3: "text3"
      };
    });

    let exec = async () => {
      storage = new MongoDBStorage();
      if (init) await storage.init(initPayload);
      if (saveInitialData) await saveDataToTestDBCollection(initialData);

      return storage.load();
    };

    it("should load data from database", async () => {
      let data = await exec();

      expect(data).toEqual(initialData);
    });

    it("should load data from database if load is called several times", async () => {
      let data1 = await exec();
      let data2 = await storage.load();

      expect(data1).toEqual(initialData);
      expect(data2).toEqual(initialData);
    });

    it("should load data from database if data is a single string", async () => {
      initialData = "testString";

      let data = await exec();

      expect(data).toEqual(initialData);
    });

    it("should load data from database if data is a single number", async () => {
      initialData = 123;

      let data = await exec();

      expect(data).toEqual(initialData);
    });

    it("should load last document as data from database if there is more documents in collection", async () => {
      let dataToSaveBefore = {
        value1: "text1",
        value2: "text2",
        value3: "text3"
      };

      await saveDataToTestDBCollection(dataToSaveBefore);

      initialData = {
        value4: "text4",
        value5: "text5",
        value6: "text6"
      };

      let data = await exec();

      expect(data).toEqual(initialData);
    });

    it("should return null if data is null", async () => {
      initialData = null;
      let data = await exec();

      expect(data).toBeNull();
    });

    it("should return null if data has not been saved inside db", async () => {
      saveInitialData = false;
      let data = await exec();

      expect(data).toBeNull();
    });

    it("should throw if storage has not been initialized", async () => {
      init = false;

      await expect(
        new Promise(async (resolve, reject) => {
          try {
            await exec();
            return resolve(true);
          } catch (err) {
            return reject(err);
          }
        })
      ).rejects.toBeDefined();
    });
  });

  describe("save", () => {
    let storage;
    let init;
    let initPayload;
    let initialData;
    let saveInitialData;
    let dataToSave;

    beforeEach(async () => {
      init = true;
      initPayload = {
        connectionString: testDBConnectionString,
        collectionName: testDBCollectionName
      };
      saveInitialData = true;
      initialData = {
        value1: "text1",
        value2: "text2",
        value3: "text3"
      };
      dataToSave = {
        value4: "text4",
        value5: "text5",
        value6: "text6"
      };
    });

    let exec = async () => {
      storage = new MongoDBStorage();
      if (init) await storage.init(initPayload);
      if (saveInitialData) await saveDataToTestDBCollection(initialData);

      return storage.save(dataToSave);
    };

    it("should save data to database", async () => {
      await exec();

      let dataInDB = await loadDataFromTestDBCollection();

      expect(dataInDB).toBeDefined();
      expect(dataInDB.length).toEqual(1);
      expect(dataInDB[0]).toEqual(dataToSave);
    });

    it("should save data to database - if data is null", async () => {
      dataToSave = null;

      await exec();

      let dataInDB = await loadDataFromTestDBCollection();

      expect(dataInDB).toBeDefined();
      expect(dataInDB.length).toEqual(1);
      expect(dataInDB[0]).toEqual(dataToSave);
    });

    it("should save data to database - if data has not yet been saved", async () => {
      saveInitialData = false;

      await exec();

      let dataInDB = await loadDataFromTestDBCollection();

      expect(dataInDB).toBeDefined();
      expect(dataInDB.length).toEqual(1);
      expect(dataInDB[0]).toEqual(dataToSave);
    });

    it("should save data to database - if data is a simple string", async () => {
      dataToSave = "testData";

      await exec();

      let dataInDB = await loadDataFromTestDBCollection();

      expect(dataInDB).toBeDefined();
      expect(dataInDB.length).toEqual(1);
      expect(dataInDB[0]).toEqual(dataToSave);
    });

    it("should save data to database - if data is a simple number", async () => {
      dataToSave = 1234;

      await exec();

      let dataInDB = await loadDataFromTestDBCollection();

      expect(dataInDB).toBeDefined();
      expect(dataInDB.length).toEqual(1);
      expect(dataInDB[0]).toEqual(dataToSave);
    });
  });
});
