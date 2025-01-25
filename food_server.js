const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const port=3000;
const app = express();
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Client } = require('pg');
app.use(cors());


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Malav@04',
    database: process.env.DB_NAME || 'food_data'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the database.');
});

//Code
app.get("/categories", (req, res) => {
  const search = req.query.search || "";
  const query = "SELECT DISTINCT category FROM food WHERE category LIKE ?";
  db.query(query,[`%${search}%`],(err, results) => {
    if (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ error: "Failed to fetch categories" });
    } else{
    // Send the categories as JSON
    res.json(results);
  }
  });
});

// Endpoint to get descriptions for a specific category
app.get("/descriptions", (req, res) => {
  const { category } = req.query;

  // Validate category
  if (!category) {
    return res.status(400).json({ message: "Category is required." });
  }

  const query = "SELECT DISTINCT description FROM food WHERE category = ?";
  db.query(query, [category], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    // Send the descriptions as JSON
    res.json(results);
  });
}); //
// Endpoint to fetch data by category and description
app.get('/food', (req, res) => {
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
     console.log('Description:', `%${description}%`);
     console.log('Executing query:', query, [category, `%${description}%`]);

    db.query(query, [category, searchDescription], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.length === 0) {
      return res.status(404).json({ message: "No data found for the given inputs." });
    }
        console.log('Query results:', results);
        res.json(results);
    });
});
// Endpoint to update food amount
app.put('/update-food', (req, res) => {
    const { category, description, newAmount } = req.body;

    if (!category || !description || !newAmount) {
        return res.status(400).json({ error: 'Category, Description, and New Amount are required.' });
    }

    const query = `
        UPDATE food 
        SET amount = ? 
        WHERE category = ? AND description = ?`;

    db.query(query, [newAmount, category, description], (err, result) => {
        if (err) {
            console.error('Error updating food amount:', err);
            res.status(500).json({ error: 'Failed to update food amount.' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ message: 'No matching record found to update.' });
        } else {
            res.json({ message: 'Food amount updated successfully.' });
        }
    });
});

// Endpoint to calculate nutritional values based on amount
app.post('/calculate-nutrition', (req, res) => {
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

  db.query(query, [category, description], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found for the given inputs." });
    }

    const food = results[0];
    const multiplier = amount / 100;

    const calculatedNutrition = {
      description: food.description,
      protein: (food.proteinPer100g * multiplier).toFixed(2),
      carbs: (food.carbsPer100g * multiplier).toFixed(2),
      fats: (food.fatsPer100g * multiplier).toFixed(2),
      calories: (food.caloriesPer100g * multiplier).toFixed(2),
    };

    res.json(calculatedNutrition);
  });
});
// Feedback route
app.post('/feedback', (req, res) => {
    const feedback = req.body.feedback;
    const feedbackFilePath = path.join(__dirname, 'feedback.txt');

    fs.appendFile(feedbackFilePath, `${feedback}\n`, (err) => {
        if (err) {
           console.error('Error saving feedback:', err);
        return res.status(500).send('Error saving feedback'); // First response
        } 
         res.send('Feedback submitted successfully!');
    });
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});