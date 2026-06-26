/**
 * Har naya adapter is template ko follow karega.
 * Is file ko copy karke naya adapter banao.
 */
class AdapterTemplate {
  /**
   * Main provider processing function.
   * Must be overridden by adapter implementation.
   * @param {Object} inputData
   * @param {Object} options
   */
  async process(inputData, options = {}) {
    throw new Error('process() must be implemented by adapter');
  }

  /**
   * Provider health status check.
   * Must be overridden by adapter implementation.
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by adapter');
  }
}

module.exports = AdapterTemplate;
