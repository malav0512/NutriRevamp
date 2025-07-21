const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const mysql = require('mysql2');
const port= process.env.PORT||3000 ;
const app = express();
const path = require('path');
const fs = require('fs');
const cors = require('cors');
// Middleware
app.use(cors({
  origin: 'https://malav0512.github.io',
  credentials: true
}));
app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// ✅ MySQL (Railway) connection
const connection = mysql.createConnection({
  host: "maglev.proxy.rlwy.net",
  user: "root",
  password: "ZxhzzFyJGovPiBeAgpciduuFAziPGcsh",  // ⚠️ Put in .env
  database: "railway",
  port: 18307,
  ssl: {
    rejectUnauthorized: false
  }
});

connection.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
    return;
  }
  console.log("✅ Connected to Railway MySQL!");
});

// ✅ Test route
app.get('/', (req, res) => {
  res.send('Welcome to the NutriRevamp API!');
});
//Code
app.get("/categories", async(req, res) => {
  const search = req.query.search || "";
  const query = "SELECT DISTINCT category FROM food WHERE category LIKE ?";
  const values = [`%${search}%`];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error("Error fetching categories:", err);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
    res.json(results);
  });
});

// Endpoint to get descriptions for a specific category
app.get("/descriptions", async(req, res) => {
  const { category } = req.query;

  // Validate category
  
  if (!category) {
    return res.status(400).json({ message: "Category is required." });
  }

  const query = "SELECT DISTINCT description FROM food WHERE category = ?";
 connection.query(query, [category], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.json(results);
     });
});//
// Endpoint to fetch data by category and description
app.get('/food', async(req, res) => {
    const { category, description } = req.query;
    console.log("Category received:", category);
    console.log("Description received:", description);

    if (!category || !description) {
        return res.status(400).json({ error: 'Category and Description are required.' });
    }

    const query = `
        SELECT *
        FROM food
        WHERE category = ? AND description LIKE ?`;

     const searchDescription = `%${description}%`; // Add wildcards for partial matching
     console.log('Category:', category);
     console.log('Description:', searchDescription);
     console.log('Executing query:', query, [category, searchDescription]);

     connection.query(query, [category, searchDescription], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found." });
    }

    res.json(results);
  });
  });
// Endpoint to update food amount
app.put('/update-food', async(req, res) => {
    const { category, description, newAmount } = req.body;

    if (!category || !description || !newAmount) {
        return res.status(400).json({ error: 'Category, Description, and New Amount are required.' });
    }

    const query = `
        UPDATE food 
        SET amount = ? 
        WHERE category = ? AND description = ?`;

        try {
          const result = await connection.query(query, [newAmount, category, description]);
          if (result.rowCount === 0) return res.status(404).json({ message: 'No matching record found.' });
          res.json({ message: 'Food amount updated successfully.' });
        } catch (err) {
          console.error('Error updating food amount:', err);
          res.status(500).json({ error: 'Failed to update food amount.' });
        }
      });

// Endpoint to calculate nutritional values based on amount
app.post('/calculate-nutrition', async(req, res) => {
  const { category, description, amount } = req.body;

  if (!category || !description || !amount) {
    return res.status(400).json({ error: 'Category, Description, and Amount are required.' });
  }

  const query = `
    SELECT description, 
           Data.Protein AS proteinPer100g, 
           Data.Carbohydrate AS carbsPer100g, 
           Data.Fat.Total Lipid AS fatsPer100g, 
           Data.Kilocalories AS caloriesPer100g
    FROM food 
    WHERE category = ? AND description = ?`;

    try {
      const result = await connection.query(query, [category, description]);
      if (result.rows.length === 0) return res.status(404).json({ message: "No data found." });
  
      const food = result.rows[0];
      const multiplier = amount / 100;
  
      const calculatedNutrition = {
        description: food.description,
        protein: (food.proteinper100g * multiplier).toFixed(2),
        carbs: (food.carbsper100g * multiplier).toFixed(2),
        fats: (food.fatsper100g * multiplier).toFixed(2),
        calories: (food.caloriesper100g * multiplier).toFixed(2),
      };
  
      res.json(calculatedNutrition);
    } catch (err) {
      console.error('Error calculating nutrition:', err);
      res.status(500).json({ error: 'Failed to calculate nutrition.' });
    }
  });

  const feedbackFilePath = path.join(__dirname, 'feedback.txt');

// Feedback route
app.post('/feedback', (req, res) => {
    const feedback = req.body.feedback;
    console.log('Received feedback:', feedback);
    console.log('Saving feedback to:', feedbackFilePath);

    fs.appendFile(feedbackFilePath, `${feedback}\n`, (err) => {
        if (err) {
           console.error('Error saving feedback:', err);
        return res.status(500).send('Error saving feedback'); // First response
        } 
        console.log('Feedback saved successfully');
        res.send('Feedback submitted successfully!');
    });
});
app.get('/download-feedback', (req, res) => {
  const filePath = path.join(__dirname, 'feedback.txt');

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('Feedback file not found.');
    }

    res.download(filePath, 'feedback.txt', (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading the file.');
      }
    });
  });
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});