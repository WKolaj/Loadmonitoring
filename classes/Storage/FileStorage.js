const Storage = require("./Storage");
const Joi = require("joi");
const {
  writeFileAsync,
  exists,
  checkIfFileExistsAsync,
  readFileAsync
} = require("../../utilities/utilities");

const initPayloadSchema = Joi.object().keys({
  filePath: Joi.string()
    .min(1)
    .required()
});

class FileStorage extends Storage {
  /**
   * Method for initializing storage
   */
  async aInit(payload) {
    let { filePath } = payload;

    let { error } = Joi.validate(payload, initPayloadSchema);
    if (error) throw new Error(error);

    this._filePath = filePath;
  }

  /**
   * @description Path to file containing storage
   */
  get FilePath() {
    return this._filePath;
  }

  /**
   * Method for saving content of storage
   * @param {Object} payload Payload that should be saved
   */
  async aSave(payload) {
    if (!exists(payload)) payload = {};

    return writeFileAsync(this.FilePath, JSON.stringify(payload), {
      encoding: "utf8"
    });
  }

  /**
   * Method for loading content from storage
   */
  async aLoad() {
    if (await checkIfFileExistsAsync(this.FilePath)) {
      //Returning file content if it exists
      let fileContent = await readFileAsync(this.FilePath, {
        encoding: "utf8"
      });
      if (exists(fileContent)) return JSON.parse(fileContent);
    }

    //Returning empty object if file does not exist or is empty
    return {};
  }
}

module.exports = FileStorage;
