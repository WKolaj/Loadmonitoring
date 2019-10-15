class Storage {
  constructor() {
    this._initialized = false;
  }

  /**
   * Is storage initialized
   */
  get Initialized() {
    return this._initialized;
  }

  /**
   * Method for saving content of storage
   * @param {Object} payload Payload that should be saved
   */
  async save(payload) {
    if (!this.Initialized) throw new Error("Storage has not been initialized");

    return this.aSave(payload);
  }

  /**
   * Method for loading content from storage
   */
  async load() {
    if (!this.Initialized) throw new Error("Storage has not been initialized");

    return this.aLoad();
  }

  /**
   * Method for initializing storage
   */
  async init(payload) {
    if (this.Initialized) return;

    await this.aInit(payload);
    this._initialized = true;
  }

  /**
   * Method for initializing storage - should be override in child classses
   */
  async aInit(payload) {
    throw new Error("Method not implemented");
  }

  /**
   * Method for saving content of storage - should be override in child classses
   * @param {Object} payload Payload that should be saved
   */
  async aSave(payload) {
    throw new Error("Method not implemented");
  }

  /**
   * Method for loading content from storage - should be override in child classses
   */
  async aLoad() {
    throw new Error("Method not implemented");
  }
}

module.exports = Storage;
