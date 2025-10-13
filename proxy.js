const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors()); // Autorise toutes les origines (pour développement)

const TOKEN = 'e9543b60ccd2421899eea7d5021bcbbb64fc50bb';

app.get('/api/proxy/transactions', async (req, res) => {
  const { emp_code = '', start_time, end_time } = req.query;
  try {
    const response = await axios.get('http://54.37.15.111:80/iclock/api/transactions/', {
      params: { emp_code, start_time, end_time },
      headers: {
        'Authorization': `Token ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
});

app.listen(3001, () => console.log('Proxy running on port 3001')); 