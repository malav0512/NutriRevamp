const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const port= process.env.PORT||3000 ;
const app = express();
const path = require('path');
const fs = require('fs');
const cors = require('cors');
app.use(cors());


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL connection
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/', async(req, res) => {
  res.send('Welcome to the NutriRevamp API!');
});

app.use(cors({
  origin: 'https://malav0512.github.io',
  credentials: true
}));

app.options('*', cors());

// Connect to the database
console.log("Server port:", port);
console.log("Database URL:", process.env.DATABASE_URL);
pgClient.connect()
  .then(() => console.log('Connected to PostgreSQL database.'))
  .catch(err => console.error('Database connection failed:', err));

  
app.use(express.json());
//Code
app.get("/categories", async(req, res) => {
  const search = req.query.search || "";
  const query = "SELECT DISTINCT category FROM food WHERE category ILIKE $1";
  try {
    const result = await pgClient.query(query, [`%${search}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Endpoint to get descriptions for a specific category
app.get("/descriptions", async(req, res) => {
  const { category } = req.query;

  // Validate category
  
  if (!category) {
    return res.status(400).json({ message: "Category is required." });
  }

  const query = "SELECT DISTINCT description FROM food WHERE category = $1";
  try {
    const result = await pgClient.query(query, [category]);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
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
        WHERE category = $1 AND description ILIKE $2`;

     const searchDescription = `%${description}%`; // Add wildcards for partial matching
     console.log('Category:', category);
     console.log('Description:', searchDescription);
     console.log('Executing query:', query, [category, searchDescription]);

     try {
      const result = await pgClient.query(query, [category, searchDescription]);
      if (result.rows.length === 0) return res.status(404).json({ message: "No data found." });
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
// Endpoint to update food amount
app.put('/update-food', async(req, res) => {
    const { category, description, newAmount } = req.body;

    if (!category || !description || !newAmount) {
        return res.status(400).json({ error: 'Category, Description, and New Amount are required.' });
    }

    const query = `
        UPDATE food 
        SET amount = $1 
        WHERE category = $2 AND description = $3`;

        try {
          const result = await pgClient.query(query, [newAmount, category, description]);
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
    WHERE category = $1 AND description = $2`;

    try {
      const result = await pgClient.query(query, [category, description]);
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

const feedbackFilePath = 'C:/Users/Dharmen/Desktop/Projects/Project_calorie_meter/feedback.txt';

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
// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});