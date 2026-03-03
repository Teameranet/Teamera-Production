// Hello Controller - Basic endpoint for API health and greeting

const helloController = {
  /**
   * GET /api/hello
   * Returns a greeting message
   */
  getHello: (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Hello from Teamera API!',
        data: {
          greeting: 'Welcome to Teamera',
          version: '1.0.0',
          documentation: '/api'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in getHello:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

export default helloController;
