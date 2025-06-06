document.addEventListener("DOMContentLoaded", () => {
  // Fetch categories and populate the category dropdown
  fetchCategories();
  initializeWeightInput();
});

let foodItems = [];
 // Array to store multiple food items

function fetchCategories() {
  fetch("https://nutrirevamp-1.onrender.com/categories")
    .then((response) => response.json())
    .then((data) => {
      const categorySelect = document.getElementById("food-category");
      data.forEach((category) => {
        const upperCategory = category.category.toUpperCase();
        const option = document.createElement("option");
        option.value = upperCategory;
        option.textContent = upperCategory;
        categorySelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });
}

  // Event listener for category selection
  document.getElementById("food-category").addEventListener("input", (event) => {
    const query = event.target.value.trim();
  if (query.length > 0) {
    fetch(`https://nutrirevamp-1.onrender.com/categories?search=${encodeURIComponent(query)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        return response.json();
      })
      .then((data) => {
        const suggestionsDiv = document.getElementById("category-suggestions");
        suggestionsDiv.innerHTML = ""; // Clear previous suggestions

         if (data.length === 0) {
          suggestionsDiv.innerHTML = "<div class='suggestion-item'>No categories found</div>";
        }

        data.forEach((item) => {
          const suggestion = document.createElement("div");
          suggestion.className = "suggestion-item";
          suggestion.textContent = item.category;
          suggestion.addEventListener("click", () => {
            document.getElementById("food-category").value = item.category;
            suggestionsDiv.innerHTML = ""; // Clear suggestions
            fetchDescriptions(item.category); // Fetch descriptions for the selected category
          });
          suggestionsDiv.appendChild(suggestion);
        });
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  } else {
    document.getElementById("category-suggestions").innerHTML = ""; // Clear suggestions if input is empty
  }
});

  function fetchDescriptions(category) {
  fetch(`https://nutrirevamp-1.onrender.com/descriptions?category=${category}`)
    .then((response) => response.json())
    .then((data) => {
      const descriptionSelect = document.getElementById("food-description");
      descriptionSelect.innerHTML = "<option value=''>Select a description</option>"; // Clear existing options

      data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.description;
        option.textContent = item.description;
        descriptionSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching descriptions:", error);
    });
}

  // Event listener for fetching nutritional info
  document.getElementById("fetch-nutrition").addEventListener("click", () => {
    const category = document.getElementById("food-category").value;
    const description = document.getElementById("food-description").value;
    const quantity = parseFloat(document.getElementById("food-quantity").value);
    // Validate inputs
    if (!category || !description || isNaN(quantity) || quantity <= 0) {
    alert("Please select a category, description, and enter a valid quantity.");
    return;
  }
  // Fetch data from the API
  fetch(`https://nutrirevamp-1.onrender.com/food?category=${category}&description=${encodeURIComponent(description)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch data. Please check your inputs or try again later.");
      }
      return response.json();
    })
    .then((data) => {
      // Display the nutritional details
      if (data && data.length > 0) {
        const food = data[0];
         // Calculate values based on quantity
         const protein = (food["Data.Protein"] * quantity) / 100;
        const carbs = (food["Data.Carbohydrate"] * quantity) / 100;
        const fats = (food["Data.Fat.Total Lipid"] * quantity) / 100;
        const calories = (food["Data.Kilocalories"] * quantity) / 100;

         // Add the food item to the array
        foodItems.push({
          name: food["description"] || "N/A",
          quantity,
          protein,
          carbs,
          fats,
          calories,
        });

        // Update UI with the new food item
        updateNutritionDisplay();
        
      } else {
        alert("No data found for the given inputs.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert(error.message);
    });
});

// Function to update the nutritional display
function updateNutritionDisplay() {
  const nutritionInfoDiv = document.getElementById("nutrition-info");
  const totalNutritionDiv = document.getElementById("total-nutrition");

  // Clear the current display
  nutritionInfoDiv.innerHTML = "<h3>Individual Nutritional Details:</h3>";
  totalNutritionDiv.innerHTML = "<h3>Total Nutritional Info:</h3>";

  // Display individual food items
  foodItems.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "food-item";
    itemDiv.innerHTML += `
      <p><strong>Food ${index + 1}:</strong> ${item.name} (${item.quantity}g)</p>
      <p>Protein: ${item.protein.toFixed(2)}g</p>
      <p>Carbs: ${item.carbs.toFixed(2)}g</p>
      <p>Fats: ${item.fats.toFixed(2)}g</p>
      <p>Calories: ${item.calories.toFixed(2)} kcal</p>
      <button class="remove-button" onclick="removeItem(${index})">Remove</button>
      <hr>
    `;
    nutritionInfoDiv.appendChild(itemDiv);
  });

  // Calculate total nutritional values
  const total = foodItems.reduce(
    (sum, item) => {
      sum.protein += item.protein;
      sum.carbs += item.carbs;
      sum.fats += item.fats;
      sum.calories += item.calories;
      return sum;
    },
    { protein: 0, carbs: 0, fats: 0, calories: 0 }
  );

  // Display total nutritional values
  totalNutritionDiv.innerHTML += `
    <p><strong>Total Protein:</strong> ${total.protein.toFixed(2)}g</p>
    <p><strong>Total Carbs:</strong> ${total.carbs.toFixed(2)}g</p>
    <p><strong>Total Fats:</strong> ${total.fats.toFixed(2)}g</p>
    <p><strong>Total Calories:</strong> ${total.calories.toFixed(2)} kcal</p>
  `;
}
// Function to remove an item from the list
function removeItem(index) {
  // Remove the item from the foodItems array
  foodItems.splice(index, 1);

  // Update the nutritional display
  updateNutritionDisplay();
}
// Initialize weight input functionality
function initializeWeightInput() {
  const weightInput = document.getElementById("weight-input");
  weightInput.addEventListener("input", () => {
    const weightValue = parseFloat(weightInput.value);
    if (isNaN(weightValue) || weightValue <= 0) {
      console.error("Please enter a valid weight in kilograms.");
    }
  });
}

// Call the function to initialize the weight input functionality
initializeWeightInput();

function showContent(section) {
  // Hide all content sections
  console.log("Clicked section:", section); // Debug: Logs the clicked section
  document.getElementById("protein-content").classList.add("d-none");
  document.getElementById("fats-content").classList.add("d-none");
  document.getElementById("carbs-content").classList.add("d-none");

  // Show the selected content section
  const selectedContent = document.getElementById(`${section}-content`);
  console.log("Selected content:", selectedContent); 
  if (selectedContent) {
    selectedContent.classList.remove("d-none");
  }
}
document.addEventListener('DOMContentLoaded', () => {
  
const button = document.getElementById("nutritional-info");

  if (button) {
    button.addEventListener("click", () => {
      console.log("Show details button clicked");

      // Get user inputs
      const weightInput = document.getElementById("weight-input").value;
      const weight = parseFloat(weightInput); // Weight in kg

      if (isNaN(weight) || weight <= 0) {
        alert("Please enter a valid weight in kilograms.");
        return;
      }
      totalCalories=2500;
      // Calculate nutritional values
      const protein = 0.8 * weight; // Protein = 0.8g per kg of body weight
      const fats = (0.25 * totalCalories) / 9; // Fats = 25% of daily calories (1g fat = 9 kcal)
      const carbohydrates = (0.5 * totalCalories) / 4; // Carbs = 50% of daily calories (1g carb = 4 kcal)

      // Log calculated values for debugging
      console.log("Weight:", weight, "kg");
      console.log("Total Calories:", totalCalories, "kcal");
      console.log("Protein:", protein.toFixed(2), "g");
      console.log("Fats:", fats.toFixed(2), "g");
      console.log("Carbohydrates:", carbohydrates.toFixed(2), "g");

      // Update the "Calculated Nutritional Values" section
      document.getElementById("protein-value").textContent = protein.toFixed(2);
      document.getElementById("fats-value").textContent = fats.toFixed(2);
      document.getElementById("carbs-value").textContent = carbohydrates.toFixed(2);
    });
  } else {
    console.error("Button with ID 'nutritional-info' not found");
  }

  document.getElementById('feedback-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission
  
    const feedback = event.target.feedback.value;
  
    try {
      // Send feedback to the server
      const response = await fetch('https://nutrirevamp-1.onrender.com/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
  
      if (response.ok) {
        alert('Your feedback submitted successfully!');
        window.location.href = 'https://malav0512.github.io/NutriRevamp/'; // Redirect to the homepage
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  });
});